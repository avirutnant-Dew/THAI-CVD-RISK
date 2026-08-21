export type RecommendationCategory = 'safety' | 'clinical' | 'investigation' | 'lifestyle'

export interface RiskFactor {
  id: string
  severity: 'important' | 'attention' | 'protective'
  label: string
  detail: string
}

export interface RecommendationContent {
  id: string
  title: string
  description: string
  category: RecommendationCategory
  priority: number
  reason: string
}

export interface RecommendationRule {
  ruleId: string
  field: string
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN'
  value: string | number | boolean | string[]
  recommendationId: string
  packageTag?: string
  priority: number
  active: boolean
}

export interface RecommendationResult {
  clinicalRecommendations: RecommendationContent[]
  lifestyleRecommendations: RecommendationContent[]
  suggestedTests: string[]
  physicianConsultRecommended: boolean
  packageTags: string[]
  matchedRuleIds: string[]
}
