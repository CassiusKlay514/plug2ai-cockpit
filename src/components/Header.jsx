export default function Header({ currentPage, onNavigate }) {
  const tabs = [
    { code: 'home', roman: '·',   label: 'Accueil' },
    { code: 'crm',  roman: 'I',   label: 'CRM' },
    { code: 'cfo',  roman: 'II',  label: 'CFO' },
    { code: 'cmo',  roman: 'III', label: 'CMO' },
    { code: 'coo',  roman: 'IV',  label: 'COO' },
    { code: 'cto',  roman: 'V',   label: 'CTO' },
    { code: 'agenda', roman: 'VI', label: 'Agenda' },
  ]
  return (
    <header className="border-b border-ink/20 bg-paper/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-[1500px] mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="font-mono font-bold text-[14px] tracking-[0.25em] whitespace-nowrap shrink-0 group"
        >
          <span className="group-hover:text-ocre-d transition-colors">PLUG2AI</span>
          <span className="text-grey font-normal tracking-widest ml-3 text-[10px]">COCKPIT · V.02</span>
        </button>

        <nav className="flex items-center gap-1">
          {tabs.map(t => {
            const active = currentPage === t.code
            return (
              <button
                key={t.code}
                onClick={() => onNavigate(t.code)}
                className={`flex items-baseline gap-2 px-3.5 py-1.5 border font-mono text-[11px] uppercase tracking-[0.18em] transition-all whitespace-nowrap
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

        <div className="font-serif italic text-[12px] text-grey whitespace-nowrap shrink-0">
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  )
}
