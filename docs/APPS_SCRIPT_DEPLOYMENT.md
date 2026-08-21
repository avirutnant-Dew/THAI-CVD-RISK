# Google Apps Script deployment

1. จาก Google Sheet ไปที่ Extensions → Apps Script
2. สร้างไฟล์ `.gs` ตามชื่อใน `google-apps-script/` แล้ววางเนื้อหาแต่ละไฟล์ รวมถึงแก้ manifest ให้ตรง `appsscript.json`
3. Project Settings → Script properties → เพิ่ม `SPREADSHEET_ID` โดยใช้ ID จาก URL ของ Sheet ห้ามใส่ ID ใน frontend
4. ตั้ง timezone เป็น `Asia/Bangkok`
5. รัน `testRiskCalculator_()` จาก editor และยืนยันผล `{ passed: true }` ก่อน deploy
6. สร้าง `Audit_Log` ตาม schema ใน `docs/GOOGLE_SHEET_SETUP.md`
7. รัน `createDailyRetentionTrigger_()` หนึ่งครั้งเพื่อสร้าง daily trigger เวลา 00:00 ตาม timezone ของ project
8. Deploy → New deployment → Web app; execute as ผู้ deploy และกำหนด access ตามนโยบายองค์กร/สถาปัตยกรรมที่อนุมัติ
9. Copy deployment URL ไปใส่ `VITE_API_BASE_URL`
10. ทดสอบ `GET <URL>?action=config`, `packages`, `recommendations` และ POST assessment/lead ใน staging Sheet

Apps Script รับ POST เป็น `text/plain` เพื่อเลี่ยง browser preflight ที่ Web App รองรับไม่สม่ำเสมอ แต่ body ยังคงเป็น JSON และ validate ฝั่ง server ทุกครั้ง การเขียน row ใช้ `LockService`; config/master data cache 5 นาที; error response ไม่เผยรายละเอียดภายใน และ server log ไม่บันทึก payload/PII

ก่อนเปิด production ควรวาง API Gateway/WAF หรือ Cloud Run proxy หน้า Apps Script หากต้องการ rate limit ต่อ IP, bot protection, audit log และ origin policy ที่เข้มกว่ากลไก CacheService ใน v1
