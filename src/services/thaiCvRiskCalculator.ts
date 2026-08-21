import { riskLevels } from '../config/riskConfig'
import { validationRanges } from '../config/validationConfig'
import type { CalculationModel, Gender, RiskLevel } from '../types/assessment'

interface BaseRiskInputs { age: number; gender: Gender; sbp: number; diabetes: boolean; smoking: boolean }
export interface LabRiskInputs extends BaseRiskInputs { cholesterol: number }
export interface NonLabRiskInputs extends BaseRiskInputs { waist: number; height: number }
export interface CalculationOutput { riskPercent: number; fullScore: number; modelType: CalculationModel }

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const inRange = (value: number, range: { min: number; max: number }) => value >= range.min && value <= range.max

export function validateRiskInputs(input: Partial<LabRiskInputs & NonLabRiskInputs>, modelType: CalculationModel): string[] {
  const errors: string[] = []
  if (!isFiniteNumber(input.age) || !inRange(input.age, validationRanges.age)) errors.push('age')
  if (input.gender !== 'male' && input.gender !== 'female') errors.push('gender')
  if (!isFiniteNumber(input.sbp) || !inRange(input.sbp, validationRanges.sbp)) errors.push('sbp')
  if (typeof input.diabetes !== 'boolean') errors.push('diabetes')
  if (typeof input.smoking !== 'boolean') errors.push('smoking')
  if (modelType === 'lab' && (!isFiniteNumber(input.cholesterol) || !inRange(input.cholesterol, validationRanges.cholesterol))) errors.push('cholesterol')
  if (modelType === 'non_lab') {
    if (!isFiniteNumber(input.height) || !inRange(input.height, validationRanges.height)) errors.push('height')
    if (!isFiniteNumber(input.waist) || !inRange(input.waist, validationRanges.waist)) errors.push('waist')
  }
  return errors
}

function assertValid(input: Partial<LabRiskInputs & NonLabRiskInputs>, modelType: CalculationModel) {
  const errors = validateRiskInputs(input, modelType)
  if (errors.length) throw new Error(`Invalid risk inputs: ${errors.join(', ')}`)
}

export function calculateLabRisk(input: LabRiskInputs): CalculationOutput {
  assertValid(input, 'lab')
  const sex = input.gender === 'male' ? 1 : 0
  const fullScore = (0.08183 * input.age) + (0.39499 * sex) + (0.02084 * input.sbp) +
    (0.69974 * Number(input.diabetes)) + (0.00212 * input.cholesterol) + (0.41916 * Number(input.smoking))
  const riskPercent = (1 - Math.pow(0.978296, Math.exp(fullScore - 7.04423))) * 100
  return { riskPercent, fullScore, modelType: 'lab' }
}

export function calculateNonLabRisk(input: NonLabRiskInputs): CalculationOutput {
  assertValid(input, 'non_lab')
  const sex = input.gender === 'male' ? 1 : 0
  const fullScore = (0.079 * input.age) + (0.128 * sex) + (0.019350987 * input.sbp) +
    (0.58454 * Number(input.diabetes)) + (3.512566 * (input.waist / input.height)) + (0.459 * Number(input.smoking))
  const riskPercent = (1 - Math.pow(0.978296, Math.exp(fullScore - 7.720484))) * 100
  return { riskPercent, fullScore, modelType: 'non_lab' }
}

export function classifyRisk(riskPercent: number): RiskLevel {
  if (!Number.isFinite(riskPercent) || riskPercent < 0) throw new Error('Invalid risk percentage')
  return (riskLevels.find((band) => riskPercent >= band.min && riskPercent < band.max)?.level ?? 'high')
}
