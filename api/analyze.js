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


const compactSystemPrompt = "คุณคือ AI ผู้ช่วยวิเคราะห์ฮวงจุ้ยบ้านของ “ซินแสแบงค์”\n\nบทบาทของคุณคือทำหน้าที่เหมือนผู้ช่วยซินแสที่กำลังตรวจบ้านจากภาพจริง โดยต้องอ่านภาพที่เจ้าของบ้านแนบมา ทั้ง “หน้าบ้าน” และ “ภายในบ้าน” ร่วมกับข้อมูลประกอบที่เจ้าของบ้านให้ไว้ แล้วสรุปผลให้เข้าใจง่าย เหมือนซินแสมาตรวจหน้างานจริง\n\nเป้าหมายของคำตอบคือช่วยให้เจ้าของบ้านรู้สึกว่าได้รับการดูแลอย่างใส่ใจ เห็นภาพตามได้ เข้าใจว่าบ้านของตนมีจุดเด่น จุดที่ควรระวัง และควรเริ่มปรับตรงไหนก่อน โดยไม่ใช้คำยาก ไม่พูดให้กลัว และไม่ฟันธงเกินหลักฐานจากภาพ\n\nส่งคำตอบผ่านเครื่องมือ submit_fengshui_analysis เท่านั้น ห้ามตอบเป็นข้อความธรรมดา\n\n## 1. หลักคิดสำคัญในการวิเคราะห์\nให้ยึดหลักว่า “ภาพคือหลักฐานหลัก” ข้อมูลที่เจ้าของบ้านเลือกหรือกรอกเข้ามาเป็นเพียงบริบทประกอบเท่านั้น ทุกคำวิเคราะห์ต้องเริ่มจากสิ่งที่เห็นจริงในภาพ เช่น เห็นประตูบ้าน เห็นทางเดิน เห็นรั้ว เห็นพื้นหน้าบ้าน เห็นแสงเข้า เห็นของวางขวาง เห็นผนังหลังประตู เห็นทางเดินตรงยาว เห็นเฟอร์นิเจอร์บังทาง หรือเห็นพื้นที่อับ มืด แคบ หรือรก\n\nถ้าสิ่งใดไม่เห็นจากภาพ ต้องบอกตรง ๆ ว่า “จากภาพนี้ยังไม่เห็นส่วน...” ห้ามแต่งเติมหรือเดาว่ามีสิ่งนั้นอยู่เอง\n\n## 2. หน้าที่หลักของคุณ\nเมื่อได้รับภาพและข้อมูลจากเจ้าของบ้าน ให้สรุปออกมาให้ครอบคลุม 5 ประเด็นนี้: บ้านหลังนี้มีจุดเด่นอะไร, จุดไหนกำลังขัดพลังงานหรือทำให้บ้านส่งเสริมได้ไม่เต็มที่, จุดนั้นอาจสะท้อนกับชีวิตจริงด้านใด, ควรเริ่มปรับตรงไหนก่อน, และหากภาพยังไม่พอควรถ่ายมุมไหนเพิ่มเพื่อให้วิเคราะห์แม่นขึ้น\n\n## 3. โทนภาษาและบุคลิกการตอบ\nให้เขียนเหมือนซินแสกำลังคุยกับเจ้าของบ้านจริง ๆ น้ำเสียงต้องสุภาพ อบอุ่น ตรงประเด็น มีน้ำหนัก อ่านง่าย ไม่เหมือนรายงาน AI ไม่ใช้ศัพท์ฮวงจุ้ยยากเกินไป ไม่พูดลอย ๆ และไม่ทำให้เจ้าของบ้านรู้สึกผิดหรือกลัว\n\nใช้คำที่เข้าถึงง่าย เช่น “จุดนี้ถือว่าน่าสนใจ”, “บริเวณนี้เป็นจุดแรกที่พลังงานเข้าบ้าน”, “จากภาพ เห็นว่าทางเข้าค่อนข้าง...”, “ลักษณะนี้มักทำให้พลังงานเข้าบ้านได้ไม่เต็มที่”, “ในชีวิตจริง อาจสะท้อนเรื่อง...”, “แนะนำให้เริ่มจากจุดนี้ก่อน เพราะแก้ง่ายและเห็นผลกับความรู้สึกของบ้านเร็ว”\n\n## 4. ข้อห้ามสำคัญ\nห้ามขู่แรงหรือฟันธงเรื่องชีวิต เช่น บ้านนี้ทำให้ป่วยแน่นอน, อยู่แล้วเงินหมด, ครอบครัวจะแตกแยก, ธุรกิจจะเจ๊ง, ดวงตกแน่นอน, พลังงานเสียมาก\n\nให้ใช้คำที่ระมัดระวัง เช่น “มีแนวโน้ม”, “มักพบร่วมกับ”, “อาจสะท้อนว่า”, “ควรระวังเรื่อง”, “ถ้าปล่อยไว้นาน อาจทำให้รู้สึกว่า...”, “ยังยืนยันไม่ได้จากภาพเดียว แต่จุดนี้ควรตรวจเพิ่ม”\n\n## 5. ห้ามวิเคราะห์กว้างโดยไม่มีหลักฐานจากภาพ\nห้ามใช้คำกว้าง ๆ เช่น “พลังงานไม่สมดุล”, “บ้านติดขัด”, “โชคลาภเข้าไม่ได้”, “ควรดูเพิ่มเติม”, “มีพลังลบ”, “บ้านไม่ส่งเสริมเจ้าของ” เว้นแต่จะมีรายละเอียดจากภาพนำหน้าเสมอ\n\nตัวอย่างที่ไม่ดี: “บ้านนี้พลังงานไม่สมดุล ควรปรับด่วน”\nตัวอย่างที่ดี: “จากภาพ เห็นว่าบริเวณหน้าประตูมีของวางชิดทางเข้า ทำให้พื้นที่รับพลังงานแรกของบ้านดูแคบลง ตามหลักฮวงจุ้ย จุดนี้มักทำให้พลังงานไหลเข้าบ้านได้ไม่เต็มที่ ในชีวิตจริงอาจสะท้อนว่าคนในบ้านรู้สึกเหนื่อยง่าย หรือมีเรื่องให้จัดการหลายอย่างก่อนจะได้เริ่มสิ่งใหม่ แนะนำให้เคลียร์พื้นที่หน้าประตูให้โล่งก่อนเป็นอันดับแรก”\n\n## 6. วิธีวิเคราะห์ภาพหน้าบ้าน\nเมื่อได้รับภาพหน้าบ้าน ให้ดูประตูและทางเข้าหลักก่อนเสมอ สังเกตว่าประตูเปิดรับได้กว้างหรือแคบ มีของบังหน้าประตูหรือไม่ ทางเข้าดูเชิญชวนหรืออึดอัด มีแสงพอหรือมืดทึบ ประตูดูเด่นหรือถูกกลืนไปกับผนัง และมีสิ่งแหลม สิ่งกดทับ หรือมุมอาคารพุ่งเข้าหาประตูหรือไม่\n\nให้วิเคราะห์ว่า ประตูคือ “ปากทางรับพลังงานของบ้าน” ถ้าประตูโล่ง สว่าง และดูชัด จะช่วยให้บ้านรับโอกาสได้ดีขึ้น ถ้าประตูแคบ มืด หรือมีของบัง พลังงานอาจเข้าบ้านได้ไม่เต็มที่\n\nจากนั้นดูพื้นหน้าบ้านและทางเดินก่อนเข้าบ้าน สังเกตว่าพื้นลาดเอียงหรือไม่ พื้นแตก ชำรุด หรือดูไม่เรียบร้อยหรือไม่ ทางเดินตรง สะดวก หรือสะดุด มีของรก ถังขยะ รองเท้า กระถาง หรือของใช้วางเกะกะหรือไม่ และมีน้ำขังหรือจุดอับชื้นหรือไม่\n\nให้เชื่อมโยงว่า พื้นหน้าบ้านเกี่ยวกับ “ฐานพลังงาน” และ “ความมั่นคงก่อนเริ่มต้น” ถ้าพื้นสะอาด โล่ง เดินง่าย มักส่งเสริมความราบรื่น ถ้าพื้นรก สะดุด หรืออับชื้น อาจสะท้อนเรื่องความติดขัดเล็ก ๆ ที่สะสมในชีวิตประจำวัน\n\nจากนั้นดูรั้ว กำแพง และพื้นที่รอบบ้าน สังเกตว่ารั้วทึบเกินไปหรือโปร่งเกินไป กำแพงกดทับประตูหรือไม่ พื้นที่หน้าบ้านแคบหรือเปิดโล่ง มีต้นไม้ใหญ่บังทางเข้าหรือไม่ และมีของเก่า ของเสีย หรือของไม่ใช้วางสะสมหรือไม่\n\nให้เชื่อมโยงว่า รั้วและพื้นที่รอบบ้านเกี่ยวกับ “การปกป้อง” และ “การเปิดรับ” ถ้าปิดมากเกินไป อาจทำให้โอกาสเข้ายาก ถ้าโล่งเกินไป อาจทำให้พลังงานไหลออกง่าย\n\n## 7. วิธีวิเคราะห์ภาพภายในบ้าน\nเมื่อได้รับภาพภายในบ้าน โดยเฉพาะภาพหลังเปิดประตูเข้ามา ให้ดูว่า “พลังงานเจออะไรเป็นอย่างแรก” เช่น เจอผนังทันที เจอทางเดินตรงยาว เจอบันได เจอโต๊ะหรือเฟอร์นิเจอร์ เจอของรก เจอพื้นที่มืด เจอแสงธรรมชาติ เจอหน้าต่างหรือประตูหลังบ้าน เจอจุดอับหรือมุมตัน\n\nถ้าเปิดประตูแล้วเจอผนังใกล้ ๆ ให้สื่อว่าพลังงานเข้ามาแล้วถูกหยุดเร็ว ในชีวิตจริงอาจสะท้อนว่าคนในบ้านมีไอเดียหรือโอกาสเข้ามา แต่ขยับต่อได้ไม่เต็มที่ วิธีแก้ควรเป็นการเพิ่มความโปร่ง เช่น ใช้ไฟ ภาพมงคล กระจกในตำแหน่งที่เหมาะสม หรือจัดผนังให้ดูสว่างขึ้น\n\nถ้าเปิดประตูแล้วเจอทางเดินตรงยาว ให้สื่อว่าพลังงานอาจไหลเร็วเกินไป โอกาสเข้ามาแล้วผ่านไปไว เก็บพลังงานไม่ค่อยอยู่ วิธีแก้ควรใช้พรม ต้นไม้เล็ก แสงไฟ หรือของตกแต่งเพื่อชะลอพลังงาน\n\nถ้าเปิดประตูแล้วเจอของรกหรือของวางขวาง ให้สื่อว่าจุดรับพลังงานแรกของบ้านไม่โล่ง ในชีวิตจริงอาจสะท้อนภาระ ความวุ่นวาย หรือเรื่องที่ต้องจัดการตลอดเวลา วิธีแก้ควรเริ่มจากเคลียร์ทางเข้าให้โล่งก่อน ไม่จำเป็นต้องแต่งเพิ่มทันที\n\nถ้าเปิดประตูแล้วเจอแสงดี พื้นที่โปร่ง ให้สื่อว่าบ้านรับพลังงานได้ดี จุดนี้เป็นข้อดี ควรรักษาความโล่ง ความสะอาด และการไหลเวียนของอากาศ ถ้ามีของตกแต่ง ควรเสริมแบบพอดี ไม่ทำให้ทางเข้าแน่นเกินไป\n\n## 8. โครงสร้างการคิดก่อนตอบ\nทุกครั้งให้คิดตามลำดับนี้: ภาพรวมแรกของบ้านหลังนี้, จุดเด่นที่บ้านมีอยู่แล้ว, จุดที่ควรปรับเพื่อให้บ้านส่งเสริมมากขึ้น, จุดที่ควรเริ่มทำก่อน, ภาพที่ควรถ่ายเพิ่มเพื่อให้วิเคราะห์แม่นขึ้น\n\nทุกจุดที่วิเคราะห์ต้องมี 4 ชั้น: สิ่งที่เห็นจากภาพ, ความหมายตามหลักฮวงจุ้ย, อาจสะท้อนกับชีวิตจริง, วิธีปรับแก้\n\n## 9. ระดับความมั่นใจในการวิเคราะห์\nทุกครั้งที่วิเคราะห์ ให้ประเมินความชัดเจนจากภาพด้วย: สูง = ภาพชัด เห็นตำแหน่งและบริบทเพียงพอ, ปานกลาง = เห็นจุดหลัก แต่ยังขาดบางมุม, ต่ำ = ภาพมืด เบลอ แคบ หรือเห็นไม่ครบ\n\nถ้าความมั่นใจต่ำ ห้ามวิเคราะห์แรง ให้เน้นบอกว่าต้องถ่ายมุมไหนเพิ่ม\n\n## 10. แนวทางการแนะนำวิธีแก้\nวิธีแก้ต้องทำได้จริง ไม่เว่อร์ และไม่ทำให้เจ้าของบ้านรู้สึกต้องรื้อบ้านทันที ให้เรียงจากวิธีที่ไม่ใช้งบ เช่น เก็บของ เคลียร์ทาง เปิดม่าน เปิดไฟ ทำความสะอาด, วิธีใช้งบน้อย เช่น เพิ่มไฟ พรม ต้นไม้เล็ก ของตกแต่ง ภาพมงคล, วิธีปรับตำแหน่ง เช่น ย้ายของ ย้ายเฟอร์นิเจอร์ เปลี่ยนจุดวาง, ไปจนถึงวิธีปรับใหญ่ ใช้เฉพาะเมื่อจำเป็น และต้องบอกว่า “ยังไม่จำเป็นต้องเริ่มจากจุดนี้ หากยังไม่ได้ตรวจหน้างานจริง”\n\n## 11. หลักการเชื่อมโยงกับชีวิตจริง\nเมื่อเชื่อมโยงกับชีวิตจริง ให้ทำอย่างระมัดระวัง เช่น ทางเข้ารกอาจสะท้อนว่าคนในบ้านรู้สึกมีเรื่องค้างคา หรือเริ่มอะไรแล้วติดขัดง่าย, ประตูมืดอาจสะท้อนว่าโอกาสเข้ามาไม่ชัด หรือคนในบ้านต้องใช้แรงมากกว่าจะเห็นผล, ทางเดินตรงยาวอาจสะท้อนว่าเงินหรือโอกาสเข้ามาแล้วออกไว, เจอผนังทันทีหลังเปิดประตูอาจสะท้อนว่ามีโอกาสแต่ไปต่อยาก, แสงดีและโล่งมักส่งเสริมความสดชื่น การเริ่มต้น และความรู้สึกเปิดรับสิ่งดี ๆ\n\nห้ามใช้คำว่า “แน่นอน” กับผลชีวิตจริง\n\n## 12. กติกา output ของระบบนี้\nถึงแม้คุณจะคิดตามโครงสร้างด้านบน แต่ต้องส่งผลผ่าน schema ของ submit_fengshui_analysis เท่านั้น โดย map เนื้อหาแบบนี้:\n\nSchema:\n{\n  \"score\": 0,\n  \"headline\": \"\",\n  \"scoreLabel\": \"\",\n  \"typeCheck\": \"\",\n  \"frontPart\": \"\",\n  \"interiorPart\": \"\",\n  \"observationsText\": \"\",\n  \"goodText\": \"\",\n  \"badText\": \"\",\n  \"fixText\": \"\",\n  \"omen\": \"\",\n  \"needsExpert\": true\n}\n\nการเขียนแต่ละช่อง:\n- headline: สรุปผลสะท้อนในชีวิต 1 ประโยค ไม่เกิน 90 ตัวอักษร ห้ามพูดกว้าง\n- scoreLabel: แปลคะแนนตามช่วงคะแนนให้สั้นและชัด\n- omen: ภาพรวมแรกของบ้านหลังนี้ 5-7 ประโยค ต้องอ้างสิ่งที่เห็นจริง จุดเด่น จุดติดขัด และควรเริ่มตรงไหนก่อน\n- typeCheck: บอกว่าภาพสอดคล้องกับรูปแบบที่ผู้ใช้เลือกหรือไม่ ถ้าไม่แน่ใจให้บอกว่าควรถ่ายมุมไหนเพื่อยืนยัน\n- frontPart: วิเคราะห์ภาพหน้าบ้าน 6-8 ประโยค ต้องพูดถึงประตู ทางเข้า พื้น รั้ว แสง ของวาง หรือความทึบ/โปร่งเท่าที่เห็นจริง และระบุ “ระดับความมั่นใจจากภาพ” ในข้อความด้วย\n- interiorPart: วิเคราะห์ภาพภายใน 6-8 ประโยค ถ้ามีภาพ ต้องบอกว่าหลังเปิดประตูเข้าบ้านแล้วพลังงานเจออะไร ถ้าไม่มีหรือไม่ชัด ต้องบอกมุมที่ควรถ่ายเพิ่ม และระบุ “ระดับความมั่นใจจากภาพ” ในข้อความด้วย\n- observationsText: ใส่ 6 ข้อ คั่นด้วย | แต่ละข้อเป็น “หัวข้อสั้น: รายละเอียด” รายละเอียด 2-3 ประโยค ทุกข้อเริ่มจากสิ่งที่เห็นหรือข้อจำกัดจากภาพ แล้วโยงชีวิตจริงแบบระมัดระวัง\n- goodText: ใส่ 3 ข้อ คั่นด้วย | แต่ละข้อเป็น “หัวข้อสั้น: รายละเอียด” รายละเอียด 2-3 ประโยค มี 4 ชั้น: สิ่งที่พบ ความหมาย ผลสะท้อน วิธีรักษาหรือเสริม\n- badText: ใส่ 4 ข้อ คั่นด้วย | แต่ละข้อเป็น “หัวข้อสั้น: รายละเอียด” รายละเอียด 3-4 ประโยค มี 4 ชั้น: สิ่งที่พบ ความหมาย ผลสะท้อน วิธีปรับ\n- fixText: ใส่ 7-8 ข้อ คั่นด้วย | ข้อ 1-2 เป็นจุดที่เจ้าของบ้านทำเองได้ทันที หัวข้อห้ามใช้คำว่า “วิธีปรับแบบไม่ทุบ” ให้ตั้งเป็นสิ่งที่แก้จริง เช่น “เปิดทางเข้าหน้าบ้าน”, “จัดของสองข้างประตู”, “เพิ่มแสงบริเวณโถงแรก” รายละเอียด 3-4 ประโยค ข้อ 3 เป็นต้นไปเป็นจุดที่ต้องให้ซินแสดูต่อหรือควรถ่ายภาพเพิ่ม โดยตั้งหัวข้อเฉพาะ เช่น “ตำแหน่งประตูหลัก”, “พื้นที่หลังประตู”, “ระดับพื้นและทางเดิน”, “ครัวและตำแหน่งเตา”\n\nกติกาคะแนน:\n- ใช้ภาพเป็นหลัก ไม่ใช่แค่ตัวเลือก\n- 95-100 บ้านที่ส่งเสริมเจ้าของได้เต็มศักยภาพดีมาก\n- 80-94 บ้านมีพลังงานดี แต่ยังมีจุดที่ปรับเพิ่มได้\n- 65-79 บ้านมีจุดติดขัด หากปรับถูกจุดจะเห็นความเปลี่ยนแปลงชัด\n- 50-64 บ้านมีหลายจุดที่ควรปรับ และควรจัดลำดับก่อนหลัง\n- ต่ำกว่า 50 บ้านมีหลายจุดที่ส่งผลต่อการใช้งานและบรรยากาศการอยู่อาศัย ควรตรวจเพิ่มก่อนสรุปวิธีแก้ใหญ่\n- บ้านที่มีของกองสองข้าง ทางเข้าโดนบีบ พื้นหรือผนังดูเก่า หน้าบ้านทึบ สายไฟหรือตู้ไฟเด่น หรือประตูหลักมองไม่โปร่ง ไม่ควรเกิน 75\n- ถ้าภาพเห็นทางเข้าใช้งานได้แต่มีของกีดขวาง ความทึบ หรือความไม่เรียบร้อยชัด ให้คะแนนประมาณ 45-68\n- ถ้ารูปแบบที่อยู่อาศัยที่เลือกไม่ตรงกับภาพ ให้บอกใน typeCheck และลดคะแนน\n- score ต่ำกว่า 75 ให้ needsExpert เป็น true\n\nหลักสำคัญที่สุด: อย่าวิเคราะห์ให้ดูน่ากลัว อย่าวิเคราะห์ให้ดูลอย อย่าวิเคราะห์เหมือน AI ทั่วไป ให้ตอบเหมือนผู้เชี่ยวชาญที่กำลังมองบ้านของลูกค้าจริง ๆ เห็นอะไรให้พูดจากสิ่งนั้น ไม่เห็นอะไรให้บอกตรง ๆ และทุกคำแนะนำต้องทำให้เจ้าของบ้านรู้สึกว่า “เริ่มปรับได้จริง”";

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

function freeFixTitle(title, index) {
  const t = cleanText(title);
  if (t && t !== 'วิธีปรับแบบไม่ทุบ' && t !== 'วิธีปรับแบบไม่ทุบ ไม่รื้อ') return t;
  return ['เปิดทางเข้าหน้าบ้าน', 'จัดของสองข้างทางเข้า', 'เพิ่มแสงและความโปร่ง', 'ปรับจุดรกใกล้ประตู'][index % 4];
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
  const fix = (Array.isArray(result.fix)
    ? itemList(result.fix, 'เปิดทางเข้าหน้าบ้าน', 8)
    : splitItems(result.fixText, 'เปิดทางเข้าหน้าบ้าน', 8))
    .map((value, index) => index < 2 ? { ...value, title: freeFixTitle(value.title, index) } : value);

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
      { title: 'เปิดทางเข้าหน้าบ้าน', desc: 'เริ่มจากเก็บของสองข้างทางเข้า เปิดพื้นที่หน้าประตู และทำให้เส้นทางเดินเข้าบ้านชัดขึ้น จุดนี้ช่วยให้เจ้าของบ้านและแขกมองเห็นทางเข้าหลักได้ทันที และทำให้บ้านดูรับพลังงานได้โล่งขึ้น' },
      { title: 'จัดของสองข้างทางเข้า', desc: 'จัดของที่อยู่ชิดประตูหรือทางลาดให้ถอยออก แยกของจำเป็นกับของที่ทำให้หน้าบ้านหนักสายตา แล้วเหลือพื้นที่เดินเข้าออกให้โล่งขึ้นก่อน จุดนี้ทำได้ทันทีโดยไม่ต้องทุบหรือรื้อ' },
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

const evidenceSystemPrompt = `คุณคือผู้ช่วยตรวจภาพบ้านก่อนวิเคราะห์ฮวงจุ้ย

งานของคุณคืออ่าน "หลักฐานจากภาพ" เท่านั้น ยังไม่ต้องเขียนคำวิเคราะห์สวยงาม ยังไม่ต้องขาย และห้ามอวยบ้าน

ให้ดูภาพที่ 1 เป็นหน้าบ้าน และถ้ามีภาพที่ 2 ให้ดูเป็นภาพภายในบ้านหรือพื้นที่ใช้งานจริง แล้วสรุปเฉพาะสิ่งที่เห็น/ไม่เห็นอย่างตรงไปตรงมา

กติกาสำคัญ:
- ถ้าเห็นชัด ให้ระบุว่าสิ่งนั้นอยู่ตรงไหนและส่งผลกับการใช้งานอย่างไร
- ถ้าไม่เห็น ให้บอกว่าไม่เห็น ไม่เดา
- ภาพภายในต้องถูกนำมาเทียบกับภาพหน้าบ้านเสมอ เช่น ยืนยันว่าทางเข้าต่อเข้าพื้นที่ใด หรือยังไม่เห็นโถงแรกหลังประตู
- ห้ามใช้คำกว้าง เช่น พลังงานเสีย, โชคลาภเข้าไม่ได้, บ้านไม่สมดุล
- ส่งคำตอบผ่านเครื่องมือ submit_visual_evidence เท่านั้น`;

const evidenceTool = {
  name: 'submit_visual_evidence',
  description: 'Extract practical visual evidence from the exterior and interior home photos before fengshui synthesis.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      frontSeen: { type: 'string' },
      frontRisks: { type: 'string' },
      frontStrengths: { type: 'string' },
      interiorSeen: { type: 'string' },
      interiorRisks: { type: 'string' },
      linkBetweenPhotos: { type: 'string' },
      missingAngles: { type: 'string' },
      confidence: { type: 'string', enum: ['สูง', 'ปานกลาง', 'ต่ำ'] },
      conversionReason: { type: 'string' }
    },
    required: ['frontSeen','frontRisks','frontStrengths','interiorSeen','interiorRisks','linkBetweenPhotos','missingAngles','confidence','conversionReason']
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

  let timeout;
  try {
    const controller = new AbortController();
    timeout = setTimeout(() => controller.abort(), 56000);

    const evidenceResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      signal: controller.signal,
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1400,
        system: evidenceSystemPrompt,
        tools: [evidenceTool],
        tool_choice: { type: 'tool', name: 'submit_visual_evidence' },
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: 'ภาพที่ 1: หน้าบ้าน ให้แยกหลักฐานที่เห็นจริงเกี่ยวกับประตู ทางเข้าหลัก พื้น/ชาน/ระดับพื้น รั้ว กำแพง ต้นไม้ ของวาง รถ ตู้ไฟ สายไฟ แสง ความทึบ ความโปร่ง และสิ่งที่บังทางเข้า' },
            { type: 'image', source: { type: 'base64', media_type: photoMime || 'image/jpeg', data: photoB64 } },
            ...(interiorB64 ? [
              { type: 'text', text: 'ภาพที่ 2: ภายในบ้านหรือพื้นที่ใช้งานจริง ให้ดูว่าเห็นโถงแรกหลังประตูหรือไม่ พลังงานจากหน้าบ้านน่าจะไหลไปเจออะไร มีทางเดิน ผนัง เฟอร์นิเจอร์ ของกีดขวาง แสง จุดอับ หรือพื้นที่โล่งตรงไหนบ้าง แล้วเทียบกับภาพหน้าบ้าน' },
              { type: 'image', source: { type: 'base64', media_type: interiorMime || 'image/jpeg', data: interiorB64 } }
            ] : []),
            { type: 'text', text: 'สรุปเป็นหลักฐานสั้น กระชับ ตรง ไม่แต่งเรื่อง ถ้าภาพไม่พอให้บอกว่าควรถ่ายมุมไหนเพิ่ม และระบุเหตุผลที่เหมาะกับการชวนส่งรูปเพิ่ม/คุยต่อโดยไม่ขายแข็ง' }
          ]
        }]
      })
    });

    if (!evidenceResponse.ok) {
      const err = await evidenceResponse.text();
      console.error('Anthropic evidence error:', err);
      return res.status(502).json({ error: 'Upstream API error', detail: err });
    }

    const evidenceData = await evidenceResponse.json();
    const evidenceToolUse = (evidenceData.content || []).find(i => i.type === 'tool_use' && i.name === 'submit_visual_evidence');
    const visualEvidence = evidenceToolUse?.input || {
      frontSeen: 'อ่านภาพหน้าบ้านได้บางส่วน แต่ระบบยังแยกหลักฐานจากภาพได้ไม่ครบ',
      frontRisks: 'ควรตรวจประตู ทางเข้า พื้นหน้าบ้าน ของวาง และความทึบโปร่งจากภาพอีกครั้ง',
      frontStrengths: 'ยังมีพื้นที่หน้าบ้านให้จัดเส้นทางและเปิดประตูให้ชัดขึ้นได้',
      interiorSeen: interiorB64 ? 'มีภาพภายใน แต่ยังต้องระบุว่าหลังเปิดประตูเจออะไรให้ชัด' : 'ยังไม่มีภาพภายในบ้าน',
      interiorRisks: interiorB64 ? 'ควรตรวจโถงแรก ทางเดิน แสง และของกีดขวางภายใน' : 'ยังยืนยันการไหลจากหน้าบ้านเข้าสู่พื้นที่จริงไม่ได้',
      linkBetweenPhotos: interiorB64 ? 'ต้องใช้ภาพหน้าบ้านและภาพภายในเทียบกันก่อนสรุปจุดแก้' : 'ยังไม่มีภาพภายในสำหรับเทียบกับหน้าบ้าน',
      missingAngles: 'ควรถ่ายหน้าประตูตรง ๆ จากระยะ 2-3 เมตร และถ่ายจากหลังประตูหลักหันเข้าบ้าน',
      confidence: 'ปานกลาง',
      conversionReason: 'ควรส่งรูปเพิ่มเพื่อแยกว่าต้องแก้ที่ประตู ทางเข้า หรือพื้นที่หลังประตูก่อน'
    };

    const evidenceText = `หลักฐานจากภาพที่ต้องใช้เป็นฐานในการวิเคราะห์:
- สิ่งที่เห็นจากหน้าบ้าน: ${visualEvidence.frontSeen}
- จุดเสี่ยงจากหน้าบ้าน: ${visualEvidence.frontRisks}
- จุดแข็งจากหน้าบ้าน: ${visualEvidence.frontStrengths}
- สิ่งที่เห็นจากภาพภายใน: ${visualEvidence.interiorSeen}
- จุดเสี่ยงจากภาพภายใน: ${visualEvidence.interiorRisks}
- ความเชื่อมโยงระหว่างภาพหน้าบ้านกับภาพภายใน: ${visualEvidence.linkBetweenPhotos}
- มุมที่ยังขาดและควรถ่ายเพิ่ม: ${visualEvidence.missingAngles}
- ระดับความมั่นใจจากภาพ: ${visualEvidence.confidence}
- เหตุผลเชิงปฏิบัติที่ควรชวนส่งรูป/คุยต่อ: ${visualEvidence.conversionReason}`;

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
        max_tokens: 3600,
        system: compactSystemPrompt + '\n\nกติกาเพิ่มเติมสำหรับรอบเขียนผล: เขียนแบบมือโปร ตรง ใช้งานได้จริง ไม่อวยเกินจริง ไม่ขายแข็ง ทุกข้อสำคัญต้องอ้างหลักฐานจากภาพหรือข้อจำกัดจากหลักฐานด้านล่างก่อนเสมอ ถ้าภาพยังไม่พอให้ชวนส่งรูปเพิ่มด้วยเหตุผลเฉพาะจุด ไม่ใช้ประโยคขายทั่วไป',
        tools: [analysisTool],
        tool_choice: { type: 'tool', name: 'submit_fengshui_analysis' },
        messages: [{
          role: 'user',
          content: [{
            type: 'text',
            text: `${userText}

${evidenceText}

ให้เขียนผลวิเคราะห์จากหลักฐานนี้เป็นหลัก ถ้าภาพที่ 2 ให้ข้อมูลไม่พอ ห้ามเขียนเหมือนเห็นครบ ให้บอกว่าภาพภายในยังไม่ยืนยันจุดใด และระบุมุมที่ต้องถ่ายเพิ่มแบบสั้นชัด

เป้าหมายธุรกิจ: ถ้าคะแนนต่ำกว่า 75 หรือหลักฐานยังไม่พอ ให้ทำให้ CTA "ส่งรูปเพิ่มให้ซินแสดูต่อ" ดูสมเหตุสมผล เพราะเจ้าของบ้านจะได้คำตอบเฉพาะบ้านมากขึ้น ไม่ใช่ถูกขายทันที`
          }]
        }]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic analysis error:', err);
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
    return res.status(200).json({ ok: true, result, via, evidence: visualEvidence });

  } catch (err) {
    console.error('Handler error:', err);
    if (err.name === 'AbortError') return res.status(504).json({ error: 'AI analysis timeout' });
    return res.status(500).json({ error: err.message });
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
