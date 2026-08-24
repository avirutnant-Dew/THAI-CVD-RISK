import { useEffect, useMemo, useState } from 'react'
import { AppShell } from './components/layout/AppShell'
import { mockPackages } from './data/mockPackages'
import { useAssessment } from './hooks/useAssessment'
import { useUtm } from './hooks/useUtm'
import { ConsentPage } from './pages/ConsentPage'
import { EligibilityPage } from './pages/EligibilityPage'
import { LandingPage } from './pages/LandingPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResultPage } from './pages/ResultPage'
import { RiskAssessmentPage } from './pages/RiskAssessmentPage'
import { SuccessPage } from './pages/SuccessPage'
import { trackEvent } from './services/analytics'
import { fetchPackages, fetchRecommendations, submitAssessment, submitLead } from './services/api'
import { matchPackages } from './services/packageMatcher'
import { buildRecommendations } from './services/recommendationEngine'
import { analyzeRiskFactors } from './services/riskFactorEngine'
import { calculateLabRisk, calculateNonLabRisk, classifyRisk } from './services/thaiCvRiskCalculator'
import type { LeadIntent, RiskResult } from './types/assessment'
import type { HealthPackage } from './types/package'
import type { RecommendationContent, RecommendationRule } from './types/recommendation'
import { demoRules, recommendationContent } from './services/recommendationEngine'
import { getCompletedAge } from './utils/age'
import { createLocalReference } from './utils/id'
import { isInRange, isValidEmail, isValidThaiMobile } from './utils/validation'

type Screen = 'landing' | 'consent' | 'profile' | 'eligibility' | 'risk' | 'result' | 'success'

export default function App() {
  const utm = useUtm(); const { assessment, update, toggleList, reset } = useAssessment(utm)
  const [screen, setScreen] = useState<Screen>('landing'); const [errors, setErrors] = useState<Record<string,string>>({}); const [busy, setBusy] = useState(false); const [saveError, setSaveError] = useState(''); const [referenceId, setReferenceId] = useState('')
  const apiEnabled = Boolean(import.meta.env.VITE_API_BASE_URL)
  const [packageMaster, setPackageMaster] = useState<HealthPackage[]>(apiEnabled ? [] : mockPackages)
  const [approvedRules, setApprovedRules] = useState<RecommendationRule[] | null>(apiEnabled ? null : demoRules)
  const [approvedContent, setApprovedContent] = useState<Record<string, RecommendationContent>>(apiEnabled ? {} : recommendationContent)
  const age = getCompletedAge(assessment.dob); const emergency = assessment.redFlags.some((item) => item !== 'none'); const established = assessment.existingCvd.some((item) => item !== 'none')
  useEffect(() => { trackEvent('cv_landing_view') }, [])
  useEffect(() => { if (!apiEnabled) return; Promise.all([fetchPackages(), fetchRecommendations()]).then(([packagesData, recommendationData]) => { setPackageMaster(packagesData); setApprovedRules(recommendationData.rules); setApprovedContent(recommendationData.content) }).catch(() => { setPackageMaster([]); setApprovedRules(null); setApprovedContent({}) }) }, [apiEnabled])

  const result = useMemo<RiskResult | null>(() => {
    if (screen !== 'result' || emergency || established || assessment.diabetes === 'unknown' || !Number.isFinite(age)) return null
    try {
      const base = { age, gender: assessment.gender as 'male'|'female', sbp: Number(assessment.sbp), diabetes: assessment.diabetes === 'yes', smoking: assessment.smoking === 'current' }
      const calc = assessment.hasCholesterol === 'yes' ? calculateLabRisk({ ...base, cholesterol: Number(assessment.cholesterol) }) : calculateNonLabRisk({ ...base, height: Number(assessment.height), waist: Number(assessment.waist) })
      return { ...calc, riskLevel: classifyRisk(calc.riskPercent) }
    } catch { return null }
  }, [screen, emergency, established, assessment, age])

  const factors = useMemo(() => result ? analyzeRiskFactors({ age, sex: assessment.gender as 'male'|'female', sbp: Number(assessment.sbp), diabetes: assessment.diabetes === 'yes', smoking: assessment.smoking, cholesterol: assessment.cholesterol ? Number(assessment.cholesterol) : undefined, height: assessment.height ? Number(assessment.height) : undefined, waist: assessment.waist ? Number(assessment.waist) : undefined, riskPercent: result.riskPercent }) : [], [result, assessment, age])
  const recommendations = useMemo(() => approvedRules ? buildRecommendations({ riskPercent: result?.riskPercent ?? 0, riskLevel: result?.riskLevel ?? 'low', age: Number.isFinite(age) ? age : 0, sex: assessment.gender, sbp: Number(assessment.sbp) || 0, diabetes: assessment.diabetes === 'yes', smoking: assessment.smoking, cholesterol: Number(assessment.cholesterol) || undefined, waistHeightRatio: Number(assessment.waist) / Number(assessment.height) || undefined, existingCvd: established, redFlags: emergency }, approvedRules, approvedContent) : { clinicalRecommendations: [], lifestyleRecommendations: [], suggestedTests: [], physicianConsultRecommended: false, packageTags: [], matchedRuleIds: [] }, [result, age, assessment, established, emergency, approvedRules, approvedContent])
  // Show every active, age-eligible hospital programme. Clinical rules still
  // drive recommendations, but package browsing is not restricted by risk tier.
  const packages = useMemo(() => emergency ? [] : packageMaster
    .filter((item) => item.active && age >= item.minAge && age <= item.maxAge)
    .sort((a, b) => a.priority - b.priority)
    .map((item) => ({ ...item, matchScore: 0, matchReasons: [], matchedTests: [] })), [emergency, age, packageMaster])

  const go = (next: Screen) => { setErrors({}); setScreen(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const home = () => { reset(); setReferenceId(''); setSaveError(''); go('landing') }
  const validateProfile = () => { const e: Record<string,string> = {}; if (!assessment.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ'; if (!assessment.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'; if (!assessment.gender) e.gender = 'กรุณาเลือก'; if (!Number.isFinite(age) || age < 35 || age > 70) e.dob = 'แบบประเมินนี้รองรับอายุ 35–70 ปี'; if (!isValidThaiMobile(assessment.phone)) e.phone = 'กรุณากรอกเบอร์ 10 หลัก เริ่มด้วย 0'; if (!isValidEmail(assessment.email)) e.email = 'รูปแบบอีเมลไม่ถูกต้อง'; setErrors(e); if (Object.keys(e).length) return; trackEvent('cv_profile_complete', { campaign: assessment.utm.utm_campaign }); go('eligibility') }
  const validateEligibility = () => { const e: Record<string,string> = {}; if (!assessment.existingCvd.length) e.existingCvd = 'กรุณาเลือกอย่างน้อยหนึ่งข้อ'; if (!assessment.redFlags.length) e.redFlags = 'กรุณาเลือกอย่างน้อยหนึ่งข้อ'; setErrors(e); if (Object.keys(e).length) return; if (emergency || established) go('result'); else go('risk') }
  const validateRisk = () => { const e: Record<string,string> = {}; if (!isInRange(assessment.sbp,70,250)) e.sbp = 'กรุณากรอกค่า 70–250 mmHg'; if (!assessment.diabetes) e.diabetes = 'กรุณาเลือก'; if (assessment.diabetes === 'unknown') e.diabetes = 'จำเป็นต้องทราบสถานะเบาหวาน กรุณาตรวจระดับน้ำตาลก่อนประเมิน'; if (!assessment.smoking) e.smoking = 'กรุณาเลือก'; if (!assessment.hasCholesterol) e.hasCholesterol = 'กรุณาเลือก'; if (assessment.hasCholesterol === 'yes' && !isInRange(assessment.cholesterol,80,500)) e.cholesterol = 'กรุณากรอกค่า 80–500 mg/dL'; if (assessment.hasCholesterol === 'no') { if (!isInRange(assessment.height,100,230)) e.height = 'กรุณากรอก 100–230 cm'; if (!isInRange(assessment.waist,40,200)) e.waist = 'กรุณากรอก 40–200 cm' } setErrors(e); if (Object.keys(e).length) return; trackEvent('cv_risk_assessment_complete', { calculation_model: assessment.hasCholesterol === 'yes' ? 'lab' : 'non_lab' }); go('result') }
  const finish = async () => { if (!assessment.leadIntent) return; setBusy(true); setSaveError(''); let id = createLocalReference(); try { const saved = await submitAssessment(assessment, age, result, factors, recommendations); id = saved.assessment_id; if (assessment.leadIntent !== 'none') await submitLead(id, assessment, result); setReferenceId(id); trackEvent('cv_assessment_complete', { risk_level: result?.riskLevel, calculation_model: result?.modelType, package_id: assessment.selectedPackageId }); go('success') } catch { if (!import.meta.env.VITE_API_BASE_URL) { setReferenceId(id); go('success') } else setSaveError('ไม่สามารถบันทึกข้อมูลได้ในขณะนี้ กรุณาลองอีกครั้ง ผลประเมินของคุณยังอยู่ในหน้านี้') } finally { setBusy(false) } }
  const step = screen === 'consent' ? 1 : screen === 'profile' ? 1 : screen === 'eligibility' ? 2 : screen === 'risk' ? 3 : screen === 'result' ? 4 : undefined
  return <AppShell step={step} onHome={home}>{screen === 'landing' && <LandingPage onStart={() => go('consent')} />}{screen === 'consent' && <ConsentPage data={assessment} update={update} onBack={() => go('landing')} error={errors.consent} onNext={() => { if (!assessment.consentHealth) { setErrors({consent:'ต้องให้ความยินยอมเพื่อใช้ข้อมูลในการประเมินก่อนดำเนินการต่อ'}); return } update('consentTimestamp', new Date().toISOString()); trackEvent('cv_consent_complete'); go('profile') }} />}{screen === 'profile' && <ProfilePage data={assessment} update={update} errors={errors} onBack={() => go('consent')} onNext={validateProfile} />}{screen === 'eligibility' && <EligibilityPage data={assessment} toggleList={toggleList} errors={errors} onBack={() => go('profile')} onNext={validateEligibility} />}{screen === 'risk' && <RiskAssessmentPage data={assessment} update={update} errors={errors} onBack={() => go('eligibility')} onNext={validateRisk} />}{screen === 'result' && <ResultPage data={assessment} result={result} age={age} factors={factors} recommendations={recommendations} packages={packages} saveError={saveError} onBack={() => go(emergency || established ? 'eligibility' : 'risk')} onPackage={(id) => { update('selectedPackageId', id); update('leadIntent','package_interest'); trackEvent('cv_package_interest',{package_id:id}) }} onIntent={(intent: LeadIntent) => update('leadIntent', intent)} onMarketingConsent={(value) => update('consentMarketing', value)} onSubmit={finish} busy={busy} />}{screen === 'success' && <SuccessPage referenceId={referenceId} requested={assessment.leadIntent !== 'none'} onHome={home} />}</AppShell>
}
