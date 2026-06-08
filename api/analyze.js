// api/analyze.js — Vercel Serverless Function
// วิเคราะห์ฮวงจุ้ยจากภาพและข้อมูลบ้าน โดยใช้ Anthropic API · build 2026-06-08-tool-share-v1

export const config = { maxDuration: 30 };


const compactSystemPrompt = `คุณคือซินแสแบงค์ วิเคราะห์ฮวงจุ้ยจากภาพหน้าบ้านและข้อมูลที่ผู้ใช้เลือกด้วยภาษาง่าย เหมือนอธิบายให้เจ้าของบ้านเข้าใจทันที ไม่ฟันธงเกินจริง และเน้นแนวทางปรับแบบไม่ทุบ

ส่งคำตอบผ่านเครื่องมือ submit_fengshui_analysis เท่านั้น ห้ามตอบเป็นข้อความธรรมดา
เขียนภาษาไทยให้อ่านลื่น เป็นมืออาชีพ แต่ใช้คำง่ายและไม่เวอร์
ช่อง observationsText, goodText, badText และ fixText ให้คั่นแต่ละข้อด้วยเครื่องหมาย |
ถ้าต้องแบ่งหลายข้อ ให้คั่นแต่ละข้อด้วยเครื่องหมาย | ใน string เดียว และแต่ละข้อให้เขียนรูปแบบ หัวข้อสั้น: รายละเอียด
ห้ามใส่เครื่องหมาย " ในเนื้อความ ถ้าจำเป็นให้ใช้คำพูดไทยแบบไม่ใส่เครื่องหมาย

Schema:
{
  "score": 0,
  "headline": "",
  "scoreLabel": "",
  "typeCheck": "",
  "frontPart": "",
  "interiorPart": "",
  "observationsText": "",
  "goodText": "",
  "badText": "",
  "fixText": "",
  "omen": "",
  "needsExpert": true
}

วิธีเขียน:
- headline สรุปแบบมืออาชีพ 1 ประโยค ไม่เกิน 80 ตัวอักษร ให้ฟังเหมือนซินแสกำลังสรุปหน้างานจริง ไม่ใช่คำกลางๆ
- typeCheck ต้องบอกว่าภาพดูสอดคล้องกับประเภทที่ผู้ใช้เลือกหรือไม่ เช่น ดูคล้ายทาวน์เฮาส์/อาคารพาณิชย์มากกว่าบ้านเดี่ยว ถ้าเห็นแบบนั้น
- frontPart 3-4 ประโยค ต้องเจาะจากภาพจริง บอกว่าหน้าบ้านรับคน/รับลม/รับสายตาอย่างไร และเจ้าของบ้านควรเริ่มมองจุดไหนก่อน
- interiorPart ถ้าไม่มีภาพภายใน ให้บอกตรงๆ ว่ายังไม่ได้ประเมินภายใน และไม่ควรสรุปแทนหน้างาน
- observationsText ใส่ 6-8 ข้อ คั่นด้วย | ทุกข้อต้องอ้างสิ่งที่เห็นจริงจากภาพ เช่น ชานยกระดับ ทางลาด ประตูบานเลื่อน ประตูม้วน หลังคาเหล็ก ของวางสองข้าง ตู้ไฟ/สายไฟ เลขห้อง เสาอิฐ ผนัง แสง ความทึบ ทางเดินเข้าบ้าน ความรกหรือความโล่ง ห้ามเขียนกว้างๆ ถ้าไม่ได้ผูกกับภาพ
- goodText ใส่ 2-3 ข้อ คั่นด้วย | ต้องเป็นจุดดีที่เห็นจริง ไม่ชมลอยๆ ให้บอกว่าดีเพราะช่วยเรื่องทางเข้า แสง ความโล่ง หรือการใช้งานอย่างไร
- badText ใส่ 5-6 ข้อ คั่นด้วย | ต้องเป็นจุดที่ควรระวังจากภาพจริง พร้อมเหตุผลสั้นๆ ว่าทำไมควรปรับ ใช้คำสุภาพแต่ตรง ไม่ขู่ ไม่เวอร์
- fixText ใส่ 7-8 ข้อ คั่นด้วย | ข้อ 1-2 ต้องเป็นวิธีที่เจ้าของบ้านทำเองได้ทันที แบบไม่ทุบ ไม่รื้อ และเขียนให้เห็นภาพว่าต้องทำอย่างไร เช่น เก็บของฝั่งไหน ย้ายอะไร เปิดทางเดินตรงไหน หรือจัดแสงอย่างไร ข้อที่ 3 เป็นต้นไปให้เป็นหัวข้อที่ควรให้ซินแสดูต่อเท่านั้น ไม่เฉลยวิธีละเอียด
- omen เขียนภาพรวม 5-7 ประโยค อ่านลื่นแบบมืออาชีพ ใช้คำง่าย ให้เจ้าของบ้านรู้สึกว่าเราอ่านภาพจริง เช่น พูดถึงหน้าบ้าน ทางเดิน ประตู ของวาง ความโปร่ง/ทึบ และภาพรวมการใช้งาน ชี้ให้เห็นว่าควรปรับแบบไม่ทุบอย่างเป็นระบบ ไม่การันตีผลลัพธ์ และปิดท้ายว่าการวิเคราะห์อาจคลาดเคลื่อนได้เพราะไม่ได้ไปดูหน้างานจริง

กติกาคะแนน:
- ใช้ภาพเป็นหลัก ไม่ใช่แค่ตัวเลือก
- บ้านที่มีของกองสองข้าง ทางเข้าโดนบีบ พื้น/ผนังดูเก่า หน้าบ้านทึบ สายไฟ/ตู้ไฟเด่น หรือประตูหลักมองไม่โปร่ง ควรต่ำกว่า 75
- ถ้าภาพเห็นทางเข้าใช้งานได้ แต่มีของกีดขวาง ความทึบ หรือความไม่เรียบร้อยชัด ให้คะแนนประมาณ 45-68
- 75 ขึ้นไปให้เฉพาะบ้านที่ดูแลดี ทางเข้าโล่ง แสงดี ไม่มีสิ่งกีดขวางเด่น และข้อมูลสอดคล้องกับภาพ
- ถ้ารูปแบบที่อยู่อาศัยที่เลือกไม่ตรงกับภาพ ให้บอกใน typeCheck และลดคะแนน
- score ต่ำกว่า 75 ให้ needsExpert เป็น true
- ห้ามใช้ประโยคแพตเทิร์น เช่น บ้านมีพื้นฐานพอใช้, ควรดูแสง ทางเข้า และการใช้งานจริงร่วมด้วย, มีจุดที่ต่อยอดได้ ถ้าไม่ใส่รายละเอียดจากภาพประกอบ
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
  const splitItems = (value, fallbackTitle, max) => {
    const parts = cleanText(value).split('|').map(v => cleanText(v)).filter(Boolean).slice(0, max);
    return parts.map((text, index) => {
      const m = text.match(/^(.{2,42}?)[：:–-]\s*(.+)$/);
      if (m) return { title: cleanText(m[1]), desc: cleanText(m[2]) };
      return { title: fallbackTitle + ' ' + (index + 1), desc: text };
    });
  };

  const observations = Array.isArray(result.observations)
    ? itemList(result.observations, 'สิ่งที่เห็นจากภาพ', 6)
    : splitItems(result.observationsText, 'สิ่งที่เห็นจากภาพ', 6);
  const good = Array.isArray(result.good)
    ? itemList(result.good, 'จุดเด่น', 3)
    : splitItems(result.goodText, 'จุดเด่น', 3);
  const bad = Array.isArray(result.bad)
    ? itemList(result.bad, 'จุดที่ควรระวัง', 5)
    : splitItems(result.badText, 'จุดที่ควรระวัง', 6);
  const fix = Array.isArray(result.fix)
    ? itemList(result.fix, 'วิธีปรับแบบไม่ทุบ', 8)
    : splitItems(result.fixText, 'วิธีปรับแบบไม่ทุบ', 8);

  return {
    score,
    headline: cleanText(result.headline) || 'หน้าบ้านยังมีจุดที่ควรจัดให้โปร่งและชัดขึ้น',
    scoreLabel: cleanText(result.scoreLabel) || (score >= 75 ? 'ดีมาก' : score >= 60 ? 'ดี' : score >= 48 ? 'พอใช้' : 'ควรตรวจเพิ่มเติม'),
    typeCheck: item(result.typeCheck, 'ตรวจรูปแบบที่อยู่อาศัย'),
    frontPart: item(result.frontPart, 'หน้าบ้านภาพรวม'),
    interiorPart: item(result.interiorPart || (hasInterior ? '' : 'ยังไม่ได้แนบภาพภายในบ้าน จึงยังไม่สรุปภาพรวมภายในแทนการดูหน้างานจริง'), 'ภาพรวมภายในบ้าน'),
    observations: observations.length ? observations : [{ title: 'รายละเอียดจากภาพยังไม่ครบ', desc: 'ควรใช้ภาพที่เห็นทางเข้า ประตูหลัก พื้นด้านหน้า และของที่อยู่รอบหน้าบ้านให้ชัด เพื่อให้คำแนะนำแม่นขึ้น' }],
    good: good.length ? good : [{ title: 'จุดเด่น', desc: 'มีพื้นที่หน้าบ้านให้จัดระเบียบและเปิดทางเข้าได้ชัดขึ้น' }],
    bad: bad.length ? bad : [{ title: 'จุดที่ควรระวัง', desc: 'หน้าบ้านมีจุดที่อาจทำให้ทางเข้าดูทึบหรือใช้งานไม่สะดวก ควรจัดให้โปร่งขึ้น' }],
    fix: fix.length ? fix : [
      { title: 'วิธีปรับแบบไม่ทุบ', desc: 'เริ่มจากเก็บของสองข้างทางเข้า เปิดพื้นที่หน้าประตู และทำให้เส้นทางเดินเข้าบ้านชัดขึ้น' },
      { title: 'วิธีปรับแบบไม่ทุบ', desc: 'จัดของที่อยู่ชิดประตูหรือทางลาดให้ถอยออก เพื่อให้เดินเข้าออกได้สะดวกและหน้าบ้านดูเบาขึ้น' },
      { title: 'จุดที่ควรให้ซินแสดูต่อ', desc: 'ตำแหน่งประตูหลักกับทางลาดควรดูร่วมกับทิศและการใช้งานจริง' },
      { title: 'จุดที่ควรให้ซินแสดูต่อ', desc: 'ตำแหน่งตู้ไฟ สายไฟ และของหนักด้านหน้าควรจัดลำดับการปรับให้เหมาะกับบ้าน' },
      { title: 'จุดที่ควรให้ซินแสดูต่อ', desc: 'สี วัสดุ และจุดเสริมหน้าบ้านควรเลือกให้เข้ากับทิศและสภาพพื้นที่จริง' },
      { title: 'จุดที่ควรให้ซินแสดูต่อ', desc: 'พื้นที่ภายในหลังประตูควรดูต่อ เพื่อให้การปรับหน้าบ้านไม่ขัดกับการใช้งานในบ้าน' }
    ],
    omen: cleanText(result.omen) || 'จากข้อมูลที่ได้รับ บ้านหลังนี้ยังมีจุดที่ปรับให้ดูโปร่งและใช้งานง่ายขึ้นได้ โดยควรเริ่มจากหน้าบ้าน ประตูหลัก และทางเดินเข้า การวิเคราะห์นี้อาจคลาดเคลื่อนได้เพราะไม่ได้ไปดูหน้างานจริง',
    needsExpert: result.needsExpert === true || score < 75
  };
}


const analysisTool = {
  name: 'submit_fengshui_analysis',
  description: 'Return a structured Thai fengshui home analysis from uploaded images and user details.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      score: { type: 'integer', minimum: 0, maximum: 100 },
      headline: { type: 'string' },
      scoreLabel: { type: 'string' },
      typeCheck: { type: 'string' },
      frontPart: { type: 'string' },
      interiorPart: { type: 'string' },
      observationsText: { type: 'string' },
      goodText: { type: 'string' },
      badText: { type: 'string' },
      fixText: { type: 'string' },
      omen: { type: 'string' },
      needsExpert: { type: 'boolean' }
    },
    required: ['score','headline','scoreLabel','typeCheck','frontPart','interiorPart','observationsText','goodText','badText','fixText','omen','needsExpert']
  }
};

export default async function handler(req, res) {
  // CORS headers — allow any origin (เพื่อให้ claude.ai artifact และ domain จริงเรียกได้)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Fengshui-Api-Version', '2026-06-08-check-ready');

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

  const userText = `ข้อมูลบ้านที่ผู้ใช้ให้มา:
- ประเภท/รูปแบบที่ผู้ใช้เลือก: ${type}
- ทิศหน้าบ้าน: ${dir}
- สภาพแวดล้อม: ${env}
- เป้าหมายหลัก: ${details.goal || 'ไม่ได้ระบุ'}
- มีภาพภายในบ้าน: ${interiorB64 ? 'มี' : 'ไม่มี'}

ช่วยตรวจด้วยว่ารูปแบบที่ผู้ใช้เลือกตรงกับสิ่งที่เห็นในภาพหรือไม่ แล้ววิเคราะห์เป็น 2 part ชัดเจน: 1) หน้าบ้านภาพรวม 2) ภาพรวมในบ้าน ใช้ทิศหน้าบ้านแบบคร่าวๆ ตามที่ผู้ใช้เลือก ไม่ต้องลงลึกถึงองศา ถ้าไม่มีภาพภายในบ้านให้บอกว่าเป็นข้อจำกัดของการประเมิน เน้นความเฉพาะเจาะจงจากภาพ เช่น ประตูหลัก ทางเดิน รั้ว สี ต้นไม้ หลังคา ความโปร่ง/ทึบ เฟอร์นิเจอร์หลัก ทางเดินภายใน และสิ่งกีดขวาง หากจุดไหนภาพไม่ชัดให้ระบุว่าไม่สามารถยืนยันจากภาพได้`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 26000);
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
        max_tokens: 1800,
        system: compactSystemPrompt,
        tools: [analysisTool],
        tool_choice: { type: 'tool', name: 'submit_fengshui_analysis' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'ภาพที่ 1: ภาพหน้าบ้าน ให้อ่านรายละเอียดจากภาพจริงให้มากที่สุด เช่น ทางเข้า พื้นยกระดับ ทางลาด ประตูบานเลื่อน ประตูม้วน หลังคา ของวางสองข้าง ตู้ไฟ สายไฟ เลขห้อง เสา ผนัง ความทึบ ความโปร่ง และความสะอาดเรียบร้อย ถ้าเห็นบ้านโทรม รก ทึบ หรือทางเข้าไม่ชัด ให้สะท้อนตรงๆ ในคะแนนและคำแนะนำ' },
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
    const toolUse = (data.content || []).find(i => i.type === 'tool_use' && i.name === 'submit_fengshui_analysis');
    const raw = (data.content || []).map(i => i.text || '').join('');

    let parsed;
    let via = 'tool';
    try {
      parsed = toolUse?.input || extractJson(raw);
      if (!toolUse?.input) via = 'text';
    } catch (parseErr) {
      console.error('Invalid structured analysis:', raw.slice(0, 1800), JSON.stringify(data.content || []).slice(0, 1800));
      return res.status(502).json({ error: 'Invalid structured analysis', detail: parseErr.message });
    }

    const result = normalizeAiResult(parsed, !!interiorB64);
    return res.status(200).json({ ok: true, result, via });

  } catch (err) {
    console.error('Handler error:', err);
    if (err.name === 'AbortError') return res.status(504).json({ error: 'AI analysis timeout' });
    return res.status(500).json({ error: err.message });
  }
}

