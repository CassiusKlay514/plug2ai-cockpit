import { statutMeta } from '../lib/statuts.js'

export default function StatutBadge({ code, size = 'sm' }) {
  const m = statutMeta(code)
  const sz = size === 'sm'
    ? 'text-[10px] px-2 py-[2px]'
    : 'text-xs px-2.5 py-1'
  return (
    <span className={`inline-block font-mono uppercase tracking-wider rounded-sm ${m.color} ${sz}`}>
      {m.label}
    </span>
  )
}
