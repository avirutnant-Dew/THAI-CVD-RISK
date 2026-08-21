var FORMULA_VERSION_ = 'thai_cv_risk_v1';

function calculateServerRisk_(payload) {
  var age = Number(payload.age), sex = payload.gender === 'male' ? 1 : 0, sbp = Number(payload.sbp);
  var dm = payload.diabetes_status === 'yes' ? 1 : 0, smoking = payload.smoking_status === 'current' ? 1 : 0;
  var fullScore, model = String(payload.calculation_model);
  if (model === 'lab') {
    fullScore = (0.08183 * age) + (0.39499 * sex) + (0.02084 * sbp) + (0.69974 * dm) + (0.00212 * Number(payload.total_cholesterol)) + (0.41916 * smoking);
  } else if (model === 'non_lab') {
    fullScore = (0.079 * age) + (0.128 * sex) + (0.019350987 * sbp) + (0.58454 * dm) + (3.512566 * (Number(payload.waist_cm) / Number(payload.height_cm))) + (0.459 * smoking);
  } else throw apiError_('VALIDATION_ERROR', 'ข้อมูลการคำนวณไม่ครบถ้วน');
  var baseline = model === 'lab' ? 7.04423 : 7.720484;
  var riskPercent = (1 - Math.pow(0.978296, Math.exp(fullScore - baseline))) * 100;
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
  if (Math.abs(lab.fullScore - 8.91121) > 0.00002 || Math.abs(lab.riskPercent - 13.23) > 0.02) throw new Error('Lab vector failed');
  if (Math.abs(nonLab.fullScore - 9.64739) > 0.00002 || Math.abs(nonLab.riskPercent - 13.99) > 0.02) throw new Error('Non-lab vector failed');
  return { lab: lab, nonLab: nonLab, passed: true };
}
