import type { RiskLevel } from '../types/assessment'

export const FORM_VERSION = 'cv_form_v1'
export const FORMULA_VERSION = 'thai_cv_risk_v1'
export const CONSENT_VERSION = 'pdpa_consent_v1'
export const RISK_CLASSIFICATION_VERSION = 'three_level_v1'

export interface RiskBand { level: RiskLevel; min: number; max: number; label: string }

export const riskLevels: RiskBand[] = [
  { level: 'low', min: 0, max: 10, label: 'ความเสี่ยงต่ำ' },
  { level: 'intermediate', min: 10, max: 20, label: 'ความเสี่ยงปานกลาง' },
  { level: 'high', min: 20, max: Number.POSITIVE_INFINITY, label: 'ความเสี่ยงสูง' },
]

export const clinicalThresholds = {
  elevatedSbp: 130,
  veryHighSbp: 180,
  elevatedCholesterol: 200,
  elevatedWaistHeightRatio: 0.5,
  physicianReviewRisk: 10,
}
