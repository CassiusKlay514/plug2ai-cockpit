export default function Header({ currentPage, onNavigate }) {
  const tabs = [
    { code: 'home', roman: '·',  label: 'Accueil' },
    { code: 'crm',  roman: 'I',  label: 'CRM' },
    { code: 'cfo',  roman: 'II', label: 'CFO' },
  ]
  return (
    <header className="border-b border-ink/20 bg-paper/80 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between gap-6">
        <button
          onClick={() => onNavigate('home')}
          className="font-mono font-bold text-[14px] tracking-[0.25em] whitespace-nowrap shrink-0 group"
        >
          <span className="group-hover:text-ocre-d transition-colors">PLUG2AI</span>
          <span className="text-grey font-normal tracking-widest ml-3 text-[10px]">COCKPIT · V.02</span>
        </button>

        <nav className="flex items-center gap-1.5">
          {tabs.map(t => {
            const active = currentPage === t.code
            return (
              <button
                key={t.code}
                onClick={() => onNavigate(t.code)}
                className={`flex items-baseline gap-2 px-4 py-1.5 border font-mono text-[11px] uppercase tracking-[0.2em] transition-all whitespace-nowrap
                  ${active
                    ? 'bg-ink text-paper border-ink shadow-sm'
                    : 'bg-transparent text-ink border-ink/20 hover:border-ink hover:bg-ink/5'}`}
              >
                <span className={active ? 'text-ocre' : 'text-ocre-d'}>{t.roman}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="font-serif italic text-[13px] text-grey whitespace-nowrap shrink-0">
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
