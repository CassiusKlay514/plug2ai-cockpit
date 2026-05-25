// Grande tuile de statistique cliquable - usage Accueil / CRM stats
export default function StatTile({
  roman,
  label,
  value,
  sub,
  accent = false,
  onClick,
  href,
}) {
  const interactive = !!onClick || !!href
  const Tag = interactive ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`group relative p-6 border text-left transition-all duration-300
        ${interactive ? 'hover:border-ink hover:-translate-y-[2px] cursor-pointer' : ''}
        ${accent
          ? 'border-ocre/40 bg-gradient-to-b from-ocre/5 to-transparent'
          : 'border-ink/30 bg-paper/40'
        }`}
    >
      {/* registration dot */}
      <div className={`absolute top-3 left-3 w-1.5 h-1.5 rounded-full ${accent ? 'bg-ocre' : 'bg-ocre'}`} />

      <div className="pl-4">
        {roman && (
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-title text-[18px] text-ocre-d leading-none">{roman}</span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/80">{label}</span>
          </div>
        )}
        {!roman && (
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/80 mb-2">{label}</div>
        )}

        <div className="font-title text-[52px] leading-none text-ink mt-3 mb-3 transition-transform group-hover:translate-x-[2px]">
          {value}
        </div>

        {sub && (
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
            {sub}
          </div>
        )}
      </div>

      {interactive && (
        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-grey opacity-0 group-hover:opacity-100 transition-opacity">
          détail →
        </div>
      )}
    </Tag>
  )
}
