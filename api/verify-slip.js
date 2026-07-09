// api/verify-slip.js — Vercel Serverless Function
// ตรวจสอบสลิปโอนเงินสำหรับรายงาน 199฿ ผ่าน SlipOK API (https://slipok.com)
//
// ต้องตั้งค่า 2 environment variables ก่อนใช้งานจริง (สมัครได้ที่ slipok.com):
//   SLIPOK_API_KEY    — API key จาก SlipOK
//   SLIPOK_BRANCH_ID  — Branch ID จาก SlipOK
// ถ้ายังไม่ได้ตั้งค่า ระบบจะรับสลิปไว้แล้วตอบกลับแบบ "รอแอดมินตรวจสอบด้วยมือ" โดยไม่ error
// (ยังใช้งานได้ปกติ เพียงแต่ไม่ auto-verify)
//
// นโยบายตรวจสอบ: ยึดตามที่ตกลงไว้ — ถ้าสลิปเป็นของจริง (โอนมาจริง) ถือว่าผ่าน
// แม้ยอดจะไม่ตรง 199 บาทเป๊ะ ก็ไม่ปฏิเสธทันที (แค่แจ้งยอดที่อ่านได้กลับไปเป็นข้อมูล)

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '8mb',
    },
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { slipB64, slipMime, ref, amount } = req.body || {};

  if (!slipB64) {
    return res.status(400).json({ error: 'Missing slip image' });
  }

  const MAX_B64_BYTES = 8 * 1024 * 1024; // ~6MB raw image
  if (slipB64.length > MAX_B64_BYTES) {
    return res.status(413).json({ error: 'ไฟล์สลิปใหญ่เกินไป กรุณาลดขนาดก่อนส่ง (ไม่เกิน 6MB)' });
  }
  const ALLOWED_MIME = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (slipMime && !ALLOWED_MIME.includes(slipMime)) {
    return res.status(400).json({ error: 'รองรับเฉพาะไฟล์ภาพ JPEG, PNG, WEBP เท่านั้น' });
  }

  // ── Rate limiting — เบากว่า analyze.js เพราะไม่ได้เรียก LLM แต่ยังเสียเงินต่อครั้งกับ SlipOK ──
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
  const WINDOW_MS = 10 * 60 * 1000;
  const MAX_CALLS = 8;
  try {
    if (!global._slipRateMap) global._slipRateMap = new Map();
    const now = Date.now();
    const entry = global._slipRateMap.get(ip) || { count: 0, start: now };
    if (now - entry.start > WINDOW_MS) { entry.count = 0; entry.start = now; }
    entry.count++;
    global._slipRateMap.set(ip, entry);
    if (entry.count > MAX_CALLS) {
      return res.status(429).json({ error: 'ส่งสลิปบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่' });
    }
  } catch (rateErr) {
    console.error('Rate limit check error:', rateErr.message);
  }

  const SLIPOK_API_KEY = process.env.SLIPOK_API_KEY;
  const SLIPOK_BRANCH_ID = process.env.SLIPOK_BRANCH_ID;

  // ── ยังไม่ได้ตั้งค่า SlipOK — รับสลิปไว้ ให้แอดมินตรวจเอง (ไม่บล็อกผู้ใช้) ──
  if (!SLIPOK_API_KEY || !SLIPOK_BRANCH_ID) {
    console.log('[verify-slip] received, manual review mode. ref =', ref);
    return res.status(200).json({ ok: true, verified: null, mode: 'manual' });
  }

  try {
    const buffer = Buffer.from(slipB64, 'base64');
    const blob = new Blob([buffer], { type: slipMime || 'image/jpeg' });
    const form = new FormData();
    form.append('files', blob, 'slip.jpg');
    form.append('log', 'true');
    // หมายเหตุ: ไม่ส่ง amount ไปให้ SlipOK เช็ก เพราะถ้ายอดไม่ตรงเป๊ะจะถูกตีเป็น request ล้มเหลวทันที (error 1013)
    // ทั้งที่นโยบายของเราคือ "สลิปจริงก็พอ ยอดไม่ตรงเป๊ะไม่เป็นไร" จึงเช็กยอดเปรียบเทียบเองด้านล่างแทน

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);

    const slipRes = await fetch(`https://api.slipok.com/api/line/apikey/${SLIPOK_BRANCH_ID}`, {
      method: 'POST',
      headers: { 'x-authorization': SLIPOK_API_KEY },
      body: form,
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    const data = await slipRes.json().catch(() => ({}));

    // data.success = request สำเร็จไหม, data.data.success = สลิปนี้เป็นของจริง/อ่านค่าได้ไหม
    if (data && data.success && data.data && data.data.success) {
      const readAmount = Number(data.data.amount) || null;
      const amountMatches = amount ? readAmount === Number(amount) : null;
      return res.status(200).json({
        ok: true,
        verified: true,
        amount: readAmount,
        amountMatches,
        transRef: data.data.transRef,
        transDate: data.data.transDate,
      });
    }

    // อ่านสลิปไม่ผ่าน — อาจเป็นภาพไม่ชัด ไม่ใช่สลิปจริง หรือสลิปซ้ำ ไม่ฟันธงว่าโกงเสมอไป
    console.log('[verify-slip] not confirmed. ref =', ref, 'message =', data && (data.message || (data.data && data.data.message)));
    return res.status(200).json({
      ok: true,
      verified: false,
      message: (data && (data.message || (data.data && data.data.message))) || 'ตรวจสอบสลิปไม่สำเร็จ',
    });

  } catch (err) {
    console.error('[verify-slip] error:', err.message);
    // SlipOK ล่ม/timeout ไม่ควรบล็อกลูกค้า — ตกไปโหมดตรวจด้วยมือแทน
    return res.status(200).json({ ok: true, verified: null, mode: 'manual' });
  }
}
