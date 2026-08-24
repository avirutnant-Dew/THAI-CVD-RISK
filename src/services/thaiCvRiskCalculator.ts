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
  const fullScore = (0.0818347640193792 * input.age) + (0.394986128542107 * sex) + (0.0208425438624519 * input.sbp) +
    (0.699741921871077 * Number(input.diabetes)) + (0.00212384055469836 * input.cholesterol) + (0.419162811751856 * Number(input.smoking))
  const riskPercent = (1 - Math.pow(0.964588, Math.exp(fullScore - 7.044233))) * 100
  return { riskPercent, fullScore, modelType: 'lab' }
}

export function calculateNonLabRisk(input: NonLabRiskInputs): CalculationOutput {
  assertValid(input, 'non_lab')
  const sex = input.gender === 'male' ? 1 : 0
  const fullScore = (0.0794420169146399 * input.age) + (0.127658073818733 * sex) + (0.0193509871323239 * input.sbp) +
    (0.584543504554125 * Number(input.diabetes)) + (0.0351256637183026 * (input.waist / input.height) * 100) + (0.459312425773018 * Number(input.smoking))
  const riskPercent = (1 - Math.pow(0.964588, Math.exp(fullScore - 7.712325))) * 100
  return { riskPercent, fullScore, modelType: 'non_lab' }
}

export function classifyRisk(riskPercent: number): RiskLevel {
  if (!Number.isFinite(riskPercent) || riskPercent < 0) throw new Error('Invalid risk percentage')
  return (riskLevels.find((band) => riskPercent >= band.min && riskPercent < band.max)?.level ?? 'high')
}
