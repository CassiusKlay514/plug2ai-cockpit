export default function Header({ currentPage, onNavigate }) {
  const tabs = [
    { code: 'home',    roman: '·',    label: 'Accueil' },
    { code: 'crm',     roman: 'I',    label: 'CRM' },
    { code: 'cfo',     roman: 'II',   label: 'CFO' },
    { code: 'cmo',     roman: 'III',  label: 'CMO' },
    { code: 'coo',     roman: 'IV',   label: 'COO' },
    { code: 'cto',     roman: 'V',    label: 'CTO' },
    { code: 'agenda',  roman: 'VI',   label: 'Agenda' },
    { code: 'ceo',     roman: 'VII',  label: 'CEO' },
    { code: 'veille',  roman: 'VIII', label: 'Veille' },
    { code: 'kb',      roman: 'IX',   label: 'KB' },
  ]
  return (
    <header className="border-b border-ink/20 bg-paper/85 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-[1500px] mx-auto px-5 py-3 flex items-center justify-between gap-3">
        <button
          onClick={() => onNavigate('home')}
          className="font-mono font-bold text-[13px] tracking-[0.22em] whitespace-nowrap shrink-0 group"
        >
          <span className="group-hover:text-ocre-d transition-colors">PLUG2AI</span>
          <span className="text-grey font-normal tracking-widest ml-2 text-[9px]">V.05</span>
        </button>

        <nav className="flex items-center gap-1 overflow-x-auto">
          {tabs.map(t => {
            const active = currentPage === t.code
            return (
              <button
                key={t.code}
                onClick={() => onNavigate(t.code)}
                title={t.label}
                className={`flex items-baseline gap-1.5 px-2.5 py-1.5 border font-mono text-[10.5px] uppercase tracking-[0.15em] transition-all whitespace-nowrap
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

        <div className="font-serif italic text-[11px] text-grey whitespace-nowrap shrink-0">
          {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </header>
  )
}
