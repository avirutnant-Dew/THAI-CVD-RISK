import { useState } from 'react'
import type { AssessmentState } from '../types/assessment'
import type { UtmData } from '../types/assessment'

export const initialAssessment = (utm: UtmData): AssessmentState => ({
  consentHealth: false, consentMarketing: false, consentTimestamp: '', firstName: '', lastName: '', gender: '', dob: '', phone: '', email: '', existingCvd: [], redFlags: [], sbp: '', diabetes: '', smoking: '', hasCholesterol: '', cholesterol: '', height: '', waist: '', leadIntent: '', selectedPackageId: '', utm,
})

export function useAssessment(utm: UtmData) {
  const [assessment, setAssessment] = useState<AssessmentState>(() => initialAssessment(utm))
  const update = <K extends keyof AssessmentState>(key: K, value: AssessmentState[K]) => setAssessment((current) => ({ ...current, [key]: value }))
  const toggleList = (key: 'existingCvd' | 'redFlags', value: string, noneValue: string) => setAssessment((current) => {
    const currentList = current[key]
    const next = value === noneValue ? [noneValue] : currentList.includes(value) ? currentList.filter((item) => item !== value) : [...currentList.filter((item) => item !== noneValue), value]
    return { ...current, [key]: next }
  })
  return { assessment, update, toggleList, reset: () => setAssessment(initialAssessment(utm)) }
}
