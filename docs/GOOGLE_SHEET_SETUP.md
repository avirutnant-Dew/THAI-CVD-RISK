# Google Sheet setup

1. สร้าง Google Sheet ใหม่ในบัญชีองค์กรของโรงพยาบาล และจำกัดสิทธิ์เฉพาะทีมที่จำเป็น
2. สร้าง 7 tabs: `Assessments`, `Leads`, `Package_Master`, `Recommendation_Rules`, `Recommendation_Content`, `Config`, `Audit_Log`
3. วาง header แถวแรกตามรายการด้านล่าง ห้ามสลับลำดับใน `Assessments` และ `Leads` เพราะ backend ตรวจ schema ก่อนเขียน
4. import ไฟล์ CSV ใน `seed-data/` เข้าสี่ tabs ที่ชื่อเดียวกัน ข้อมูลทั้งหมดเป็น demo และต้องผ่านการอนุมัติก่อนใช้จริง
5. ตั้ง data validation ของ `Leads.lead_status` เป็น `New, Contacted, Interested, Appointment, Visited, Purchased, Not Interested, Lost`
6. Freeze แถว header, เปิด protected range สำหรับ column ID/timestamp/formula result และจำกัด editor ของ Config/rules

## Assessments headers

```text
assessment_id,created_at,form_version,formula_version,risk_classification_version,first_name,last_name,dob,age,gender,phone,email,sbp,diabetes_status,smoking_status,total_cholesterol,height_cm,waist_cm,calculation_model,full_score,client_risk_percent,server_calculated_risk,risk_level,risk_factors_json,clinical_recommendation_ids,package_id,eligibility_status,existing_cvd,red_flag,consent_health,consent_marketing,consent_timestamp,consent_version,utm_source,utm_medium,utm_campaign,utm_content,utm_term,user_agent,lead_requested
```

`server_calculated_risk` เป็นค่า authoritative ส่วน `client_risk_percent` เก็บเพื่อ audit ความสอดคล้องเท่านั้น

## Leads headers

```text
lead_id,assessment_id,created_at,first_name,last_name,phone,risk_percent,risk_level,package_id,lead_intent,lead_status,owner,last_contact_at,next_followup_at,appointment_date,visit_status,purchase_status,revenue,remark
```

## Package_Master headers

```text
package_id,package_name,short_description,full_description,normal_price,promo_price,image_url,detail_url,included_tests,package_tags,min_age,max_age,active,priority,updated_at
```

## Recommendation_Rules headers

```text
rule_id,rule_name,condition_type,field,operator,value,recommendation_type,recommendation_id,package_tag,priority,active,version
```

operators ที่รองรับ: `=`, `!=`, `>`, `>=`, `<`, `<=`, `IN` โดย `IN` คั่นค่าด้วย `|` ห้ามใส่ JavaScript expression

## Recommendation_Content headers

```text
recommendation_id,title_th,description_th,category,priority,active,medical_approval_version
```

## Config headers

```text
key,value
```

หลังแก้ config/rules/package cache อาจใช้เวลาสูงสุด 5 นาที ข้อมูลที่ `active` ไม่ใช่ `TRUE` จะไม่ถูกส่งให้ frontend

## Audit_Log headers

```text
run_at,sheet_name,rows_deleted,status,error_code
```

`Audit_Log` ต้องไม่มีชื่อ เบอร์โทร อีเมล หรือข้อมูลสุขภาพ ระบบ retention จะลบเฉพาะ `Assessments` และ `Leads` ตาม `created_at` ครบหนึ่งเดือนตามปฏิทิน ไม่สร้าง backup และจะบันทึกเฉพาะจำนวนแถว/สถานะการทำงาน
