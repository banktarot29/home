// api/followup.js — collect optional LINE follow-up requests

export const config = {
  maxDuration: 10,
  api: {
    bodyParser: { sizeLimit: '256kb' }
  }
};

const LINE_URL = 'https://lin.ee/qLCFQpj';

function clean(value, max = 400) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function clientIp(req) {
  return (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
}

async function saveToKv(record) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return false;

  const id = record.id;
  const headers = {
    Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
    'Content-Type': 'application/json'
  };
  const body = JSON.stringify([
    ['SET', `fs_followup:${id}`, JSON.stringify(record), 'EX', 60 * 60 * 24 * 30],
    ['LPUSH', 'fs_followups', id],
    ['LTRIM', 'fs_followups', 0, 499]
  ]);

  const response = await fetch(`${process.env.KV_REST_API_URL}/pipeline`, {
    method: 'POST',
    headers,
    body
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`KV follow-up write failed: ${text.slice(0, 160)}`);
  }

  return true;
}

function saveInMemory(record) {
  if (!global._fsFollowups) global._fsFollowups = [];
  global._fsFollowups.unshift(record);
  global._fsFollowups = global._fsFollowups.slice(0, 100);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body || {};
    const lineId = clean(body.lineId || body.lineName || body.displayName, 120);
    const liffUserId = clean(body.liffUserId, 120);

    if (!lineId && !liffUserId) {
      return res.status(400).json({ error: 'กรุณาระบุ LINE เพื่อให้ทีมงานติดต่อกลับ' });
    }

    const now = new Date().toISOString();
    const record = {
      id: `fu_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      createdAt: now,
      ip: clientIp(req),
      lineId,
      lineName: clean(body.lineName || body.displayName, 120),
      liffUserId,
      source: clean(body.source, 80) || 'result',
      result: {
        score: Number(body.score) || null,
        scoreLabel: clean(body.scoreLabel, 120),
        headline: clean(body.headline, 180),
        omen: clean(body.omen, 500),
        needsExpert: body.needsExpert === true
      },
      house: {
        type: clean(body.house?.type, 80),
        direction: clean(body.house?.direction, 80),
        env: clean(body.house?.env, 160),
        usage: clean(body.house?.usage, 100),
        years: clean(body.house?.years, 80),
        pain: clean(body.house?.pain, 240)
      }
    };

    let stored = 'memory';
    try {
      if (await saveToKv(record)) stored = 'kv';
      else saveInMemory(record);
    } catch (err) {
      console.error(err);
      saveInMemory(record);
    }

    return res.status(200).json({
      ok: true,
      stored,
      lineUrl: LINE_URL,
      message: stored === 'kv'
        ? 'บันทึกคำขอติดตามผลแล้ว'
        : 'รับข้อมูลไว้ชั่วคราวแล้ว หากยังไม่ได้ตั้ง Vercel KV ข้อมูลอาจหายเมื่อระบบ cold start'
    });
  } catch (err) {
    console.error('Follow-up error:', err);
    return res.status(500).json({ error: 'บันทึกข้อมูลไม่สำเร็จ กรุณาทัก LINE โดยตรง', lineUrl: LINE_URL });
  }
}
