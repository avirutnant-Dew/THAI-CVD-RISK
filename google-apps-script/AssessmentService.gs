var ASSESSMENT_HEADERS_ = ['assessment_id','created_at','form_version','formula_version','risk_classification_version','first_name','last_name','dob','age','gender','phone','email','sbp','diabetes_status','smoking_status','total_cholesterol','height_cm','waist_cm','calculation_model','full_score','client_risk_percent','server_calculated_risk','risk_level','risk_factors_json','clinical_recommendation_ids','package_id','eligibility_status','existing_cvd','red_flag','consent_health','consent_marketing','consent_timestamp','consent_version','utm_source','utm_medium','utm_campaign','utm_content','utm_term','user_agent','lead_requested'];

function createAssessment_(payload) {
  validateAssessment_(payload); var config = getPublicConfig_(); var bypass = bool_(payload.red_flag) || payload.eligibility_status === 'established_cvd';
  var calculated = bypass ? { fullScore: '', riskPercent: '', modelType: '' } : calculateServerRisk_(payload);
  if (!bypass && payload.client_risk_percent !== null && Math.abs(Number(payload.client_risk_percent) - calculated.riskPercent) > 0.02) throw apiError_('CALCULATION_MISMATCH', 'ไม่สามารถยืนยันผลการคำนวณได้ กรุณาลองใหม่');
  var id = createId_('CV'); var now = new Date();
  var record = {
    assessment_id:id, created_at:now.toISOString(), form_version:cleanText_(payload.form_version,50), formula_version:FORMULA_VERSION_, risk_classification_version:cleanText_(config.risk_classification_version,50),
    first_name:cleanText_(payload.first_name,100), last_name:cleanText_(payload.last_name,100), dob:cleanText_(payload.dob,10), age:Number(payload.age), gender:payload.gender,
    phone:String(payload.phone).replace(/[\s-]/g,''), email:cleanText_(payload.email,150), sbp:bypass?'':Number(payload.sbp), diabetes_status:bypass?'':payload.diabetes_status, smoking_status:bypass?'':payload.smoking_status,
    total_cholesterol:bypass?'':numberOrBlank_(payload.total_cholesterol), height_cm:bypass?'':numberOrBlank_(payload.height_cm), waist_cm:bypass?'':numberOrBlank_(payload.waist_cm), calculation_model:calculated.modelType,
    full_score:calculated.fullScore, client_risk_percent:bypass?'':Number(payload.client_risk_percent), server_calculated_risk:calculated.riskPercent, risk_level:bypass?'':classifyServerRisk_(calculated.riskPercent,config),
    risk_factors_json:JSON.stringify(payload.risk_factors || []), clinical_recommendation_ids:(payload.clinical_recommendation_ids || []).map(function(v){return cleanText_(v,50);}).join(','), package_id:cleanText_(payload.package_id,50),
    eligibility_status:cleanText_(payload.eligibility_status,30), existing_cvd:JSON.stringify(payload.existing_cvd || []), red_flag:bool_(payload.red_flag), consent_health:true, consent_marketing:bool_(payload.consent_marketing),
    consent_timestamp:cleanText_(payload.consent_timestamp,40), consent_version:cleanText_(payload.consent_version,50), utm_source:cleanText_(payload.utm_source,100), utm_medium:cleanText_(payload.utm_medium,100), utm_campaign:cleanText_(payload.utm_campaign,100), utm_content:cleanText_(payload.utm_content,100), utm_term:cleanText_(payload.utm_term,100), user_agent:'', lead_requested:bool_(payload.lead_requested)
  };
  appendObjectRow_('Assessments', ASSESSMENT_HEADERS_, record);
  return { assessment_id:id, server_calculated_risk:calculated.riskPercent, risk_level:record.risk_level };
}

function createId_(prefix) { var date = Utilities.formatDate(new Date(), Session.getScriptTimeZone() || 'Asia/Bangkok', 'yyyyMMdd'); var chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789', out=''; for(var i=0;i<6;i++) out += chars.charAt(Math.floor(Math.random()*chars.length)); return prefix+'-'+date+'-'+out; }
function numberOrBlank_(value) { return value === '' || value === null || value === undefined ? '' : Number(value); }
