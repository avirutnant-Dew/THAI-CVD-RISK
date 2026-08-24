// ===== Code.gs =====
/** Entry points for the deployed Google Apps Script Web App. */
function doGet(e) {
  try {
    enforceRateLimit_(e);
    var action = String((e && e.parameter && e.parameter.action) || 'config');
    if (action === 'config') return jsonSuccess_(getPublicConfig_());
    if (action === 'packages') return jsonSuccess_(getActivePackages_());
    if (action === 'recommendations') return jsonSuccess_({ rules: getActiveRecommendationRules_(), content: getActiveRecommendationContent_() });
    return jsonError_('NOT_FOUND', 'ไม่พบข้อมูลที่ร้องขอ');
  } catch (error) { return handleApiError_(error); }
}

function doPost(e) {
  try {
    enforceRateLimit_(e);
    var payload = parseJsonBody_(e);
    if (payload.action === 'assessment') return jsonSuccess_(createAssessment_(payload));
    if (payload.action === 'lead') return jsonSuccess_(createLead_(payload));
    return jsonError_('NOT_FOUND', 'ไม่พบการดำเนินการที่ร้องขอ');
  } catch (error) { return handleApiError_(error); }
}

function parseJsonBody_(e) {
  if (!e || !e.postData || !e.postData.contents) throw apiError_('INVALID_REQUEST', 'คำขอไม่ถูกต้อง');
  try { return JSON.parse(e.postData.contents); } catch (_) { throw apiError_('INVALID_JSON', 'รูปแบบข้อมูลไม่ถูกต้อง'); }
}

function jsonSuccess_(data) { return json_({ success: true, data: data, error: null }); }
function jsonError_(code, message) { return json_({ success: false, data: null, error: { code: code, message: message } }); }
function json_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function apiError_(code, safeMessage) { var error = new Error(safeMessage); error.apiCode = code; return error; }
function handleApiError_(error) {
  console.error('API error code: ' + (error.apiCode || 'INTERNAL_ERROR')); // Never log request payload/PII.
  return jsonError_(error.apiCode || 'INTERNAL_ERROR', error.apiCode ? error.message : 'ระบบขัดข้องชั่วคราว กรุณาลองอีกครั้ง');
}

function enforceRateLimit_(e) {
  var raw = String((e && e.parameter && e.parameter.action) || 'unknown') + ':' + Utilities.formatDate(new Date(), 'UTC', 'yyyyMMddHHmm');
  var key = 'rate:' + digest_(raw).slice(0, 24);
  var cache = CacheService.getScriptCache(); var count = Number(cache.get(key) || 0) + 1;
  if (count > 300) throw apiError_('RATE_LIMITED', 'มีคำขอจำนวนมากเกินไป กรุณาลองใหม่ภายหลัง');
  cache.put(key, String(count), 120);
}

function digest_(text) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }

// ===== ConfigService.gs =====
var DEFAULT_PUBLIC_CONFIG_ = {
  hospital_name: 'โรงพยาบาลพริ้นซ์ปากน้ำโพ', emergency_phone: '056-000111', line_url: '', privacy_policy_url: '',
  form_version: 'cv_form_v1', formula_version: 'thai_cv_risk_rama_v2', consent_version: 'pdpa_consent_v1',
  risk_classification_version: 'three_level_v1', physician_review_threshold: 10,
  risk_low_max: 10, risk_intermediate_max: 20, enable_callback: true, enable_package_recommendation: true
};

function getSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw apiError_('SERVER_NOT_CONFIGURED', 'ระบบยังไม่พร้อมใช้งาน');
  return SpreadsheetApp.openById(id);
}

function getPublicConfig_() {
  var values = readSheetObjects_('Config').reduce(function (result, row) { if (row.key) result[String(row.key)] = coerceConfigValue_(row.value); return result; }, {});
  var config = Object.assign({}, DEFAULT_PUBLIC_CONFIG_, values);
  return Object.keys(DEFAULT_PUBLIC_CONFIG_).reduce(function (safe, key) { safe[key] = config[key]; return safe; }, {});
}

function coerceConfigValue_(value) {
  if (String(value).toUpperCase() === 'TRUE') return true; if (String(value).toUpperCase() === 'FALSE') return false;
  if (value !== '' && !isNaN(Number(value))) return Number(value); return value;
}

function readSheetObjects_(name) {
  var sheet = getSpreadsheet_().getSheetByName(name); if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues(); var headers = values.shift().map(String);
  return values.map(function (row) { return headers.reduce(function (item, header, index) { item[header] = row[index]; return item; }, {}); });
}

function appendObjectRow_(sheetName, headers, record) {
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var sheet = getSpreadsheet_().getSheetByName(sheetName); if (!sheet) throw apiError_('SERVER_NOT_CONFIGURED', 'ระบบยังไม่พร้อมใช้งาน');
    var actualHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
    if (actualHeaders.join('|') !== headers.join('|')) throw apiError_('SCHEMA_MISMATCH', 'ระบบยังไม่พร้อมใช้งาน');
    sheet.appendRow(headers.map(function (header) { return record[header] === undefined || record[header] === null ? '' : record[header]; }));
  } finally { lock.releaseLock(); }
}

function cachedActiveRows_(sheetName) {
  var cache = CacheService.getScriptCache(); var key = 'active:' + sheetName; var cached = cache.get(key);
  if (cached) return JSON.parse(cached);
  var rows = readSheetObjects_(sheetName).filter(function (row) { return String(row.active).toUpperCase() === 'TRUE'; });
  cache.put(key, JSON.stringify(rows), 300); return rows;
}

// ===== RiskCalculator.gs =====
var FORMULA_VERSION_ = 'thai_cv_risk_rama_v2';

function calculateServerRisk_(payload) {
  var age = Number(payload.age), sex = payload.gender === 'male' ? 1 : 0, sbp = Number(payload.sbp);
  var dm = payload.diabetes_status === 'yes' ? 1 : 0, smoking = payload.smoking_status === 'current' ? 1 : 0;
  var fullScore, model = String(payload.calculation_model);
  if (model === 'lab') {
    fullScore = (0.0818347640193792 * age) + (0.394986128542107 * sex) + (0.0208425438624519 * sbp) + (0.699741921871077 * dm) + (0.00212384055469836 * Number(payload.total_cholesterol)) + (0.419162811751856 * smoking);
  } else if (model === 'non_lab') {
    fullScore = (0.0794420169146399 * age) + (0.127658073818733 * sex) + (0.0193509871323239 * sbp) + (0.584543504554125 * dm) + (0.0351256637183026 * (Number(payload.waist_cm) / Number(payload.height_cm)) * 100) + (0.459312425773018 * smoking);
  } else throw apiError_('VALIDATION_ERROR', 'ข้อมูลการคำนวณไม่ครบถ้วน');
  var baseline = model === 'lab' ? 7.044233 : 7.712325;
  var riskPercent = (1 - Math.pow(0.964588, Math.exp(fullScore - baseline))) * 100;
  return { riskPercent: riskPercent, fullScore: fullScore, modelType: model };
}

function classifyServerRisk_(risk, config) {
  if (risk < Number(config.risk_low_max)) return 'low';
  if (risk < Number(config.risk_intermediate_max)) return 'intermediate';
  return 'high';
}

/** Run manually after deployment. Throws if either shared reference vector drifts. */
function testRiskCalculator_() {
  var lab = calculateServerRisk_({ age:52, gender:'male', sbp:148, diabetes_status:'yes', smoking_status:'never', total_cholesterol:225, calculation_model:'lab' });
  var nonLab = calculateServerRisk_({ age:52, gender:'male', sbp:148, diabetes_status:'yes', smoking_status:'never', waist_cm:95, height_cm:170, calculation_model:'non_lab' });
  if (Math.abs(lab.fullScore - 8.9126964) > 0.00002 || Math.abs(lab.riskPercent - 20.83) > 0.02) throw new Error('Lab vector failed');
  if (Math.abs(nonLab.fullScore - 9.6700373) > 0.00002 || Math.abs(nonLab.riskPercent - 22.54) > 0.02) throw new Error('Non-lab vector failed');
  return { lab: lab, nonLab: nonLab, passed: true };
}

// ===== ValidationService.gs =====
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

// ===== AssessmentService.gs =====
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

// ===== LeadService.gs =====
var LEAD_HEADERS_ = ['lead_id','assessment_id','created_at','first_name','last_name','phone','risk_percent','risk_level','package_id','lead_intent','lead_status','owner','last_contact_at','next_followup_at','appointment_date','visit_status','purchase_status','revenue','remark'];

function createLead_(payload) {
  validateLead_(payload); var id = createId_('LEAD');
  appendObjectRow_('Leads', LEAD_HEADERS_, { lead_id:id, assessment_id:payload.assessment_id, created_at:new Date().toISOString(), first_name:cleanText_(payload.first_name,100), last_name:cleanText_(payload.last_name,100), phone:String(payload.phone||'').replace(/[\s-]/g,''), risk_percent:numberOrBlank_(payload.risk_percent), risk_level:cleanText_(payload.risk_level,30), package_id:cleanText_(payload.package_id,50), lead_intent:payload.lead_intent, lead_status:'New', owner:'', last_contact_at:'', next_followup_at:'', appointment_date:'', visit_status:'', purchase_status:'', revenue:'', remark:'' });
  return { lead_id:id, status:'New' };
}

// ===== PackageService.gs =====
function getActivePackages_() {
  return cachedActiveRows_('Package_Master').map(function (row) { return { package_id:cleanText_(row.package_id,50), package_name:cleanText_(row.package_name,150), short_description:cleanText_(row.short_description,500), full_description:cleanText_(row.full_description,2000), normal_price:numberOrBlank_(row.normal_price), promo_price:numberOrBlank_(row.promo_price), image_url:cleanText_(row.image_url,500), detail_url:cleanText_(row.detail_url,500), included_tests:String(row.included_tests||'').split('|').filter(Boolean), package_tags:String(row.package_tags||'').split('|').filter(Boolean), min_age:Number(row.min_age||0), max_age:Number(row.max_age||120), priority:Number(row.priority||99) }; });
}

// ===== RecommendationService.gs =====
function getActiveRecommendationRules_() {
  return cachedActiveRows_('Recommendation_Rules').map(function (row) { return { rule_id:cleanText_(row.rule_id,50), rule_name:cleanText_(row.rule_name,150), field:cleanText_(row.field,50), operator:cleanText_(row.operator,5), value:cleanText_(row.value,200), recommendation_type:cleanText_(row.recommendation_type,50), recommendation_id:cleanText_(row.recommendation_id,50), package_tag:cleanText_(row.package_tag,50), priority:Number(row.priority), version:cleanText_(row.version,50) }; });
}
function getActiveRecommendationContent_() { return cachedActiveRows_('Recommendation_Content').map(function (row) { return { recommendation_id:cleanText_(row.recommendation_id,50), title_th:cleanText_(row.title_th,200), description_th:cleanText_(row.description_th,1000), category:cleanText_(row.category,50), priority:Number(row.priority), medical_approval_version:cleanText_(row.medical_approval_version,100) }; }); }

/** Safe evaluator for server-side rule validation. Never uses eval(). */
function evaluateRuleCondition_(actual, operator, expected) {
  if (operator === 'IN') return String(expected).split('|').indexOf(String(actual)) >= 0;
  if (operator === '=') return String(actual) === String(expected); if (operator === '!=') return String(actual) !== String(expected);
  var left=Number(actual), right=Number(expected); if (!isFinite(left)||!isFinite(right)) return false;
  if(operator==='>')return left>right; if(operator==='>=')return left>=right; if(operator==='<')return left<right; if(operator==='<=')return left<=right; return false;
}

// ===== DataRetentionService.gs =====
/**
 * Permanent retention policy approved for PPNP: delete Assessments and Leads
 * after one calendar month from created_at, at the daily 24:00 Asia/Bangkok run.
 * No backup is created. Audit_Log must never contain PII or health data.
 */
var RETENTION_SHEETS_ = ['Assessments', 'Leads'];
var RETENTION_MONTHS_ = 1;
var AUDIT_HEADERS_ = ['run_at', 'sheet_name', 'rows_deleted', 'status', 'error_code'];

function deleteExpiredData_() {
  var runAt = new Date();
  RETENTION_SHEETS_.forEach(function (sheetName) {
    try {
      var deleted = deleteExpiredRowsFromSheet_(sheetName, runAt);
      writeRetentionAudit_(runAt, sheetName, deleted, 'SUCCESS', '');
    } catch (error) {
      writeRetentionAudit_(runAt, sheetName, 0, 'FAILED', error.apiCode || 'RETENTION_ERROR');
      console.error('Retention failed for ' + sheetName + ': ' + (error.apiCode || 'RETENTION_ERROR'));
    }
  });
}

function deleteExpiredRowsFromSheet_(sheetName, now) {
  var sheet = getSpreadsheet_().getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return 0;
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(String); var createdIndex = headers.indexOf('created_at');
  if (createdIndex < 0) throw apiError_('RETENTION_SCHEMA_ERROR', 'ไม่พบ created_at');
  var rowsToDelete = [];
  for (var i = 1; i < values.length; i += 1) {
    var rawCreatedAt = values[i][createdIndex];
    if (!rawCreatedAt) { writeRetentionAudit_(now, sheetName, 0, 'EXCEPTION', 'MISSING_CREATED_AT'); continue; }
    var createdAt = rawCreatedAt instanceof Date ? rawCreatedAt : new Date(String(rawCreatedAt));
    if (isNaN(createdAt.getTime())) { writeRetentionAudit_(now, sheetName, 0, 'EXCEPTION', 'INVALID_CREATED_AT'); continue; }
    var expiry = new Date(createdAt); expiry.setMonth(expiry.getMonth() + RETENTION_MONTHS_);
    if (now >= expiry) rowsToDelete.push(i + 1);
  }
  rowsToDelete.reverse().forEach(function (rowNumber) { sheet.deleteRow(rowNumber); });
  return rowsToDelete.length;
}

function writeRetentionAudit_(runAt, sheetName, rowsDeleted, status, errorCode) {
  var sheet = getSpreadsheet_().getSheetByName('Audit_Log');
  if (!sheet) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  if (headers.join('|') !== AUDIT_HEADERS_.join('|')) throw apiError_('RETENTION_SCHEMA_ERROR', 'Audit_Log schema ไม่ถูกต้อง');
  sheet.appendRow([runAt.toISOString(), sheetName, rowsDeleted, status, errorCode || '']);
}

/** Run once manually after deployment; Apps Script time triggers cannot express 24:00 exactly. */
function createDailyRetentionTrigger_() {
  ScriptApp.getProjectTriggers().filter(function (trigger) { return trigger.getHandlerFunction() === 'deleteExpiredData_'; }).forEach(function (trigger) { ScriptApp.deleteTrigger(trigger); });
  ScriptApp.newTrigger('deleteExpiredData_').timeBased().atHour(0).everyDays(1).create();
}

// Public wrappers for the Apps Script Run menu (functions ending in _ are private).
function testRiskCalculator() { return testRiskCalculator_(); }
function createDailyRetentionTrigger() { return createDailyRetentionTrigger_(); }
