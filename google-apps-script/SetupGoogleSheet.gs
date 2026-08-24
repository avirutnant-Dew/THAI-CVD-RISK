/** One-time setup: creates required tabs, headers, and approved demo seed data. */
function setupGoogleSheet() {
  var ss = getSpreadsheet_();
  var schemas = {
    Assessments: 'assessment_id,created_at,form_version,formula_version,risk_classification_version,first_name,last_name,dob,age,gender,phone,email,sbp,diabetes_status,smoking_status,total_cholesterol,height_cm,waist_cm,calculation_model,full_score,client_risk_percent,server_calculated_risk,risk_level,risk_factors_json,clinical_recommendation_ids,package_id,eligibility_status,existing_cvd,red_flag,consent_health,consent_marketing,consent_timestamp,consent_version,utm_source,utm_medium,utm_campaign,utm_content,utm_term,user_agent,lead_requested',
    Leads: 'lead_id,assessment_id,created_at,first_name,last_name,phone,risk_percent,risk_level,package_id,lead_intent,lead_status,owner,last_contact_at,next_followup_at,appointment_date,visit_status,purchase_status,revenue,remark',
    Package_Master: 'package_id,package_name,short_description,full_description,normal_price,promo_price,image_url,detail_url,included_tests,package_tags,min_age,max_age,active,priority,updated_at',
    Recommendation_Rules: 'rule_id,rule_name,condition_type,field,operator,value,recommendation_type,recommendation_id,package_tag,priority,active,version',
    Recommendation_Content: 'recommendation_id,title_th,description_th,category,priority,active,medical_approval_version',
    Config: 'key,value',
    Audit_Log: 'run_at,sheet_name,rows_deleted,status,error_code'
  };
  Object.keys(schemas).forEach(function(name) {
    var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sheet.getLastRow() === 0) sheet.appendRow(schemas[name].split(','));
    sheet.setFrozenRows(1);
  });
  seedIfEmpty_(ss.getSheetByName('Config'), [
    ['hospital_name','โรงพยาบาลพริ้นซ์ปากน้ำโพ'],['emergency_phone','056-000111'],['form_version','cv_form_v1'],['formula_version','thai_cv_risk_rama_v2'],['consent_version','pdpa_consent_v1'],['risk_classification_version','three_level_v1'],['physician_review_threshold','10'],['risk_low_max','10'],['risk_intermediate_max','20'],['enable_callback','TRUE'],['enable_package_recommendation','TRUE']
  ]);
  seedIfEmpty_(ss.getSheetByName('Recommendation_Rules'), [
    ['R001','Emergency symptoms','boolean','redFlags','=','TRUE','safety','REC_EMERGENCY','',1,'TRUE','demo_v1'],['R002','Established CVD','boolean','existingCvd','=','TRUE','clinical','REC_CVD','cardiology',2,'TRUE','demo_v1'],['R003','Physician review threshold','number','riskPercent','>=','10','physician_review','REC_PHYSICIAN','high_cv_risk',2,'TRUE','demo_v1'],['R004','Elevated SBP','number','sbp','>=','130','clinical','REC_BP','hypertension',2,'TRUE','demo_v1'],['R005','Diabetes','boolean','diabetes','=','TRUE','investigation','REC_DM','diabetes',3,'TRUE','demo_v1'],['R006','Current smoker','text','smoking','=','current','lifestyle','REC_SMOKE','',4,'TRUE','demo_v1'],['R007','General lifestyle','number','riskPercent','>=','0','lifestyle','REC_LIFESTYLE','basic_cv',4,'TRUE','demo_v1']
  ]);
  seedIfEmpty_(ss.getSheetByName('Recommendation_Content'), [
    ['REC_EMERGENCY','รับการประเมินทางการแพทย์โดยเร็ว','ไม่ควรรอผลจากแบบประเมินออนไลน์ หากอาการรุนแรงหรือกำลังเป็นอยู่ให้ติดต่อบริการฉุกเฉิน','safety',1,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_CVD','พบแพทย์เพื่อวางแผนดูแลโดยตรง','แบบประเมินนี้อาจไม่เหมาะกับประวัติโรคหัวใจและหลอดเลือดเดิม','clinical',2,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_PHYSICIAN','ปรึกษาแพทย์เพื่อประเมินความเสี่ยงโดยรวม','แพทย์สามารถทบทวนประวัติ ผลตรวจ และปัจจัยอื่นที่แบบประเมินไม่ครอบคลุม','clinical',2,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_BP','ติดตามความดันโลหิต','ควรวัดซ้ำด้วยวิธีที่ถูกต้อง และปรึกษาบุคลากรทางการแพทย์หากค่ายังสูง','clinical',2,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_DM','ทบทวนการควบคุมระดับน้ำตาล','พิจารณาทบทวน HbA1c ระดับน้ำตาล และการทำงานของไตกับทีมรักษา','investigation',3,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_SMOKE','วางแผนหยุดสูบบุหรี่','ขอคำปรึกษาเพื่อเลือกวิธีเลิกบุหรี่ที่เหมาะสมและปลอดภัย','lifestyle',4,'TRUE','DEMO_REVIEW_REQUIRED'],['REC_LIFESTYLE','ดูแลสุขภาพหัวใจอย่างสม่ำเสมอ','เลือกอาหารที่เหมาะสม จำกัดเค็ม เคลื่อนไหวตามความเหมาะสม นอนให้เพียงพอ และติดตามโรคประจำตัว','lifestyle',4,'TRUE','DEMO_REVIEW_REQUIRED']
  ]);
  seedIfEmpty_(ss.getSheetByName('Package_Master'), [
    ['CV001','Basic Cardiovascular Screening','ชุดตรวจพื้นฐานเพื่อทบทวนปัจจัยสุขภาพหัวใจ','DEMO ONLY — ต้องแทนที่ด้วยข้อมูลที่โรงพยาบาลอนุมัติ','','','','','ตรวจสุขภาพพื้นฐาน|ทบทวนความดัน','basic_cv',35,70,'TRUE',4,'2026-08-21'],
    ['CV002','Cardiometabolic Screening','ชุดตรวจสำหรับปัจจัยเมตาบอลิกที่ควรติดตาม','DEMO ONLY — ต้องแทนที่ด้วยข้อมูลที่โรงพยาบาลอนุมัติ','','','','','HbA1c|การทำงานของไต','metabolic|diabetes|hypertension',35,70,'TRUE',3,'2026-08-21'],
    ['CV003','Comprehensive Cardiovascular Assessment','การประเมินสุขภาพหัวใจแบบครอบคลุม','DEMO ONLY — ต้องแทนที่ด้วยข้อมูลที่โรงพยาบาลอนุมัติ','','','','','ประเมินปัจจัยเสี่ยง|ปรึกษาบุคลากรทางการแพทย์','high_cv_risk|hypertension',35,70,'TRUE',2,'2026-08-21'],
    ['CV004','Cardiology Consultation','เส้นทางนัดหมายเพื่อพบแพทย์โรคหัวใจ','DEMO ONLY — ไม่ใช่คำแนะนำจาก Thai CV Risk %','','','','','ปรึกษาแพทย์โรคหัวใจ','cardiology',18,100,'TRUE',1,'2026-08-21']
  ]);
  return 'Setup complete: 7 tabs created; seed data added only to empty configuration tabs.';
}

function seedIfEmpty_(sheet, rows) {
  if (sheet.getLastRow() <= 1 && rows.length) sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
}
