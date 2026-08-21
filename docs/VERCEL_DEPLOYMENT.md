# Vercel deployment

1. push repository ไปยัง private Git provider
2. Import project ใน Vercel; framework preset เลือก Vite
3. Build command `npm run build`; output directory `dist`
4. ตั้ง environment variables ตาม `.env.example` แยก Preview/Production โดยเฉพาะ `VITE_API_BASE_URL`
5. ห้ามใส่ Spreadsheet ID, Apps Script credential หรือข้อมูลผู้รับบริการใน environment ที่ขึ้นต้นด้วย `VITE_`
6. deploy Preview แล้วทำ manual QA ครบทุก flow ก่อน promote Production
7. ตั้ง custom domain/HTTPS, security headers, analytics consent และ retention policy ตามมาตรฐานโรงพยาบาล

หากต้องการ SPA rewrite ในอนาคตเมื่อเพิ่ม client-side routes ให้เพิ่ม `vercel.json`; รุ่นนี้ใช้ state-based flow ใน route เดียวจึงไม่จำเป็น
