# Thai CV Risk Screening & Personalized Check-up Recommendation

Production-oriented responsive screening application สำหรับประเมิน Thai CV Risk 10 ปี สร้าง personalized recommendations จาก deterministic approved rules และเชื่อม Google Apps Script → Google Sheets โดยให้ clinical safety, PDPA และ traceability มาก่อน conversion

> สถานะ: software implementation พร้อมสำหรับ staging/medical governance review แต่ข้อมูลแพ็กเกจ กฎ คำแนะนำ threshold consent copy และ clinical references ยังเป็น demo จึง **ยังไม่ควรเปิดใช้กับผู้ป่วยจริง**

## Architecture

```text
React + TypeScript + Vite + Tailwind
  ├─ calculation engine (pure/tested)
  ├─ risk factor engine
  ├─ deterministic rule engine (no eval / no generative medical advice)
  ├─ package matcher (separate from clinical advice)
  └─ text/plain JSON fetch
           ↓
Google Apps Script Web App
  ├─ server validation + authoritative recalculation
  ├─ calculation mismatch guard (±0.02)
  ├─ LockService writes + cache
  └─ Google Sheets (6 tabs)
```

Safety branches run before calculation: active red flags stop normal flow and packages; established CVD bypasses Thai CV Risk % and routes to direct physician review. Unknown diabetes does not silently become “no”. Clinical advice appears before optional hospital services.

## Local setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Variables: `VITE_API_BASE_URL`, `VITE_HOSPITAL_NAME`, `VITE_LINE_URL`, `VITE_PRIVACY_POLICY_URL`, `VITE_EMERGENCY_PHONE`, `VITE_GA_MEASUREMENT_ID`. The PPNP logo is bundled at `public/ppnp-logo.png`. Only public configuration belongs in `VITE_*`; never put Sheet ID or credentials there. With no API URL, the UI runs in clearly marked demo mode and produces a local reference so the full UX can be reviewed.

## Validation and testing

```bash
npm test
npm run build
```

Calculator implementation is in `src/services/thaiCvRiskCalculator.ts`; backend equivalent and shared vectors are in `google-apps-script/RiskCalculator.gs`. Full test matrix is in `docs/TESTING.md`.

## Google Sheets and deployment

- Sheet schema/import: `docs/GOOGLE_SHEET_SETUP.md`
- Apps Script deployment: `docs/APPS_SCRIPT_DEPLOYMENT.md`
- Vercel deployment: `docs/VERCEL_DEPLOYMENT.md`
- Medical sign-off/change control: `docs/MEDICAL_GOVERNANCE.md`

## Updating runtime content

Packages, rules, content and public config live in their corresponding Sheet tabs. Only rows with `active=TRUE` are exposed. Package tests/tags use `|` separators. Rule operators are limited to `= != > >= < <= IN`; JavaScript expressions and `eval()` are never used. Cache refresh is up to five minutes.

For production changes: add a new rule/content version, test against a staging Sheet, collect medical/DPO approval, then activate. Do not overwrite the version that generated historical assessments.

## Privacy and analytics

Health consent is required for calculation; contact/marketing consent is optional and explicitly requested at callback intent when absent. UTM parameters are captured once in session storage. The analytics wrapper only permits risk level, model, campaign and package ID—never name, phone, DOB, email or exact clinical values. PII is not put in URLs or browser console logs.

Data retention, access control, lawful basis, consent withdrawal, incident response, vendor agreements and deletion workflows must be defined by the hospital DPO/security team before production.
