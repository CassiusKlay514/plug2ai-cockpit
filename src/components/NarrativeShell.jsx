// Shell partagé pour tous les "Mot du CxO" — uniforme dans le style, modulaire dans le contenu
export default function NarrativeShell({ role, title, subtitle, children }) {
  return (
    <article className="border border-ink/30 bg-paper p-10 relative">
      <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-ocre" />

      <div className="max-w-[760px] mx-auto">
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-grey mb-2">
            Note {role} — automatique
          </div>
          <h2 className="font-title text-[40px] leading-none text-ink">{title}</h2>
          {subtitle && (
            <div className="font-serif italic text-[14px] text-ink2 mt-2">{subtitle}</div>
          )}
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12 bg-ocre" />
            <div className="w-1.5 h-1.5 rounded-full bg-ocre" />
            <div className="h-px w-12 bg-ocre" />
          </div>
        </div>

        <div className="font-serif text-[16px] leading-[1.75] text-ink space-y-5">
          {children}
        </div>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-ink/20">
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
            Synthèse générée automatiquement
          </div>
          <div className="font-serif italic text-[14px] text-ink">
            Plug2AI · le cabinet
          </div>
        </div>
      </div>
    </article>
  )
}

export function P({ tag, children, alert = false }) {
  return (
    <p>
      {tag && (
        <span className={`font-mono uppercase text-[11px] tracking-widest mr-2 ${alert ? 'text-rust' : 'text-ocre-d'}`}>
          {tag} ·
        </span>
      )}
      {children}
    </p>
  )
}

export function S({ children }) {
  return <strong className="font-mono not-italic text-ink">{children}</strong>
}
