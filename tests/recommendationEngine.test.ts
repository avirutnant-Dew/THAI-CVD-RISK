import { describe, expect, it } from 'vitest'
import { buildRecommendations, evaluateCondition } from '../src/services/recommendationEngine'

const base = { riskPercent: 8, riskLevel: 'low' as const, age: 45, sex: 'female', sbp: 118, diabetes: false, smoking: 'never' as const, existingCvd: false, redFlags: false }

describe('recommendation engine', () => {
  it('evaluates supported operators without eval', () => {
    expect(evaluateCondition(20, '>=', 20)).toBe(true)
    expect(evaluateCondition('male', 'IN', ['male', 'female'])).toBe(true)
    expect(evaluateCondition(3, '<', 2)).toBe(false)
  })
  it('prioritizes emergency and removes package tags', () => {
    const result = buildRecommendations({ ...base, redFlags: true })
    expect(result.clinicalRecommendations[0].id).toBe('REC_EMERGENCY')
    expect(result.packageTags).toEqual([])
  })
  it('traces diabetes, BP and smoking rules', () => {
    const result = buildRecommendations({ ...base, diabetes: true, sbp: 150, smoking: 'current' })
    expect(result.matchedRuleIds).toEqual(expect.arrayContaining(['R004', 'R005', 'R006']))
    expect(result.packageTags).toEqual(expect.arrayContaining(['diabetes', 'hypertension']))
  })
})
