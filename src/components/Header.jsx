export default function Header({ currentPage, onNavigate }) {
  const tabs = [
    { code: 'crm', roman: 'I',  label: 'CRM' },
    { code: 'cfo', roman: 'II', label: 'CFO' },
  ]
  return (
    <header className="border-b border-ink/30">
      <div className="max-w-[1400px] mx-auto px-8 py-4 flex items-center justify-between gap-6">
        <button
          onClick={() => onNavigate('crm')}
          className="font-mono font-bold text-[14px] tracking-[0.25em] whitespace-nowrap shrink-0"
        >
          PLUG2AI
          <span className="text-grey font-normal tracking-widest ml-3 text-[10px]">COCKPIT · V.01</span>
        </button>

        <nav className="flex items-center gap-2">
          {tabs.map(t => {
            const active = currentPage === t.code
            return (
              <button
                key={t.code}
                onClick={() => onNavigate(t.code)}
                className={`flex items-baseline gap-2 px-4 py-1.5 border font-mono text-[11px] uppercase tracking-[0.2em] transition whitespace-nowrap
                  ${active ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-ink/30 hover:border-ink'}`}
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
