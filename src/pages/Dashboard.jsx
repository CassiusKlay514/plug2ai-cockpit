import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { STATUTS, statutMeta } from '../lib/statuts.js'
import StatutBadge from '../components/StatutBadge.jsx'
import KpiCard from '../components/KpiCard.jsx'

export default function Dashboard() {
  const [contacts, setContacts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [filterStatut, setFilter] = useState('TOUS')
  const [query, setQuery]         = useState('')

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('score', { ascending: false })
        .limit(500)
      if (!mounted) return
      if (error) setError(error.message)
      else setContacts(data ?? [])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  const kpis = useMemo(() => {
    const clients     = contacts.filter(c => c.statut === 'CLIENT_SIGNE').length
    const chauds      = contacts.filter(c => c.statut === 'PROSPECT_CHAUD').length
    const publics     = contacts.filter(c => c.statut === 'PROSPECT_PUBLIC').length
    const wealth      = contacts.filter(c => c.statut === 'PROSPECT_WEALTH' || c.statut === 'PROSPECT_CGP').length
    return { clients, chauds, publics, wealth, total: contacts.length }
  }, [contacts])

  const filtered = useMemo(() => {
    let rows = contacts
    if (filterStatut !== 'TOUS') rows = rows.filter(c => c.statut === filterStatut)
    if (query.trim()) {
      const q = query.toLowerCase()
      rows = rows.filter(c =>
        (c.prenom  ?? '').toLowerCase().includes(q) ||
        (c.nom     ?? '').toLowerCase().includes(q) ||
        (c.societe ?? '').toLowerCase().includes(q) ||
        (c.email   ?? '').toLowerCase().includes(q)
      )
    }
    return rows
  }, [contacts, filterStatut, query])

  const top10 = useMemo(
    () => [...contacts].sort((a, b) => b.score - a.score).slice(0, 10),
    [contacts]
  )

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-10 relative z-10">

      {/* PAGE TITLE */}
      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="font-title text-[68px] leading-none tracking-tight">
            RELATION CLIENTS
          </h1>
          <p className="font-serif italic text-[15px] text-ink2 mt-3">
            module I · CRM · {kpis.total} contacts au pipeline
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CRM
        </div>
      </div>

        {/* KPI ROW */}
        <section className="grid grid-cols-4 gap-5 mb-12">
          <KpiCard roman="I"   label="Clients signés"  value={kpis.clients}  sub="à fidéliser / Phase suivante" />
          <KpiCard roman="II"  label="Prospects chauds" value={kpis.chauds}  sub="devis / RDV en cours" />
          <KpiCard roman="III" label="AO publics"       value={kpis.publics} sub="réponses en cours" />
          <KpiCard roman="IV"  label="Wealth / CGP"     value={kpis.wealth}  sub="campagnes en cours" />
        </section>

        {/* TOP 10 leads */}
        <section className="mb-12">
          <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 01 · Top 10 — leads les plus chauds</h2>
            <span className="font-serif italic text-[12px] text-grey">tri par score décroissant</span>
          </div>
          <div className="grid grid-cols-2 gap-x-10 gap-y-2">
            {top10.map((c, i) => (
              <button
                key={c.id}
                className="flex items-center justify-between py-2 px-1 border-b border-ink/10 hover:bg-ink/5 text-left"
                onClick={() => window.alert(JSON.stringify(c, null, 2))}
              >
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                  <span className="truncate">
                    <span className="font-medium">{[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}</span>
                    <span className="text-grey"> · {c.societe || '—'}</span>
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatutBadge code={c.statut} />
                  <span className="font-mono text-[12px] w-8 text-right">{c.score}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* FILTERS + LIST */}
        <section>
          <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 02 · Pipeline complet</h2>
            <span className="font-serif italic text-[12px] text-grey">{filtered.length} contacts affichés</span>
          </div>

          <div className="flex gap-2 mb-4 flex-wrap">
            <FilterChip code="TOUS" active={filterStatut === 'TOUS'} onClick={() => setFilter('TOUS')} count={contacts.length} />
            {STATUTS.map(s => {
              const n = contacts.filter(c => c.statut === s.code).length
              if (n === 0) return null
              return (
                <FilterChip key={s.code} code={s.code} label={s.label}
                  active={filterStatut === s.code} onClick={() => setFilter(s.code)} count={n} />
              )
            })}
          </div>

          <input
            type="text"
            placeholder="Rechercher par nom, société, email…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full bg-transparent border-b border-ink/40 py-2 mb-4 outline-none placeholder:text-grey font-mono text-sm focus:border-ink"
          />

          {loading && <div className="font-mono text-sm text-grey">Chargement…</div>}
          {error && <div className="font-mono text-sm text-rust">Erreur : {error}</div>}

          {!loading && !error && (
            <div className="border border-ink/20">
              <div className="grid grid-cols-12 gap-3 font-mono text-[10px] uppercase tracking-widest text-grey px-4 py-2 border-b border-ink/20 bg-ink/5">
                <div className="col-span-3">Contact</div>
                <div className="col-span-3">Société · Fonction</div>
                <div className="col-span-3">Statut · Catégorie</div>
                <div className="col-span-2">Email</div>
                <div className="col-span-1 text-right">Score</div>
              </div>
              {filtered.slice(0, 200).map(c => (
                <div key={c.id} className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-ink/10 text-sm hover:bg-ink/5">
                  <div className="col-span-3 truncate">
                    <span className="font-medium">{[c.prenom, c.nom].filter(Boolean).join(' ') || '—'}</span>
                  </div>
                  <div className="col-span-3 text-ink2 truncate">
                    {c.societe || '—'}
                    {c.fonction && <span className="text-grey"> · {c.fonction}</span>}
                  </div>
                  <div className="col-span-3 flex items-center gap-2 min-w-0">
                    <StatutBadge code={c.statut} />
                    {c.categorie && <span className="text-[11px] text-grey truncate">{c.categorie}</span>}
                  </div>
                  <div className="col-span-2 text-[11px] truncate">
                    {c.email ? (
                      <a href={`mailto:${c.email}`} className={`underline-offset-2 ${c.email_valide ? 'hover:underline' : 'text-rust line-through'}`}>
                        {c.email}
                      </a>
                    ) : <span className="text-grey">—</span>}
                  </div>
                  <div className="col-span-1 text-right font-mono text-sm">{c.score}</div>
                </div>
              ))}
              {filtered.length > 200 && (
                <div className="text-center font-mono text-[10px] uppercase tracking-widest text-grey py-3">
                  + {filtered.length - 200} contacts non affichés
                </div>
              )}
              {filtered.length === 0 && (
                <div className="text-center font-serif italic text-grey py-8">aucun contact ne correspond aux filtres</div>
              )}
            </div>
          )}
        </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · crm · v.01</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}


function FilterChip({ code, label, active, onClick, count }) {
  const m = code === 'TOUS' ? { label: 'Tous' } : statutMeta(code)
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition
        ${active ? 'bg-ink text-paper border-ink' : 'bg-paper text-ink border-ink/30 hover:border-ink'}`}
    >
      {label ?? m.label} <span className={active ? 'text-paper/70' : 'text-grey'}>· {count}</span>
    </button>
  )
}
