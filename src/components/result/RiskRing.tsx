import type { RiskLevel } from '../../types/assessment'

const tones: Record<RiskLevel, { stroke: string; text: string; bg: string }> = {
  low: { stroke: '#438065', text: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
  intermediate: { stroke: '#d19535', text: 'text-amber-800', bg: 'bg-amber-50 border-amber-200' },
  high: { stroke: '#d0604c', text: 'text-orange-900', bg: 'bg-orange-50 border-orange-200' },
}

export function RiskRing({ risk, level }: { risk: number; level: RiskLevel }) {
  const tone = tones[level]; const radius = 70; const circumference = 2 * Math.PI * radius; const progress = Math.min(risk / 40, 1)
  return <div className="relative grid size-44 place-items-center" role="img" aria-label={`ความเสี่ยง ${risk.toFixed(1)} เปอร์เซ็นต์`}><svg viewBox="0 0 176 176" className="absolute inset-0 -rotate-90" aria-hidden="true"><circle cx="88" cy="88" r={radius} fill="none" stroke="#e7eee9" strokeWidth="12" /><circle cx="88" cy="88" r={radius} fill="none" stroke={tone.stroke} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1-progress)} /></svg><div className="text-center"><span className={`block text-4xl font-bold ${tone.text}`}>{risk.toFixed(1)}%</span><span className="mt-1 block text-xs text-slate-500">ใน 10 ปี</span></div></div>
}
