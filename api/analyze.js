// api/analyze.js — Vercel Serverless Function
// วิเคราะห์ฮวงจุ้ยจากภาพและข้อมูลบ้าน โดยใช้ Anthropic API

export const config = { maxDuration: 30 };


const compactSystemPrompt = `คุณคือซินแสแบงค์ วิเคราะห์ฮวงจุ้ยจากภาพและข้อมูลที่ผู้ใช้เลือกแบบเข้าใจง่าย ไม่ฟันธงเกินจริง

ตอบเป็น JSON ที่ถูกต้องเท่านั้น ห้ามมี markdown ห้ามมีคำอธิบายนอก JSON
ใช้ double quotes ทุก key และทุก string เท่านั้น
ห้ามใส่ object ใน array ให้ array เป็น string ล้วน เพื่อลด JSON แตก

Schema ที่ต้องตอบ:
{
  "score": 0,
  "headline": "",
  "scoreLabel": "",
  "typeCheck": "",
  "frontPart": "",
  "interiorPart": "",
  "observations": ["", "", ""],
  "good": ["", "", ""],
  "bad": ["", "", ""],
  "fix": ["", "", ""],
  "omen": "",
  "needsExpert": true
}

กติกาการให้คะแนน:
- ใช้ภาพเป็นหลัก ไม่ใช่แค่ตัวเลือก
- บ้านโทรม รก ทึบ สีลอก ทางเข้าถูกบัง หรือภาพไม่ชัด ควรได้ประมาณ 35-62
- 75 ขึ้นไปให้เฉพาะบ้านที่ดูแลดี ทางเข้าโล่ง แสงดี ไม่มีสิ่งกีดขวางเด่น และข้อมูลสอดคล้องกับภาพ
- ถ้ารูปแบบที่อยู่อาศัยที่เลือกไม่ตรงกับภาพ ให้บอกใน typeCheck และลดคะแนน
- ถ้าไม่มีภาพภายในบ้าน ให้ interiorPart บอกข้อจำกัดอย่างสุภาพ
- score ต่ำกว่า 75 ให้ needsExpert เป็น true
- ท้าย omen ให้ระบุว่าเป็นการวิเคราะห์จากข้อมูลที่ได้ อาจคลาดเคลื่อนได้เพราะไม่ได้ดูหน้างานจริง
`;

function extractJson(raw) {
  const text = String(raw || '').replace(/\`\`\`json|\`\`\`/g, '').trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('No JSON object found');
  const json = text.slice(start, end + 1).replace(/,\s*([}\]])/g, '$1');
  return JSON.parse(json);
}

function cleanText(value) {
  return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
}

function item(value, fallbackTitle) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return {
      title: cleanText(value.title || fallbackTitle),
      desc: cleanText(value.desc || value.text || value.detail || '')
    };
  }
  return { title: fallbackTitle, desc: cleanText(value) };
}

function itemList(values, fallbackTitle, max) {
  const arr = Array.isArray(values) ? values : [];
  return arr.map((value, index) => item(value, fallbackTitle + ' ' + (index + 1)))
    .filter(v => v.title || v.desc)
    .slice(0, max);
}

function normalizeAiResult(result, hasInterior) {
  const score = Math.max(0, Math.min(100, Math.round(Number(result.score) || 60)));
  return {
    score,
    headline: cleanText(result.headline) || 'บ้านหลังนี้มีจุดที่ควรดูเพิ่มเติม',
    scoreLabel: cleanText(result.scoreLabel) || (score >= 75 ? 'ดีมาก' : score >= 60 ? 'ดี' : score >= 48 ? 'พอใช้' : 'ควรตรวจเพิ่มเติม'),
    typeCheck: item(result.typeCheck, 'ตรวจรูปแบบที่อยู่อาศัย'),
    frontPart: item(result.frontPart, 'หน้าบ้านภาพรวม'),
    interiorPart: item(result.interiorPart || (hasInterior ? '' : 'ยังไม่ได้แนบภาพภายในบ้าน จึงประเมินภายในจากข้อมูลเบื้องต้นเท่านั้น'), 'ภาพรวมภายในบ้าน'),
    observations: itemList(result.observations, 'สิ่งที่เห็นจากภาพ', 4),
    good: itemList(result.good, 'จุดเด่น', 3),
    bad: itemList(result.bad, 'จุดที่ควรระวัง', 4),
    fix: itemList(result.fix, 'วิธีปรับแบบไม่ทุบ', 4),
    omen: cleanText(result.omen) || 'วิเคราะห์จากรายละเอียดตามข้อมูลที่ได้รับ อาจมีความคลาดเคลื่อนได้ เนื่องจากไม่ได้ไปดูหน้างานจริง',
    needsExpert: result.needsExpert === true || score < 75
  };
}

export default async function handler(req, res) {
  // CORS headers — allow any origin (เพื่อให้ claude.ai artifact และ domain จริงเรียกได้)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { photoB64, photoMime, interiorB64, interiorMime, type, dir, env, details = {} } = req.body;

  if (!photoB64 || !type || !dir || !env) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const systemPrompt = `คุณคือ "ซินแสแบงค์" ผู้เชี่ยวชาญฮวงจุ้ยที่จัดแบบไม่ทุบ และดูแลงานบ้านกับองค์กรใหญ่มากกว่า 12 ปี
วิเคราะห์จากภาพหน้าบ้าน ภาพภายในบ้านถ้ามี และข้อมูลที่ผู้ใช้เลือก โดยยึดหลัก Form School, Five Elements, Ba Gua และ Flying Stars แบบเข้าใจง่าย

เป้าหมายคำตอบ:
- เขียนภาษาไทยธรรมชาติ อ่านลื่น เป็นประโยคสั้น-กลาง ไม่แข็งเหมือนตำรา
- ทุกข้อควรโยงเป็นลำดับ: สิ่งที่เห็น/ข้อมูลที่มี -> หลักฮวงจุ้ย -> สิ่งที่ควรสังเกต -> แนวทางปรับแบบไม่ทุบ
- ถ้าภาพไม่ชัดหรือยืนยันไม่ได้ ให้พูดตรงๆ ว่า "จากภาพยังยืนยันไม่ได้" และหลีกเลี่ยงการฟันธง
- ห้ามพูดถึง AI, โมเดล, ซอฟต์แวร์ หรือการประมวลผลภาพ
- ใช้ภาษาคนอ่านเข้าใจง่าย หลีกเลี่ยงคำแรงหรือคำที่รับรองผลลัพธ์ด้านเงิน สุขภาพ ความสัมพันธ์ หรือการแก้ปัญหาทั้งหมด

ตอบเป็น JSON ล้วนๆ ไม่มี backtick ไม่มีข้อความนอก JSON ตามรูปแบบนี้เท่านั้น:
{
  "score": <0-100>,
  "headline": "<สรุป 1 ประโยค อ่านง่าย ไม่ฟันธงผลลัพธ์ ไม่เกิน 70 ตัวอักษร>",
  "scoreLabel": "<ดีมาก/ดี/พอใช้/ควรตรวจเพิ่มเติม>",
  "typeCheck": {"title":"ตรวจรูปแบบที่อยู่อาศัย","desc":"<ดูจากภาพว่ารูปแบบที่ผู้ใช้เลือกตรงกับภาพหรือไม่ ถ้าไม่แน่ใจให้บอกว่าไม่สามารถยืนยันจากภาพได้>"},
  "frontPart": {"title":"หน้าบ้านภาพรวม","desc":"<วิเคราะห์ภาพหน้าบ้านโดยเฉพาะ 2-3 ประโยค>"},
  "interiorPart": {"title":"ภาพรวมภายในบ้าน","desc":"<วิเคราะห์ภาพภายในบ้านถ้ามี ถ้าไม่มีให้บอกข้อจำกัด 1-2 ประโยค>"},
  "observations": [{"title":"<สิ่งที่เห็นจากภาพ>","desc":"<อธิบายสั้นๆ ว่าเห็นอะไรและเกี่ยวกับบ้านอย่างไร>"}],
  "good": [{"title":"<จุดเด่น>","desc":"<เหตุผลและผลดี 1-2 ประโยค>"}],
  "bad": [{"title":"<จุดที่ควรระวัง>","desc":"<ปัญหา ผลกระทบ และเหตุผล 1-2 ประโยค>","masked":false}],
  "fix": [{"title":"<วิธีปรับแบบไม่ทุบ>","desc":"<วิธีทำที่จับต้องได้ 1-2 ประโยค>","masked":false}],
  "omen": "<ภาพรวม 3-4 ประโยคแบบอ่านลื่น อ้างอิงทิศ ธาตุ และสิ่งที่เห็นจริง โดยไม่ฟันธงผลลัพธ์>",
  "needsExpert": <true/false>
}

กฎคุณภาพ:
- ให้ตรวจ typeCheck ก่อนว่ารูปแบบที่อยู่อาศัยที่เลือกสอดคล้องกับภาพหรือไม่
- ให้แยก frontPart และ interiorPart ชัดเจน
- observations 2-4 รายการ ให้เป็นสิ่งที่มองเห็นได้หรือข้อมูลที่ผู้ใช้เลือก
- good 2-3 รายการ, bad 2-4 รายการ, fix 2-4 รายการ
- fix ข้อแรกควรเป็นสิ่งที่เจ้าของบ้านทำเองได้ทันที เน้นไม่ทุบ ไม่รื้อ
- bad และ fix ควรสอดคล้องกัน
- ถ้า score ต่ำกว่า 75 ให้แนะนำอย่างสุภาพว่าการดูหน้างานจะช่วยให้คำแนะนำแม่นขึ้น
- ถ้า score ตั้งแต่ 75 ขึ้นไป ให้แนะนำ Ebook เป็นทางเลือกสำหรับต่อยอดเอง
- ตอนท้ายของ omen ต้องสื่อว่าเป็นการวิเคราะห์จากรายละเอียดตามข้อมูลที่ได้ อาจมีความคลาดเคลื่อนได้เนื่องจากไม่ได้ไปดูหน้างาน
- การให้ score ต้องอิงจากภาพเป็นหลัก ไม่ใช่จากตัวเลือกอย่างเดียว
- เริ่มประเมินจากฐาน 65 แล้วบวก/ลบตามหลักฐานที่เห็นในภาพ
- ให้ 75 ขึ้นไปเฉพาะภาพที่เห็นหน้าบ้านค่อนข้างชัด บ้านดูดูแลดี ทางเข้าโล่ง แสงพอดี ไม่มีสิ่งกีดขวางเด่น และข้อมูลที่เลือกสอดคล้องกับภาพ
- ถ้าบ้านโทรม สีลอก รก ทึบ ประตู/ทางเข้าไม่ชัด มีของกีดขวาง รั้วทึบมาก หรือภาพไม่ชัด ให้ลดคะแนนชัดเจน โดยทั่วไปควรอยู่ราว 35-62 ตามระดับปัญหา
- ถ้ารูปแบบที่ผู้ใช้เลือกดูไม่ตรงกับภาพ ให้ระบุใน typeCheck และลดคะแนน 5-12 คะแนนตามความรุนแรง
- ถ้าเห็นสภาพแวดล้อมเสี่ยง เช่น บ้านต่ำกว่าถนน ใกล้สะพาน/ทางด่วน ใกล้หม้อแปลง ตลาด ถนนใหญ่ หรือทางรถไฟ ให้สะท้อนใน bad และลดคะแนนตามหลักฐานที่เห็น
- ถ้าไม่มีภาพภายในบ้าน ห้ามให้คะแนนสูงเพราะเดาเรื่องภายใน ให้ระบุข้อจำกัดใน interiorPart
- needsExpert=true เมื่อ score<75 หรือมีจุดเสี่ยงสำคัญที่ควรดูหน้างาน`;

  const userText = `ข้อมูลบ้านที่ผู้ใช้ให้มา:
- ประเภท/รูปแบบที่ผู้ใช้เลือก: ${type}
- ทิศหน้าบ้าน: ${dir}
- สภาพแวดล้อม: ${env}
- เป้าหมายหลัก: ${details.goal || 'ไม่ได้ระบุ'}
- มีภาพภายในบ้าน: ${interiorB64 ? 'มี' : 'ไม่มี'}

ช่วยตรวจด้วยว่ารูปแบบที่ผู้ใช้เลือกตรงกับสิ่งที่เห็นในภาพหรือไม่ แล้ววิเคราะห์เป็น 2 part ชัดเจน: 1) หน้าบ้านภาพรวม 2) ภาพรวมในบ้าน ใช้ทิศหน้าบ้านแบบคร่าวๆ ตามที่ผู้ใช้เลือก ไม่ต้องลงลึกถึงองศา ถ้าไม่มีภาพภายในบ้านให้บอกว่าเป็นข้อจำกัดของการประเมิน เน้นความเฉพาะเจาะจงจากภาพ เช่น ประตูหลัก ทางเดิน รั้ว สี ต้นไม้ หลังคา ความโปร่ง/ทึบ เฟอร์นิเจอร์หลัก ทางเดินภายใน และสิ่งกีดขวาง หากจุดไหนภาพไม่ชัดให้ระบุว่าไม่สามารถยืนยันจากภาพได้`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 24000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 700,
        system: compactSystemPrompt,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'ภาพที่ 1: ภาพหน้าบ้าน ใช้วิเคราะห์หน้าบ้านภาพรวม ประตูหลัก ทางเดินเข้า รั้ว ต้นไม้ หลังคา และบริบทด้านหน้า' },
            { type: 'image', source: { type: 'base64', media_type: photoMime || 'image/jpeg', data: photoB64 } },
            ...(interiorB64 ? [
              { type: 'text', text: 'ภาพที่ 2: ภาพภายในบ้าน ใช้วิเคราะห์โถงแรกหลังเข้าบ้าน ทางเดิน เฟอร์นิเจอร์หลัก แสง ความโล่ง และสิ่งกีดขวาง' },
              { type: 'image', source: { type: 'base64', media_type: interiorMime || 'image/jpeg', data: interiorB64 } }
            ] : []),
            { type: 'text', text: userText }
          ]
        }]
      })
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic error:', err);
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }

    const data = await response.json();
    const raw = data.content.map(i => i.text || '').join('');

    let parsed;
    try {
      parsed = extractJson(raw);
    } catch (parseErr) {
      console.error('Invalid AI JSON:', raw.slice(0, 1800));
      return res.status(502).json({ error: 'Invalid AI JSON', detail: parseErr.message });
    }

    const result = normalizeAiResult(parsed, !!interiorB64);
    return res.status(200).json({ ok: true, result });

  } catch (err) {
    console.error('Handler error:', err);
    if (err.name === 'AbortError') return res.status(504).json({ error: 'AI analysis timeout' });
    return res.status(500).json({ error: err.message });
  }
}

