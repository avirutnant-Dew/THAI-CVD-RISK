import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'

export function Field({ label, helper, error, children }: { label: string; helper?: string; error?: string; children: ReactNode }) {
  return <label className="block"><span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>{children}{helper && !error ? <span className="mt-1.5 block text-xs leading-5 text-slate-500">{helper}</span> : null}{error ? <span role="alert" className="mt-1.5 block text-xs font-medium text-red-700">{error}</span> : null}</label>
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={`min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sage-600 focus:ring-4 focus:ring-sage-100 ${props.className ?? ''}`} /> }
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) { return <select {...props} className={`min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-sage-600 focus:ring-4 focus:ring-sage-100 ${props.className ?? ''}`} /> }

export function Choice({ selected, title, description, onClick, danger = false }: { selected: boolean; title: string; description?: string; onClick: () => void; danger?: boolean }) {
  return <button type="button" role="radio" aria-checked={selected} onClick={onClick} className={`min-h-12 w-full rounded-2xl border p-4 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600 ${selected ? danger ? 'border-red-400 bg-red-50' : 'border-sage-600 bg-sage-50 shadow-sm' : 'border-slate-200 bg-white hover:border-sage-200'}`}><span className="flex items-start gap-3"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border ${selected ? danger ? 'border-red-600' : 'border-sage-600' : 'border-slate-300'}`}>{selected ? <span className={`size-2.5 rounded-full ${danger ? 'bg-red-600' : 'bg-sage-600'}`} /> : null}</span><span><span className="block text-sm font-semibold text-slate-800">{title}</span>{description ? <span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span> : null}</span></span></button>
}

export function NavButtons({ onBack, onNext, nextLabel = 'ถัดไป', busy = false }: { onBack?: () => void; onNext: () => void; nextLabel?: string; busy?: boolean }) {
  return <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between"><button type="button" onClick={onBack} className={`min-h-12 rounded-xl px-5 text-sm font-semibold text-slate-600 hover:bg-slate-100 ${onBack ? '' : 'invisible'}`}>ย้อนกลับ</button><button type="button" disabled={busy} onClick={onNext} className="min-h-12 rounded-xl bg-ink px-7 text-sm font-semibold text-white shadow-lg shadow-sage-900/10 transition hover:bg-sage-700 disabled:cursor-wait disabled:opacity-60">{busy ? 'กำลังดำเนินการ…' : nextLabel}</button></div>
}
