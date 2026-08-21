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
