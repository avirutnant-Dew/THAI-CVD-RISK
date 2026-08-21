import type { ReactNode } from 'react'

export function AppShell({ children, step, onHome }: { children: ReactNode; step?: number; onHome: () => void }) {
  const hospitalName = import.meta.env.VITE_HOSPITAL_NAME || 'โรงพยาบาลพริ้นซ์ปากน้ำโพ'
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#eaf5ee_0,transparent_32%),linear-gradient(180deg,#f8fbf9_0%,#ffffff_45%)] text-ink">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
      <button type="button" onClick={onHome} className="flex min-h-11 items-center gap-3 rounded-xl px-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sage-600" aria-label="กลับหน้าหลัก">
        <span className="flex h-12 w-[7.25rem] items-center justify-center overflow-hidden sm:h-14 sm:w-[8.75rem]" aria-hidden="true"><img src="/ppnp-logo.png" alt="" className="h-full w-full object-contain" /></span>
        <span className="hidden sm:block"><span className="block text-sm font-bold text-ink">{hospitalName}</span><span className="block text-[11px] text-slate-500">Thai CV Risk Screening</span></span>
      </button>
      {step && step <= 4 ? <span className="rounded-full border border-sage-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-sage-700">ขั้นตอน {step} จาก 4</span> : null}
    </header>
    {step && step <= 4 ? <div className="mx-auto max-w-3xl px-4 sm:px-6" aria-label={`ความคืบหน้า ${step} จาก 4`}><div className="h-1.5 overflow-hidden rounded-full bg-sage-100"><div className="h-full rounded-full bg-sage-600 transition-all duration-500" style={{ width: `${step * 25}%` }} /></div></div> : null}
    <main>{children}</main>
    <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs leading-5 text-slate-500 sm:px-6">แบบประเมินนี้เป็นเครื่องมือคัดกรองเบื้องต้น ไม่ใช่การวินิจฉัยหรือทดแทนคำแนะนำจากแพทย์</footer>
  </div>
}
