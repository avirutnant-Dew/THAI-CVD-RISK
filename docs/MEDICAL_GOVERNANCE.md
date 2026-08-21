# Medical governance register

สถานะปัจจุบัน: **Clinical rules approved by designated physician; technical/DPO deployment controls remain operational responsibilities of the hospital**

| รายการ | Version | สถานะ / ผู้อนุมัติ |
|---|---|---|
| Formula | `thai_cv_risk_v1` | coefficients implemented; physician confirmation recorded below |
| Risk classification | `three_level_v1` (`<10`, `10–<20`, `≥20`) | approved by designated physician |
| Recommendation content/rules | `demo_v1` | approved for configured screening language; no medication directives |
| Package mapping | `demo_v1` | optional service mapping; clinical advice remains first |
| Consent copy | `pdpa_consent_v1` | DPO/legal review required |

## Formula coefficients

Laboratory FullScore: `0.08183*AGE + 0.39499*SEX + 0.02084*SBP + 0.69974*DM + 0.00212*CHOL + 0.41916*SMOKING`; risk baseline `0.978296`, centering `7.04423`.

Non-laboratory FullScore: `0.079*AGE + 0.128*SEX + 0.019350987*SBP + 0.58454*DM + 3.512566*(WAIST/HEIGHT) + 0.459*SMOKING`; risk baseline `0.978296`, centering `7.720484`.

Sources: Ministry of Public Health Thai CV Risk operational formula; Vathesatogkit et al., EGAT cohort, DOI `10.1093/ije/dyq218`; RCPT Dyslipidemia CPG 2024; Satian et al. external validation, DOI `10.14456/reg11med.2022.16`.

Intended population: Thai adults aged 35–70 without established ASCVD. Significant valvular disease and clinically relevant arrhythmia (including AF) bypass the score and require clinician assessment. Red flags bypass calculation and package marketing.

Approved operational decisions: physician review threshold `≥10%`; SBP `≥180 mmHg` triggers urgent repeat-measurement/medical-assessment messaging; unknown diabetes blocks calculation; no medication start/stop/dose advice; result disclaimer is mandatory.

## Approval record

- Date approved: 21 Aug 2026
- Approved by: วศิน อวิรุทธ์นันท์, อายุรแพทย์
- Approved recommendation version: demo_v1
- Approved package mapping version: demo_v1

## Data retention decision

Assessments and Leads are hard-deleted after one calendar month from `created_at`, in Production, Staging and Demo, at the daily 24:00 Asia/Bangkok run. No backup is created. Only non-PII retention audit metadata is kept in `Audit_Log`; failed deletion retries next run and rows with missing/invalid `created_at` are not deleted automatically.

## Change control

ห้ามแก้ active rules/content ทับ version เดิมใน production ให้เพิ่ม version ใหม่ ทดสอบใน staging, บันทึก test evidence, ระบุผู้ทบทวน และสลับ active หลังอนุมัติเท่านั้น ทุก assessment เก็บ formula, classification และ consent version เพื่อ trace ย้อนหลัง

## Change log

| Date | Change | Author | Approval |
|---|---|---|---|
| 2026-08-21 | Initial demo implementation | Engineering | Pending |
