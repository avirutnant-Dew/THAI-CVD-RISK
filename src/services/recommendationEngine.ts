import { clinicalThresholds } from '../config/riskConfig'
import type { RiskLevel, SmokingStatus } from '../types/assessment'
import type { RecommendationContent, RecommendationResult, RecommendationRule } from '../types/recommendation'

export interface RecommendationInput extends Record<string, unknown> {
  riskPercent: number; riskLevel: RiskLevel; age: number; sex: string; sbp: number
  diabetes: boolean; smoking: SmokingStatus; cholesterol?: number; waistHeightRatio?: number
  existingCvd: boolean; redFlags: boolean
}

export const recommendationContent: Record<string, RecommendationContent> = {
  REC_EMERGENCY: { id: 'REC_EMERGENCY', title: 'รับการประเมินทางการแพทย์โดยเร็ว', description: 'ไม่ควรรอผลจากแบบประเมินออนไลน์ หากอาการรุนแรงหรือกำลังเป็นอยู่ให้ติดต่อบริการฉุกเฉิน', category: 'safety', priority: 1, reason: 'มีอาการเตือนที่ระบุในแบบคัดกรอง' },
  REC_CVD: { id: 'REC_CVD', title: 'พบแพทย์เพื่อวางแผนดูแลโดยตรง', description: 'แบบประเมินสำหรับผู้ที่ยังไม่เคยเกิดโรคอาจไม่เหมาะกับประวัติของคุณ', category: 'clinical', priority: 2, reason: 'มีประวัติโรคหัวใจหรือหลอดเลือด' },
  REC_PHYSICIAN: { id: 'REC_PHYSICIAN', title: 'ปรึกษาแพทย์เพื่อประเมินความเสี่ยงโดยรวม', description: 'แพทย์สามารถทบทวนประวัติ ผลตรวจ และปัจจัยอื่นที่แบบประเมินนี้ไม่ครอบคลุม', category: 'clinical', priority: 2, reason: 'ระดับความเสี่ยงถึงเกณฑ์ทบทวนโดยแพทย์' },
  REC_BP: { id: 'REC_BP', title: 'ติดตามความดันโลหิต', description: 'ควรวัดซ้ำด้วยวิธีที่ถูกต้อง และปรึกษาบุคลากรทางการแพทย์หากค่ายังสูง', category: 'clinical', priority: 2, reason: 'ค่าความดันตัวบนสูงกว่าช่วงที่ควรติดตาม' },
  REC_DM: { id: 'REC_DM', title: 'ทบทวนการควบคุมระดับน้ำตาล', description: 'พิจารณาทบทวน HbA1c ระดับน้ำตาล และการทำงานของไตกับทีมรักษา', category: 'investigation', priority: 3, reason: 'ระบุว่าได้รับการวินิจฉัยเบาหวาน' },
  REC_SMOKE: { id: 'REC_SMOKE', title: 'วางแผนหยุดสูบบุหรี่', description: 'ขอคำปรึกษาเพื่อเลือกวิธีเลิกบุหรี่ที่เหมาะสมและปลอดภัยสำหรับคุณ', category: 'lifestyle', priority: 4, reason: 'ระบุว่ายังสูบบุหรี่ในปัจจุบัน' },
  REC_LIFESTYLE: { id: 'REC_LIFESTYLE', title: 'ดูแลสุขภาพหัวใจอย่างสม่ำเสมอ', description: 'เลือกอาหารที่เหมาะสม จำกัดเค็ม เคลื่อนไหวตามความเหมาะสม นอนให้เพียงพอ และติดตามโรคประจำตัว', category: 'lifestyle', priority: 4, reason: 'คำแนะนำพื้นฐานสำหรับสุขภาพหัวใจ' },
}

// Demo recommendation logic — requires hospital medical governance review before clinical deployment.
export const demoRules: RecommendationRule[] = [
  { ruleId: 'R001', field: 'redFlags', operator: '=', value: true, recommendationId: 'REC_EMERGENCY', priority: 1, active: true },
  { ruleId: 'R002', field: 'existingCvd', operator: '=', value: true, recommendationId: 'REC_CVD', packageTag: 'cardiology', priority: 2, active: true },
  { ruleId: 'R003', field: 'riskPercent', operator: '>=', value: clinicalThresholds.physicianReviewRisk, recommendationId: 'REC_PHYSICIAN', packageTag: 'high_cv_risk', priority: 2, active: true },
  { ruleId: 'R004', field: 'sbp', operator: '>=', value: clinicalThresholds.elevatedSbp, recommendationId: 'REC_BP', packageTag: 'hypertension', priority: 2, active: true },
  { ruleId: 'R005', field: 'diabetes', operator: '=', value: true, recommendationId: 'REC_DM', packageTag: 'diabetes', priority: 3, active: true },
  { ruleId: 'R006', field: 'smoking', operator: '=', value: 'current', recommendationId: 'REC_SMOKE', priority: 4, active: true },
]

export function evaluateCondition(actual: unknown, operator: RecommendationRule['operator'], expected: RecommendationRule['value']): boolean {
  if (operator === 'IN') return Array.isArray(expected) && expected.includes(String(actual))
  if (operator === '=') return actual === expected
  if (operator === '!=') return actual !== expected
  const left = Number(actual); const right = Number(expected)
  if (!Number.isFinite(left) || !Number.isFinite(right)) return false
  if (operator === '>') return left > right
  if (operator === '>=') return left >= right
  if (operator === '<') return left < right
  return left <= right
}

export function buildRecommendations(input: RecommendationInput, rules = demoRules, content: Record<string, RecommendationContent> = recommendationContent): RecommendationResult {
  const matched = rules.filter((rule) => rule.active && evaluateCondition(input[rule.field], rule.operator, rule.value))
  const ids = [...new Set(matched.map((rule) => rule.recommendationId))]
  if (!input.redFlags && !input.existingCvd) ids.push('REC_LIFESTYLE')
  const recommendations = [...new Set(ids)].map((id) => content[id]).filter(Boolean).sort((a, b) => a.priority - b.priority)
  return {
    clinicalRecommendations: recommendations.filter((item) => item.category !== 'lifestyle'),
    lifestyleRecommendations: recommendations.filter((item) => item.category === 'lifestyle'),
    suggestedTests: input.diabetes ? ['HbA1c', 'การทำงานของไต'] : [],
    physicianConsultRecommended: input.existingCvd || input.riskPercent >= clinicalThresholds.physicianReviewRisk,
    packageTags: input.redFlags ? [] : [...new Set(matched.map((rule) => rule.packageTag).filter(Boolean) as string[])],
    matchedRuleIds: matched.map((rule) => rule.ruleId),
  }
}
