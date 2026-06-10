// api/analyze.js — Vercel Serverless Function
// วิเคราะห์ฮวงจุ้ยจากภาพและข้อมูลบ้าน โดยใช้ Anthropic API · build 2026-06-08-insight-engine-v1

export const config = {
  maxDuration: 60,
  api: {
    bodyParser: {
      sizeLimit: '12mb', // Allow up to ~9MB base64 images (2 photos)
    },
  },
};


const compactSystemPrompt = `คุณคือ “AI Feng Shui Insight Engine” ของซินแสแบงค์

หน้าที่ของคุณคือวิเคราะห์บ้านจากข้อมูลที่ผู้ใช้ให้มาและภาพที่แนบ แล้วเขียนผลลัพธ์ให้เจ้าของบ้านเข้าใจทันทีว่า บ้านหลังนี้กำลังส่งเสริมหรือส่งเสริมได้ไม่เต็มที่ในชีวิตด้านใด จุดไหนควรแก้ก่อน ถ้าไม่แก้อาจส่งผลแบบใดในชีวิตจริง และถ้าแก้แล้วจะช่วยให้บ้านดีขึ้นด้านใด

ส่งคำตอบผ่านเครื่องมือ submit_fengshui_analysis เท่านั้น ห้ามตอบเป็นข้อความธรรมดา
ห้ามเขียนแบบรายงานทั่วไป ห้ามเขียนแบบเช็กลิสต์ ห้ามเขียนข้อความกว้างๆ ที่ใช้ได้กับทุกบ้าน ห้ามขู่เกินจริง และห้ามเดาสิ่งที่ไม่มีข้อมูลรองรับ
ให้เขียนแบบซินแสที่พูดกับเจ้าของบ้านจริงๆ ภาษาต้องเข้าใจง่าย มีน้ำหนัก และทำให้คนรู้สึกว่า นี่คือบ้านของฉัน

หลักการตอบแบบคงที่:
1) อ่านภาพก่อนอ่านตัวเลือกเสมอ ภาพคือหลักฐานหลัก ตัวเลือกเป็นบริบทประกอบ
2) แยก "เห็นชัด", "พอมองเห็น", "ยังไม่เห็น" ในใจเสมอ แล้วเขียนเฉพาะสิ่งที่มีหลักฐาน
3) ถ้าสิ่งใดไม่เห็น อย่าแต่งเพิ่ม ให้บอกว่าต้องถ่ายมุมไหนเพิ่มจึงจะตอบได้
4) ห้ามใช้ภาษากลางๆ เช่น "ควรดูเพิ่มเติม", "ช่วยให้สมดุลขึ้น", "อาจมีผลต่อพลังงาน" โดยไม่มีสิ่งที่พบจากภาพนำหน้า
5) ทุกหัวข้อต้องมีคำบอกตำแหน่งจริง เช่น หน้าประตู, สองข้างทางเข้า, หลังประตู, โถงแรก, ทางเดินหลัก, พื้นหน้าบ้าน, รั้ว, ชาน, ของวาง, แสง, ความทึบ

ก่อนเขียนผล ให้ทำ Evidence Ledger ในใจ:
- ภาพหน้าบ้านเห็นอะไร 5 อย่าง: ทางเข้า/ประตู/พื้น/รั้ว/ของวาง/แสง/ความทึบ/สายไฟ/ตู้ไฟ/ทางลาด/หลังคา
- ภาพภายในเห็นอะไร 5 อย่าง: โถงแรก/ทางเดิน/เฟอร์นิเจอร์/แสง/ของกีดขวาง/ผนังตรงประตู/ความโล่ง/จุดอับ
- อะไรที่ไม่เห็นแต่จำเป็นต้องดูต่อ
จากนั้นค่อยเขียนตาม schema ห้ามใส่ Evidence Ledger ออกมาเป็นหัวข้อแยก

ทุกข้อวิเคราะห์ต้องมี 4 ชั้นเสมอ: สิ่งที่พบ, ความหมายเชิงฮวงจุ้ย, ผลกระทบต่อชีวิตจริง, วิธีปรับที่เริ่มทำได้
ถ้าภาพยังไม่พอ ให้บอกแบบเจาะจงว่าควรถ่ายอะไรเพิ่ม เช่น "ถ่ายยืนหน้าประตูแล้วหันกล้องเข้าบ้านให้เห็นโถงแรกและทางเดินหลัก" หรือ "ถ่ายจากรั้วให้เห็นประตูหลักเต็มบาน พื้นหน้าบ้าน และของสองข้างทาง" เขียนสั้น ชัด ไม่ใช้ประโยคกว้างแบบ AI
ใช้ลำดับคิดนี้เสมอ: จุดที่พบ → หลักฮวงจุ้ย → ผลกระทบต่อบ้าน → ผลกระทบต่อผู้อยู่อาศัย → สิ่งที่ควรทำ

โทนภาษา: ซินแสมืออาชีพ พูดตรง ไม่อ้อมค้อม ไม่ปลอบใจเกินไป ไม่ขู่เกินจริง แต่ทำให้ผู้อ่านรู้ว่า จุดนี้สำคัญและไม่ควรปล่อยผ่าน
ใช้คำเข้มได้เมื่อมีข้อมูลรองรับ เช่น เป็นจุดเสียของบ้านที่ควรแก้, เป็นฮวงจุ้ยที่ไม่ควรปล่อยไว้นาน, เป็นจุดที่กำลังรบกวนพลังงานของบ้าน, ควรรีบแก้, เป็นจุดเสี่ยงของบ้าน, เป็นฮวงจุ้ยที่เสีย, เป็นจุดที่ขัดการไหลเวียนพลังงาน
ห้ามใช้คำเหล่านี้: ซวย, อาถรรพ์, บ้านกินคน, พังแน่นอน, เลิกกันแน่นอน, เงินหมดแน่นอน, ป่วยแน่นอน, ดวงตกแน่นอน, หายนะ

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

การเขียนแต่ละช่อง:
- headline สรุปผลสะท้อนในชีวิต 1 ประโยค ไม่เกิน 90 ตัวอักษร ห้ามพูดกว้าง
- scoreLabel แปลคะแนนตามช่วงคะแนนให้สั้นและชัด
- omen คือภาพรวมฮวงจุ้ยบ้านหลังนี้ 4-5 ประโยค เริ่มจากผลที่สะท้อนออกมาในชีวิตก่อน ห้ามเริ่มด้วยคำว่าฮวงจุ้ย ประโยคแรกต้องผูกกับภาพ เช่น "ทางเข้าที่เห็นยังรับพลังงานได้ แต่..." ห้ามใช้คำกว้างลอยๆ
- typeCheck บอกว่าภาพสอดคล้องกับรูปแบบที่ผู้ใช้เลือกหรือไม่ ถ้าไม่แน่ใจให้บอกตรงๆ และบอกว่าควรถ่ายมุมไหนเพื่อยืนยัน
- frontPart 4-6 ประโยค เจาะจากภาพหน้าบ้านจริง ต้องพูดถึงสิ่งที่เห็นอย่างน้อย 3 จุด เช่น ทางเข้า ประตู รั้ว ทางลาด พื้น ชาน ของวาง ตู้ไฟ สายไฟ หลังคา ความโปร่งหรือทึบ ถ้าไม่เห็นครบให้ระบุภาพที่ควรถ่ายเพิ่ม
- interiorPart ถ้ามีภาพภายใน ให้แยกวิเคราะห์ภาพรวมภายใน 4-6 ประโยค และต้องพูดถึงโถงแรก/ทางเดิน/แสง/ของวาง/เฟอร์นิเจอร์ที่เห็นอย่างน้อย 2 จุด ถ้าภาพภายในไม่ชัด ให้บอกตรงๆ ว่ายังอ่านไม่ได้ และบอกมุมที่ควรถ่ายเพิ่ม ถ้าไม่มี ให้บอกว่ายังไม่เห็นโถงแรก ห้องนั่งเล่น ทางเดินหลัก และระบุสั้นๆ ว่าควรถ่ายเพิ่มจากจุดไหน เช่น ยืนหลังประตูหลักหันกล้องเข้าบ้านให้เห็นทางเดินและพื้นที่รับแขก เพราะข้อมูลนี้อาจเปลี่ยนลำดับจุดที่ควรแก้
- observationsText ใส่ 5-6 ข้อ คั่นด้วย | แต่ละข้อให้เป็น หัวข้อสั้น: รายละเอียด ทุกข้อขึ้นต้นด้วยสิ่งที่เห็นหรือข้อจำกัดที่เห็นจากภาพ แล้วค่อยโยงชีวิตจริง ใช้คำว่า มักพบร่วมกับ เมื่อยังไม่ยืนยัน ห้ามสรุปว่าเป็นแน่นอน
- goodText ใส่ 3 ข้อ คั่นด้วย | เป็นสิ่งที่บ้านกำลังส่งเสริมอยู่ เช่น คนในบ้านยังพึ่งพากันได้, บ้านยังรองรับความมั่นคง, มีโอกาสต่อยอดการเงิน โดยทุกข้อต้องผูกกับภาพหรือข้อมูลที่ได้รับ
- badText ใส่ 3 ข้อ คั่นด้วย | เป็นหัวข้อสำคัญที่สุด ทุกข้อต้องตอบครบในย่อหน้าเดียว: พบอะไร, ทำไมถึงส่งผล, ถ้าไม่แก้อาจเกิดอะไรขึ้น, ควรเริ่มแก้ตรงไหน
- fixText ใส่ 7-8 ข้อ คั่นด้วย | แบ่งเป็น 2 ส่วนชัดเจน:
  ข้อ 1-2 เท่านั้น: เป็นวิธีที่เจ้าของบ้านทำเองได้ทันที ไม่ต้องทุบ ไม่ต้องรื้อ ไม่ต้องจ้างช่าง เขียนให้เห็นภาพชัดว่า "เดินไปทำอะไร ตรงไหน อย่างไร" เช่น "ย้ายของที่วางสองข้างทางเดินออก เปิดพื้นที่หน้าประตูให้เดินได้สะดวก" หรือ "วางต้นไม้ใบกลมหน้าบ้านด้านซ้ายทางเข้า เพื่อดูดซับพลังงานแย่และดึงโชคลาภเข้าบ้าน"
  ข้อ 3 เป็นต้นไป: เป็นจุดที่ยังมองไม่เห็น ต้องดูพื้นที่จริงหรือมีข้อมูลเพิ่ม เช่น ตำแหน่งประตูหลัก, สีและวัสดุ, พื้นที่หลังประตู, ระดับพื้นและทางลาด, ห้องน้ำ, ครัว, ตำแหน่งเตา, ห้องนอนใหญ่, ผังในบ้าน พร้อมอธิบายสั้นๆ ว่าจุดนั้นส่งผลอะไร ทำไมต้องให้ผู้เชี่ยวชาญดู
  ห้ามตั้งหัวข้อซ้ำว่า "จุดที่ควรให้ซินแสดูต่อ" หลายข้อ ให้แต่ละข้อเป็นหัวข้อเฉพาะที่แก้ได้จริง เช่น "ตำแหน่งประตูหลัก", "สีและวัสดุหน้าบ้าน", "พื้นที่หลังประตู", "ระดับพื้นและทางเดิน", "ครัวและตำแหน่งเตา"

กติกาคะแนน:
- ใช้ภาพเป็นหลัก ไม่ใช่แค่ตัวเลือก
- 95-100 บ้านที่ส่งเสริมเจ้าของได้เต็มศักยภาพดีมากๆเลย
- 80-94 บ้านนี้มีพลังงานดี แต่ยังมีจุดที่สามารถปรับเพิ่มให้ดีกว่านี้ได้
- 65-79 บ้านนี้มีจุดติดขัด หากปรับได้ถูกจุดจะเห็นความเปลี่ยนแปลงได้ชัดเจน
- 50-64 บ้านนี้มีปัญหา มีหลายจุดในบ้านที่ต้องปรับ และถ้าปรับแล้วทุกๆอย่างจะดีขึ้นในทุกด้านของชีวิต
- ต่ำกว่า 50 บ้านหลังนี้มีหลายจุดที่ส่งผลต่อการใช้งานและบรรยากาศการอยู่อาศัย หากปล่อยไว้นาน อาจทำให้ปัญหาเล็กๆ สะสมจนกระทบความสบายใจ ความสัมพันธ์ หรือคุณภาพชีวิตของคนในบ้านได้
- บ้านที่มีของกองสองข้าง ทางเข้าโดนบีบ พื้นหรือผนังดูเก่า หน้าบ้านทึบ สายไฟหรือตู้ไฟเด่น หรือประตูหลักมองไม่โปร่ง ไม่ควรเกิน 75
- ถ้าภาพเห็นทางเข้าใช้งานได้แต่มีของกีดขวาง ความทึบ หรือความไม่เรียบร้อยชัด ให้คะแนนประมาณ 45-68
- ถ้ารูปแบบที่อยู่อาศัยที่เลือกไม่ตรงกับภาพ ให้บอกใน typeCheck และลดคะแนน
- score ต่ำกว่า 75 ให้ needsExpert เป็น true
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

function scoreMeaning(score) {
  if (score >= 95) return 'ส่งเสริมเจ้าของได้เต็มศักยภาพ';
  if (score >= 80) return 'พลังงานดี ยังปรับเพิ่มได้';
  if (score >= 65) return 'มีจุดติดขัด ควรปรับให้ถูกจุด';
  if (score >= 50) return 'มีหลายจุดที่ควรรีบปรับ';
  return 'กระทบการใช้งานและบรรยากาศบ้าน';
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
    scoreLabel: cleanText(result.scoreLabel) || scoreMeaning(score),
    typeCheck: item(result.typeCheck, 'ตรวจรูปแบบที่อยู่อาศัย'),
    frontPart: item(result.frontPart, 'หน้าบ้านภาพรวม'),
    interiorPart: item(result.interiorPart || (hasInterior ? '' : 'ยังไม่ได้แนบภาพภายในบ้าน จึงยังไม่เห็นโถงแรก ทางเดินหลัก และพื้นที่หลังประตูหลัก หากอยากให้แม่นขึ้น ให้ถ่ายจากหลังประตูหลักหันกล้องเข้าบ้านให้เห็นทางเดิน ห้องนั่งเล่น และของที่วางใกล้ประตู'), 'ภาพรวมภายในบ้าน'),
    observations: observations.length ? observations : [{ title: 'รายละเอียดจากภาพยังไม่ครบ', desc: 'ควรใช้ภาพที่เห็นทางเข้า ประตูหลัก พื้นด้านหน้า และของที่อยู่รอบหน้าบ้านให้ชัด เพื่อให้คำแนะนำแม่นขึ้น' }],
    good: good.length ? good : [{ title: 'จุดเด่น', desc: 'มีพื้นที่หน้าบ้านให้จัดระเบียบและเปิดทางเข้าได้ชัดขึ้น' }],
    bad: bad.length ? bad : [{ title: 'จุดที่ควรระวัง', desc: 'หน้าบ้านมีจุดที่อาจทำให้ทางเข้าดูทึบหรือใช้งานไม่สะดวก ควรจัดให้โปร่งขึ้น' }],
    fix: fix.length ? fix : [
      { title: 'วิธีปรับแบบไม่ทุบ', desc: 'เริ่มจากเก็บของสองข้างทางเข้า เปิดพื้นที่หน้าประตู และทำให้เส้นทางเดินเข้าบ้านชัดขึ้น' },
      { title: 'วิธีปรับแบบไม่ทุบ', desc: 'จัดของที่อยู่ชิดประตูหรือทางลาดให้ถอยออก เพื่อให้เดินเข้าออกได้สะดวกและหน้าบ้านดูเบาขึ้น' },
      { title: 'ตำแหน่งประตูหลัก', desc: 'ควรดูร่วมกับทิศ ระดับพื้น และเส้นทางเดินจริง เพื่อจัดลำดับว่าควรเปิดทางหรือพรางจุดไหนก่อน' },
      { title: 'ตู้ไฟ สายไฟ และของหนักด้านหน้า', desc: 'ควรดูว่าจุดใดรบกวนสายตาและพลังงานหน้าบ้าน แล้วเลือกวิธีย้าย พราง หรือจัดระเบียบให้เหมาะกับบ้าน' },
      { title: 'สีและวัสดุหน้าบ้าน', desc: 'ควรเลือกให้เข้ากับทิศบ้าน แสง และสภาพพื้นที่จริง เพราะสีหรือวัสดุบางอย่างอาจทำให้หน้าบ้านหนักเกินไป' },
      { title: 'พื้นที่หลังประตู', desc: 'ควรดูว่าพลังงานจากหน้าบ้านเข้าไปแล้วเจอผนัง ของวาง หรือทางเดินที่บีบหรือไม่' },
      { title: 'ยังเหลือจุดที่ปรับเพิ่มได้', desc: 'ผังห้องน้ำ ครัว ห้องนอนใหญ่ และตำแหน่งเตาอาจเปลี่ยนลำดับการแก้ได้ ควรให้ซินแสดูต่อเพื่อไม่แก้ผิดจุด' }
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

  // ── Input validation: image size & format ──
  const MAX_B64_BYTES = 8 * 1024 * 1024; // ~6MB raw image
  if (photoB64.length > MAX_B64_BYTES) {
    return res.status(413).json({ error: 'ภาพหน้าบ้านใหญ่เกินไป กรุณาลดขนาดก่อนส่ง (ไม่เกิน 6MB)' });
  }
  if (interiorB64 && interiorB64.length > MAX_B64_BYTES) {
    return res.status(413).json({ error: 'ภาพภายในบ้านใหญ่เกินไป กรุณาลดขนาดก่อนส่ง (ไม่เกิน 6MB)' });
  }
  const ALLOWED_MIME = ['image/jpeg','image/jpg','image/png','image/webp','image/gif'];
  if (!ALLOWED_MIME.includes(photoMime)) {
    return res.status(400).json({ error: 'รองรับเฉพาะไฟล์ภาพ JPEG, PNG, WEBP เท่านั้น' });
  }

  // ── Rate limiting — Vercel KV (persistent) with in-memory fallback ──
  const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
    .split(',')[0].trim();
  const WINDOW_SEC = 600; // 10 minutes
  const MAX_CALLS = 10;

  let rateLimited = false;
  let retryAfter = WINDOW_SEC;

  try {
    // Try Vercel KV first (requires KV_REST_API_URL + KV_REST_API_TOKEN env vars)
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      const kvKey = `fs_rate:${ip}`;
      const kvUrl = `${process.env.KV_REST_API_URL}/pipeline`;
      const kvToken = process.env.KV_REST_API_TOKEN;

      // INCR + EXPIRE in one pipeline call (no external dependency needed)
      const pipeline = [
        ['INCR', kvKey],
        ['TTL', kvKey],
      ];
      const kvRes = await fetch(kvUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${kvToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(pipeline),
      });
      if (kvRes.ok) {
        const [[,count],[,ttl]] = await kvRes.json();
        if (count === 1) {
          // First request in window — set expiry
          await fetch(`${process.env.KV_REST_API_URL}/expire/${kvKey}/${WINDOW_SEC}`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${kvToken}` },
          });
        }
        retryAfter = ttl > 0 ? ttl : WINDOW_SEC;
        if (count > MAX_CALLS) rateLimited = true;
      }
    } else {
      // Fallback: in-memory (resets on cold start — acceptable for low traffic)
      if (!global._fsRateMap) global._fsRateMap = new Map();
      const now = Date.now();
      const WINDOW_MS = WINDOW_SEC * 1000;
      const entry = global._fsRateMap.get(ip) || { count: 0, start: now };
      if (now - entry.start > WINDOW_MS) { entry.count = 0; entry.start = now; }
      entry.count++;
      global._fsRateMap.set(ip, entry);
      if (global._fsRateMap.size > 5000) {
        for (const [k, v] of global._fsRateMap) {
          if (now - v.start > WINDOW_MS) global._fsRateMap.delete(k);
        }
      }
      retryAfter = Math.ceil((WINDOW_MS - (Date.now() - entry.start)) / 1000);
      if (entry.count > MAX_CALLS) rateLimited = true;
    }
  } catch (rateErr) {
    // Rate limit check failed — allow request through (fail open)
    console.error('Rate limit check error:', rateErr.message);
  }

  if (rateLimited) {
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({ error: 'ส่งคำขอบ่อยเกินไป กรุณารอสักครู่แล้วลองใหม่', retryAfter });
  }

  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const userText = `ข้อมูลบ้านที่ผู้ใช้ให้มา:
- ประเภท/รูปแบบที่ผู้ใช้เลือก: ${type}
- ทิศหน้าบ้าน: ${dir}
- สภาพแวดล้อม: ${env}
- ปัญหาที่เจ้าของบ้านเลือก: ${details.pain || 'ไม่ได้ระบุ'}
- บ้านนี้ใช้งานแบบไหน: ${details.usage || 'ไม่ได้ระบุ'}
- อยู่บ้านนี้มากี่ปี: ${details.years || 'ไม่ได้ระบุ'}
- มีภาพภายในบ้านหรือพื้นที่ใช้งานจริง: ${interiorB64 ? 'มี' : 'ไม่มี'}

ให้วิเคราะห์แบบ 2 part ชัดเจน: 1) หน้าบ้านภาพรวม 2) ภาพรวมภายในบ้านหรือข้อจำกัดถ้าไม่มีภาพ ใช้ทิศหน้าบ้านแบบคร่าวๆ ตามที่ผู้ใช้เลือก ไม่ต้องลงลึกถึงองศา
ให้ผูกผลวิเคราะห์กับปัญหาที่เจ้าของบ้านเลือก เช่น เงินเก็บไม่อยู่ งานติดขัด คนในบ้านเครียด บ้านรกง่าย หรือไม่อยากกลับบ้าน โดยใช้คำว่า อาจ, มักพบร่วมกับ, มีแนวโน้ม เมื่อยังไม่สามารถยืนยันจากภาพได้
ถ้าภาพหน้าบ้านเห็นรายละเอียด เช่น ประตู ทางเดิน รั้ว พื้น ชาน ทางลาด ของวาง ตู้ไฟ สายไฟ หลังคา ความทึบ ความโปร่ง ให้ดึงสิ่งนั้นมาเขียนโดยตรง ห้ามตอบแบบกว้างๆ
ถ้ามีภาพภายใน ให้ภาพภายในต้องทำให้ผลดีขึ้นอย่างน้อย 2 จุด: 1) ระบุว่าพลังงานจากหน้าบ้านเข้าไปแล้วติดหรือไหลตรงไหน 2) บอกมุม/พื้นที่ภายในที่ควรถ่ายเพิ่มหรือปรับก่อน
ห้ามเขียนว่า "ภาพภายในช่วยดู..." แบบกว้างๆ ต้องบอกว่าเห็นอะไรหรือยังไม่เห็นอะไร`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 54000);
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
        max_tokens: 2200,
        system: compactSystemPrompt,
        tools: [analysisTool],
        tool_choice: { type: 'tool', name: 'submit_fengshui_analysis' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'ภาพที่ 1: ภาพหน้าบ้าน ให้ตรวจแบบละเอียดเป็นลำดับ: 1) ประตูหลักและทางเข้ามองชัดไหม 2) เส้นทางเดินถูกบีบหรือโล่ง 3) พื้น/ชาน/ระดับพื้นส่งผลต่อการรับพลังงานไหม 4) ของวาง ต้นไม้ ตู้ไฟ สายไฟ หรือรถบังทางเข้าไหม 5) ภาพรวมทึบ โปร่ง สะอาด หรือรกแค่ไหน ต้องอ้างสิ่งที่เห็นจริง ห้ามตอบแบบกว้าง' },
            { type: 'image', source: { type: 'base64', media_type: photoMime || 'image/jpeg', data: photoB64 } },
            ...(interiorB64 ? [
              { type: 'text', text: 'ภาพที่ 2: ภาพภายในบ้าน ให้ตรวจว่าหลังเปิดประตูเข้าบ้านแล้วพลังงานเจออะไร: โถงแรก ทางเดิน ผนังตรงประตู เฟอร์นิเจอร์ แสง ของกีดขวาง จุดอับ และความโล่ง ถ้าภาพไม่เห็นโถงแรกหรือทางเดิน ให้พูดตรงๆ พร้อมบอกมุมที่ต้องถ่ายเพิ่ม' },
              { type: 'image', source: { type: 'base64', media_type: interiorMime || 'image/jpeg', data: interiorB64 } }
            ] : []),
            { type: 'text', text: userText }
          ]
        }]
      })
    });

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
  } finally {
    clearTimeout(timeout);
  }
}
