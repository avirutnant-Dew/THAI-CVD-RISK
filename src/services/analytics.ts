type AllowedEvent = 'cv_landing_view' | 'cv_assessment_start' | 'cv_consent_complete' | 'cv_profile_complete' | 'cv_risk_assessment_complete' | 'cv_result_view' | 'cv_package_view' | 'cv_package_interest' | 'cv_callback_request' | 'cv_assessment_complete'
type SafeParams = Partial<{ risk_level: string; calculation_model: string; campaign: string; package_id: string }>

export function trackEvent(event: AllowedEvent, params: SafeParams = {}) {
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag
  if (typeof gtag === 'function') gtag('event', event, params)
}
