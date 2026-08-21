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
