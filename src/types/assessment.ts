export type Gender = 'male' | 'female'
export type DiabetesStatus = 'yes' | 'no' | 'unknown' | ''
export type SmokingStatus = 'current' | 'former' | 'never' | ''
export type LabAvailability = 'yes' | 'no' | ''
export type RiskLevel = 'low' | 'intermediate' | 'high'
export type CalculationModel = 'lab' | 'non_lab'

export interface UtmData {
  utm_source: string
  utm_medium: string
  utm_campaign: string
  utm_content: string
  utm_term: string
}

export interface AssessmentState {
  consentHealth: boolean
  consentMarketing: boolean
  consentTimestamp: string
  firstName: string
  lastName: string
  gender: Gender | ''
  dob: string
  phone: string
  email: string
  existingCvd: string[]
  redFlags: string[]
  sbp: string
  diabetes: DiabetesStatus
  smoking: SmokingStatus
  hasCholesterol: LabAvailability
  cholesterol: string
  height: string
  waist: string
  leadIntent: LeadIntent
  selectedPackageId: string
  utm: UtmData
}

export type LeadIntent = 'callback' | 'package_interest' | 'doctor_appointment' | 'none' | ''

export interface RiskResult {
  riskPercent: number
  fullScore: number
  modelType: CalculationModel
  riskLevel: RiskLevel
}
