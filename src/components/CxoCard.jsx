// Carte récap d'un module CxO sur la page Accueil
export default function CxoCard({ roman, code, title, tagline, headline, headlineKind = 'info', onClick }) {
  const kindColor = {
    info:    'text-ink2',
    success: 'text-ink',
    warn:    'text-ocre-d',
    alert:   'text-rust',
  }[headlineKind] ?? 'text-ink2'

  return (
    <button
      onClick={onClick}
      className="text-left p-7 border border-ink/25 bg-paper/50 hover:border-ink hover:bg-ink/5 hover:-translate-y-[2px] transition-all duration-300 group relative overflow-hidden"
    >
      {/* registration */}
      <div className="absolute top-3 left-3 w-1.5 h-1.5 rounded-full bg-ocre" />

      <div className="pl-4">
        <div className="flex items-baseline gap-3 mb-3">
          <span className="font-title text-[24px] text-ocre-d leading-none">{roman}</span>
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey">{code}</span>
        </div>

        <div className="font-title text-[32px] leading-none mb-1 group-hover:text-ocre-d transition-colors">
          {title}
        </div>
        <div className="font-serif italic text-[13px] text-grey mb-5">
          {tagline}
        </div>

        <div className={`font-serif text-[14px] leading-snug ${kindColor} border-t border-ink/15 pt-4`}>
          {headline}
        </div>

        <div className="absolute bottom-3 right-3 font-mono text-[10px] text-grey opacity-0 group-hover:opacity-100 transition-opacity">
          lire le mot →
        </div>
      </div>
    </button>
  )
}
