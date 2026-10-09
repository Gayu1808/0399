import { useState } from 'react'
import { AlertOctagon, AlertTriangle, Info, CircleDot, ChevronRight } from 'lucide-react'
import { api } from './api'
import { useApp } from './ctx'

const SEV = { CRITICAL: ['text-red-700 dark:text-red-400 border-red-500', AlertOctagon], HIGH: ['text-orange-700 dark:text-orange-400 border-orange-500', AlertTriangle],
  MEDIUM: ['text-amber-700 dark:text-amber-400 border-amber-500', CircleDot], LOW: ['text-slate-600 border-slate-400', Info] }
export const Sev = ({ s }) => { const [c, I] = SEV[s] || SEV.LOW; return <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-md px-2 py-0.5 ${c}`}><I size={13} aria-hidden />{s}</span> }
export const sevBorder = s => (SEV[s] || SEV.LOW)[0].split(' ').find(x => x.startsWith('border-'))

export const Empty = ({ title, text }) => <div className="card text-center py-10"><div className="text-3xl">✓</div><b>{title}</b><div className="mut">{text}</div></div>
export const Loading = () => <div className="space-y-3" aria-busy="true">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />)}</div>

const STEPS = ['Document', 'AI extraction', 'Entity matching', 'Cross-document comparison', 'Conflict detection', 'Impact analysis', 'Priority score', 'Recommended action']
export function DecisionChain({ f }) {
  const b = f.breakdown || {}
  const note = [f.docs?.[0], 'Fields + page numbers', 'Same entity / same document family', f.docs?.join(' ↔ '), f.kind, `Impact ${b.impact ?? '—'}`, `${f.score}/100`, f.next]
  return <ol className="space-y-1 mt-3" aria-label="AI decision chain">{STEPS.map((s, i) =>
    <li key={s} className="flex gap-3 items-center text-sm"><span className="w-6 h-6 rounded-full bg-indigo-600 text-white grid place-items-center text-xs shrink-0">{i + 1}</span>
      <span className="font-medium">{s}</span><span className="mut truncate">{note[i]}</span></li>)}</ol>
}

export function FindingCard({ f, compact }) {
  const { can, bump, toast, nav } = useApp()
  const [open, setOpen] = useState(false), [busy, setBusy] = useState(false)
  const run = async (path, msg) => { setBusy(true); try { await api(path, { method: 'POST' }); toast(msg); bump() } catch (e) { toast(e.message) } setBusy(false) }
  return <article className={`card border-l-4 ${sevBorder(f.severity)}`} aria-label={`${f.severity} finding: ${f.title}`}>
    <div className="flex items-center gap-2 flex-wrap"><Sev s={f.severity} /><span className="mut capitalize">{f.kind}</span>
      <span className="ml-auto text-xl font-bold">{f.score}<span className="mut">/100</span></span></div>
    <h3 className="text-lg font-semibold mt-2">{f.title}</h3>
    <div className="mut">{f.source?.join(' · ')} · AI confidence {f.confidence}% ({f.confidence >= 90 ? 'high' : 'good'})</div>
    <div className="mt-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 p-3 text-sm"><b>AI detected:</b> {f.what}<br /><b>Recommended:</b> {f.next}</div>
    {open && <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
      {[['WHAT', f.what], ['WHY', f.why], ['SOURCE', f.source?.join('; ')], ['IMPACT', f.impact], ['NEXT', f.next]].map(([k, v]) =>
        <div key={k} className="rounded-lg bg-slate-100 dark:bg-slate-800 p-2"><div className="mut font-semibold">{k}</div>{v}</div>)}
      <div className="sm:col-span-2"><div className="mut font-semibold">AI DECISION CHAIN</div><DecisionChain f={f} /></div></div>}
    {!compact && <div className="flex gap-2 flex-wrap mt-3">
      <button className="btn" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Hide details' : 'Review'}</button>
      {['change', 'conflict'].includes(f.kind) && f.docs?.length === 2 && <button className="btn" onClick={() => nav('compare', { a: f.docs[0], b: f.docs[1] })}>Compare</button>}
      {can('action:create') && <button className="btn btn-p" disabled={busy} onClick={() => run(`/findings/${f.id}/action`, 'Action created')}>Create action</button>}
      {can('finding:resolve') && <button className="btn" disabled={busy} onClick={() => run(`/findings/${f.id}/resolve`, 'Finding resolved')}>{f.kind === 'conflict' ? 'Resolve conflict' : 'Mark resolved'}</button>}
      {can('finding:dismiss') && <button className="btn" disabled={busy} onClick={() => run(`/findings/${f.id}/dismiss`, 'Dismissed')}>Dismiss</button>}
    </div>}
  </article>
}
