import type { AssessmentState, RiskResult } from '../types/assessment'
import type { RecommendationResult, RiskFactor } from '../types/recommendation'
import type { RecommendationContent, RecommendationRule } from '../types/recommendation'
import type { HealthPackage } from '../types/package'
import { normalizePhone, sanitizeText } from '../utils/validation'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined

async function request<T>(action: string, options?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error('API_NOT_CONFIGURED')
  const response = await fetch(`${API_BASE_URL}?action=${encodeURIComponent(action)}`, { ...options, headers: { 'Content-Type': 'text/plain;charset=utf-8', ...options?.headers } })
  if (!response.ok) throw new Error('API_UNAVAILABLE')
  const payload = await response.json() as { success: boolean; data: T; error?: { code: string } }
  if (!payload.success) throw new Error(payload.error?.code ?? 'API_ERROR')
  return payload.data
}

export interface AssessmentResponse { assessment_id: string; server_calculated_risk?: number }

export async function fetchPackages(): Promise<HealthPackage[]> {
  const rows = await request<Array<Record<string, unknown>>>('packages')
  return rows.map((row) => ({ packageId: String(row.package_id), packageName: String(row.package_name), shortDescription: String(row.short_description), fullDescription: String(row.full_description), normalPrice: Number(row.normal_price) || undefined, promoPrice: Number(row.promo_price) || undefined, imageUrl: String(row.package_id) === 'CV004' ? '/packages/cv004-advanced.svg' : String(row.image_url || ''), detailUrl: String(row.detail_url || ''), includedTests: Array.isArray(row.included_tests) ? row.included_tests.map(String) : [], packageTags: Array.isArray(row.package_tags) ? row.package_tags.map(String) : [], minAge: Number(row.min_age), maxAge: Number(row.max_age), active: true, priority: Number(row.priority), demoOnly: false }))
}

export async function fetchRecommendations(): Promise<{ rules: RecommendationRule[]; content: Record<string, RecommendationContent> }> {
  const data = await request<{ rules: Array<Record<string, unknown>>; content: Array<Record<string, unknown>> }>('recommendations')
  const rules: RecommendationRule[] = data.rules.map((row) => ({ ruleId: String(row.rule_id), field: String(row.field), operator: String(row.operator) as RecommendationRule['operator'], value: parseRuleValue(row.value, String(row.operator)), recommendationId: String(row.recommendation_id), packageTag: row.package_tag ? String(row.package_tag) : undefined, priority: Number(row.priority), active: true }))
  const content = Object.fromEntries(data.content.map((row) => [String(row.recommendation_id), { id: String(row.recommendation_id), title: String(row.title_th), description: String(row.description_th), category: String(row.category) as RecommendationContent['category'], priority: Number(row.priority), reason: 'คำแนะนำจากกฎที่โรงพยาบาลอนุมัติ' }]))
  return { rules, content }
}

function parseRuleValue(value: unknown, operator: string): RecommendationRule['value'] {
  const text = String(value); if (operator === 'IN') return text.split('|'); if (text.toUpperCase() === 'TRUE') return true; if (text.toUpperCase() === 'FALSE') return false; if (text !== '' && Number.isFinite(Number(text))) return Number(text); return text
}

export function submitAssessment(state: AssessmentState, age: number, result: RiskResult | null, factors: RiskFactor[], recommendations: RecommendationResult | null) {
  return request<AssessmentResponse>('assessment', { method: 'POST', body: JSON.stringify({
    action: 'assessment', form_version: 'cv_form_v1', formula_version: 'thai_cv_risk_rama_v2', risk_classification_version: 'three_level_v1',
    first_name: sanitizeText(state.firstName), last_name: sanitizeText(state.lastName), dob: state.dob, age, gender: state.gender,
    phone: normalizePhone(state.phone), email: sanitizeText(state.email), sbp: Number(state.sbp), diabetes_status: state.diabetes,
    smoking_status: state.smoking, total_cholesterol: state.cholesterol ? Number(state.cholesterol) : null,
    height_cm: state.height ? Number(state.height) : null, waist_cm: state.waist ? Number(state.waist) : null,
    calculation_model: result?.modelType ?? '', client_risk_percent: result?.riskPercent ?? null, risk_factors: factors,
    clinical_recommendation_ids: recommendations?.clinicalRecommendations.map((item) => item.id) ?? [], package_id: state.selectedPackageId,
    eligibility_status: state.existingCvd.length ? 'established_cvd' : 'eligible', existing_cvd: state.existingCvd,
    red_flag: state.redFlags.some((item) => item !== 'none'), consent_health: state.consentHealth, consent_marketing: state.consentMarketing,
    consent_timestamp: state.consentTimestamp, consent_version: 'pdpa_consent_v1', ...state.utm,
    lead_requested: state.leadIntent !== '' && state.leadIntent !== 'none',
  }) })
}

export function submitLead(assessmentId: string, state: AssessmentState, result: RiskResult | null) {
  return request<{ lead_id: string }>('lead', { method: 'POST', body: JSON.stringify({ action: 'lead', assessment_id: assessmentId, first_name: sanitizeText(state.firstName), last_name: sanitizeText(state.lastName), phone: normalizePhone(state.phone), risk_percent: result?.riskPercent ?? null, risk_level: result?.riskLevel ?? '', package_id: state.selectedPackageId, lead_intent: state.leadIntent, consent_marketing: state.consentMarketing }) })
}
