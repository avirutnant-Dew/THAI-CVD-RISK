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
