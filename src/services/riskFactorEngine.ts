import { clinicalThresholds } from '../config/riskConfig'
import type { Gender, SmokingStatus } from '../types/assessment'
import type { RiskFactor } from '../types/recommendation'

export interface RiskFactorInput {
  age: number; sex: Gender; sbp: number; diabetes: boolean; smoking: SmokingStatus
  cholesterol?: number; waist?: number; height?: number; riskPercent: number
}

export function analyzeRiskFactors(input: RiskFactorInput): RiskFactor[] {
  const factors: RiskFactor[] = []
  if (input.diabetes) factors.push({ id: 'diabetes', severity: 'important', label: 'ประวัติเบาหวาน', detail: 'คุณระบุว่าเคยได้รับการวินิจฉัยว่าเป็นเบาหวาน' })
  if (input.sbp >= clinicalThresholds.elevatedSbp) factors.push({ id: 'elevated_sbp', severity: input.sbp >= 180 ? 'important' : 'attention', label: 'ค่าความดันที่ควรติดตาม', detail: `ค่าความดันตัวบนที่กรอกคือ ${input.sbp} mmHg` })
  if (input.smoking === 'current') factors.push({ id: 'current_smoking', severity: 'important', label: 'การสูบบุหรี่ในปัจจุบัน', detail: 'การหลีกเลี่ยงบุหรี่ช่วยลดความเสี่ยงโรคหัวใจและหลอดเลือด' })
  if (input.cholesterol && input.cholesterol >= clinicalThresholds.elevatedCholesterol) factors.push({ id: 'elevated_cholesterol', severity: 'attention', label: 'คอเลสเตอรอลที่ควรทบทวน', detail: `ค่าคอเลสเตอรอลรวมที่กรอกคือ ${input.cholesterol} mg/dL` })
  if (input.waist && input.height && input.waist / input.height >= clinicalThresholds.elevatedWaistHeightRatio) factors.push({ id: 'waist_height_ratio', severity: 'attention', label: 'สัดส่วนรอบเอวต่อส่วนสูง', detail: 'สัดส่วนจากข้อมูลที่กรอกอยู่ในช่วงที่ควรให้ความสำคัญกับสุขภาพเมตาบอลิก' })
  if (!factors.length) factors.push({ id: 'maintain_health', severity: 'protective', label: 'ดูแลปัจจัยสุขภาพต่อเนื่อง', detail: 'ไม่พบปัจจัยเด่นจากข้อมูลที่ใช้คำนวณครั้งนี้' })
  return factors
}
