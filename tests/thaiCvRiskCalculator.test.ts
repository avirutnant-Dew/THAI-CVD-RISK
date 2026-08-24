import { describe, expect, it } from 'vitest'
import { calculateLabRisk, calculateNonLabRisk, classifyRisk, validateRiskInputs } from '../src/services/thaiCvRiskCalculator'

describe('Thai CV Risk calculator', () => {
  it('matches laboratory reference vector', () => {
    const result = calculateLabRisk({ age: 52, gender: 'male', sbp: 148, diabetes: true, cholesterol: 225, smoking: false })
    expect(result.fullScore).toBeCloseTo(8.9126964, 5)
    expect(result.riskPercent).toBeCloseTo(20.83, 2)
  })

  it('matches non-laboratory reference vector', () => {
    const result = calculateNonLabRisk({ age: 52, gender: 'male', sbp: 148, diabetes: true, waist: 95, height: 170, smoking: false })
    expect(result.fullScore).toBeCloseTo(9.6700373, 5)
    expect(result.riskPercent).toBeCloseTo(22.54, 2)
  })

  it('responds directionally to sex, smoking and diabetes', () => {
    const base = { age: 52, gender: 'female' as const, sbp: 120, diabetes: false, cholesterol: 180, smoking: false }
    const low = calculateLabRisk(base).riskPercent
    expect(calculateLabRisk({ ...base, gender: 'male' }).riskPercent).toBeGreaterThan(low)
    expect(calculateLabRisk({ ...base, smoking: true }).riskPercent).toBeGreaterThan(low)
    expect(calculateLabRisk({ ...base, diabetes: true }).riskPercent).toBeGreaterThan(low)
  })

  it('accepts exact hard-range boundaries', () => {
    expect(validateRiskInputs({ age: 35, gender: 'female', sbp: 70, diabetes: false, smoking: false, cholesterol: 80 }, 'lab')).toEqual([])
    expect(validateRiskInputs({ age: 70, gender: 'male', sbp: 250, diabetes: true, smoking: true, height: 230, waist: 200 }, 'non_lab')).toEqual([])
  })

  it('rejects invalid and missing values', () => {
    expect(validateRiskInputs({ age: 20, gender: 'male', sbp: 251 }, 'lab')).toEqual(expect.arrayContaining(['age', 'sbp', 'diabetes', 'smoking', 'cholesterol']))
    expect(() => calculateNonLabRisk({ age: 52, gender: 'male', sbp: 120, diabetes: false, smoking: false, height: 0, waist: 80 })).toThrow()
  })

  it('classifies boundaries from centralized config', () => {
    expect(classifyRisk(9.999)).toBe('low')
    expect(classifyRisk(10)).toBe('intermediate')
    expect(classifyRisk(20)).toBe('high')
  })
})
