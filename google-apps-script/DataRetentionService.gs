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
