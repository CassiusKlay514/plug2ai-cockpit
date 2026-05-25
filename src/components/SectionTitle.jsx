export default function SectionTitle({ num, label, hint, action }) {
  return (
    <div className="flex items-baseline justify-between mb-5 pb-2 border-b border-ink/20">
      <div className="flex items-baseline gap-3">
        {num && (
          <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-ocre-d">§ {num}</span>
        )}
        <h2 className="font-mono text-[12px] uppercase tracking-[0.3em] text-ink">{label}</h2>
        {hint && <span className="font-serif italic text-[12px] text-grey">— {hint}</span>}
      </div>
      {action}
    </div>
  )
}
