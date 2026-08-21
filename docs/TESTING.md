# Testing and manual QA

## Automated

```bash
npm test
npm run build
```

`tests/thaiCvRiskCalculator.test.ts` ครอบคลุม reference vectors, male/female, smoker/non-smoker, DM/non-DM, boundaries, invalid/missing input และ risk classification. `testRiskCalculator_()` ใช้ vectors เดียวกันใน Apps Script. `recommendationEngine.test.ts` ตรวจ operator, emergency priority และ rule traceability

## Manual QA checklist

- [ ] low / intermediate / high risk และค่า boundary 10%, 20%
- [ ] male / female, current/former/never smoker, diabetes yes/no
- [ ] lab และ non-lab, ค่า BP/cholesterol/height/waist ต่ำ-สูงสุด
- [ ] unknown diabetes หยุด calculation พร้อมคำอธิบาย
- [ ] established CVD ไม่แสดง Thai CV Risk % เป็นผลหลัก
- [ ] red flag แสดง emergency ก่อน marketing และไม่แสดง package
- [ ] consent health บังคับ; marketing ไม่บังคับ; callback ขอ explicit consent อีกครั้ง
- [ ] invalid DOB/age, phone, email, BP, cholesterol และข้อมูลขาด
- [ ] Back/Next รักษาข้อมูลเดิม; ไม่มี PII ใน URL หรือ analytics
- [ ] API failure รักษาผลบนหน้าและไม่กล่าวว่าบันทึกสำเร็จ
- [ ] double submit ถูกปิดด้วย busy state
- [ ] server-calculated risk ตรง client ภายใน ±0.02 และ mismatch ถูก reject
- [ ] Sheet columns ตรง schema; IDs/consent/version/UTM บันทึกครบ
- [ ] rules inactive ไม่โหลด; ทุก recommendation มี rule ID; package มี match reason
- [ ] 320, 375, 390, 430, 768, 1024, 1440px ไม่มี horizontal scroll; touch target ≥44px
- [ ] keyboard navigation, focus ring, screen-reader labels, reduced motion
- [ ] Chrome/Safari/Edge mobile and desktop; production console ไม่มี error หรือ PII
