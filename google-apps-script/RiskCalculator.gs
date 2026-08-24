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
