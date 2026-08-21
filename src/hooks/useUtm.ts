import { useMemo } from 'react'
import type { UtmData } from '../types/assessment'

const empty: UtmData = { utm_source: '', utm_medium: '', utm_campaign: '', utm_content: '', utm_term: '' }

export function useUtm(): UtmData {
  return useMemo(() => {
    try {
      const saved = sessionStorage.getItem('cv_utm')
      if (saved) return { ...empty, ...JSON.parse(saved) }
      const params = new URLSearchParams(window.location.search)
      const captured = Object.fromEntries(Object.keys(empty).map((key) => [key, params.get(key) ?? ''])) as unknown as UtmData
      sessionStorage.setItem('cv_utm', JSON.stringify(captured))
      return captured
    } catch { return empty }
  }, [])
}
