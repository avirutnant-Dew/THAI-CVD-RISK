function validateAssessment_(p) {
  var errors = [];
  ['first_name','last_name','dob','age','gender','phone','consent_timestamp','consent_version'].forEach(function (field) { if (p[field] === undefined || p[field] === null || String(p[field]).trim() === '') errors.push(field); });
  if (p.consent_health !== true) errors.push('consent_health');
  if (['male','female'].indexOf(p.gender) < 0) errors.push('gender');
  if (!/^0\d{9}$/.test(String(p.phone || '').replace(/[\s-]/g,''))) errors.push('phone');
  if (Number(p.age) < 35 || Number(p.age) > 70) errors.push('age');
  var bypass = Boolean(p.red_flag) || String(p.eligibility_status) === 'established_cvd';
  if (!bypass) {
    if (Number(p.sbp) < 70 || Number(p.sbp) > 250) errors.push('sbp');
    if (['yes','no'].indexOf(p.diabetes_status) < 0) errors.push('diabetes_status');
    if (['current','former','never'].indexOf(p.smoking_status) < 0) errors.push('smoking_status');
    if (p.calculation_model === 'lab' && (Number(p.total_cholesterol) < 80 || Number(p.total_cholesterol) > 500)) errors.push('total_cholesterol');
    if (p.calculation_model === 'non_lab') { if (Number(p.height_cm) < 100 || Number(p.height_cm) > 230) errors.push('height_cm'); if (Number(p.waist_cm) < 40 || Number(p.waist_cm) > 200) errors.push('waist_cm'); }
    if (['lab','non_lab'].indexOf(p.calculation_model) < 0) errors.push('calculation_model');
  }
  if (errors.length) throw apiError_('VALIDATION_ERROR', 'กรุณาตรวจสอบข้อมูลที่กรอก');
}

function validateLead_(p) {
  if (!p.assessment_id || !/^CV-\d{8}-[A-Z2-9]{6}$/.test(String(p.assessment_id))) throw apiError_('VALIDATION_ERROR', 'ข้อมูลคำขอไม่ถูกต้อง');
  if (['callback','package_interest','doctor_appointment'].indexOf(p.lead_intent) < 0) throw apiError_('VALIDATION_ERROR', 'ข้อมูลคำขอไม่ถูกต้อง');
  if (p.consent_marketing !== true) throw apiError_('CONSENT_REQUIRED', 'กรุณายืนยันความยินยอมให้ติดต่อกลับ');
}

function cleanText_(value, max) { return String(value || '').replace(/[<>]/g, '').trim().slice(0, max || 500); }
function bool_(value) { return value === true || String(value).toUpperCase() === 'TRUE'; }
