import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { STATUTS, statutMeta } from '../lib/statuts.js'
import StatutBadge from '../components/StatutBadge.jsx'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import ContactDrawer from '../components/ContactDrawer.jsx'

export default function Dashboard() {
  const [contacts, setContacts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState(null)
  const [filterStatut, setFilter] = useState('TOUS')
  const [query, setQuery]         = useState('')
  const [drawer, setDrawer]       = useState({ open: false, contact: null })

  async function reload() {
    setLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('score', { ascending: false })
      .limit(1000)
    if (error) setError(error.message)
    else setContacts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  const stats = useMemo(() => {
    const total       = contacts.length
    const clients     = contacts.filter(c => c.statut === 'CLIENT_SIGNE').length
    const chauds      = contacts.filter(c => c.statut === 'PROSPECT_CHAUD').length
    const publics     = contacts.filter(c => c.statut === 'PROSPECT_PUBLIC').length
    const wealth      = contacts.filter(c => c.statut === 'PROSPECT_WEALTH' || c.statut === 'PROSPECT_CGP').length
    const sectoriel   = contacts.filter(c => c.statut === 'PROSPECT_SECTORIEL').length
    const partenaires = contacts.filter(c => c.statut === 'PROSPECT_PARTENAIRE').length
    const bounced     = contacts.filter(c => c.email_valide === false).length
    return { total, clients, chauds, publics, wealth, sectoriel, partenaires, bounced }
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

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">

      <section className="mb-12">
        <div className="flex items-end justify-between mb-3">
          <p className="font-serif italic text-[15px] text-grey">
            module I · vue d'ensemble du pipeline
          </p>
          <button
            onClick={() => setDrawer({ open: true, contact: null })}
            className="px-4 py-2 font-mono text-[11px] uppercase tracking-widest bg-ink text-paper hover:bg-ocre-d transition flex items-center gap-2"
          >
            <span className="text-ocre">+</span>
            Nouveau contact
          </button>
        </div>
        <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">
          RELATION CLIENTS
        </h1>
        <p className="font-serif italic text-[16px] text-ink/80 mt-3 max-w-[700px]">
          {stats.total} contacts dont {stats.clients} clients signés et {stats.chauds} prospects chauds.
        </p>
      </section>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* STATS PRINCIPALES — cliquables vers filtre */}
      <section className="grid grid-cols-4 gap-4 mb-6">
        <StatTile roman="I"   label="Clients signés"  value={stats.clients}
                  sub="à fidéliser · phase suivante"
                  accent onClick={() => setFilter('CLIENT_SIGNE')} />
        <StatTile roman="II"  label="Prospects chauds" value={stats.chauds}
                  sub="devis / RDV en cours"
                  onClick={() => setFilter('PROSPECT_CHAUD')} />
        <StatTile roman="III" label="AO publics"       value={stats.publics}
                  sub="réponses en cours"
                  onClick={() => setFilter('PROSPECT_PUBLIC')} />
        <StatTile roman="IV"  label="Wealth / CGP"     value={stats.wealth}
                  sub="campagnes patrimoine"
                  onClick={() => setFilter('PROSPECT_WEALTH')} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-16">
        <StatTile label="Sectoriels" value={stats.sectoriel}
                  sub="mailing tous secteurs"
                  onClick={() => setFilter('PROSPECT_SECTORIEL')} />
        <StatTile label="Partenaires" value={stats.partenaires}
                  sub="agences IA / RH / formation"
                  onClick={() => setFilter('PROSPECT_PARTENAIRE')} />
        <StatTile label="Emails bouncés" value={stats.bounced}
                  sub="à requalifier" />
        <StatTile label="Total pipeline" value={stats.total}
                  sub="tous statuts confondus"
                  onClick={() => setFilter('TOUS')} />
      </section>

      {/* PIPELINE COMPLET */}
      <section>
        <SectionTitle num="01" label="Pipeline détaillé"
                      hint={`${filtered.length} contacts affichés`} />

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
          className="w-full bg-transparent border-b border-ink/30 py-2 mb-4 outline-none placeholder:text-grey font-mono text-sm focus:border-ink"
        />

        {loading && <div className="font-mono text-sm text-grey">Chargement…</div>}

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
              <button
                key={c.id}
                onClick={() => setDrawer({ open: true, contact: c })}
                className="w-full grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-ink/10 text-sm hover:bg-ink/5 text-left transition"
              >
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
                    <span className={c.email_valide ? '' : 'text-rust line-through'}>{c.email}</span>
                  ) : <span className="text-grey">—</span>}
                </div>
                <div className="col-span-1 text-right font-mono text-sm">{c.score}</div>
              </button>
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

      <footer className="mt-20 pt-4 border-t border-ink/20 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · crm · v.02</span>
        <span>{stats.total} contacts</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>

      <ContactDrawer
        open={drawer.open}
        contact={drawer.contact}
        onClose={() => setDrawer({ open: false, contact: null })}
        onSaved={() => reload()}
      />
    </main>
  )
}

function FilterChip({ code, label, active, onClick, count }) {
  const m = code === 'TOUS' ? { label: 'Tous' } : statutMeta(code)
  return (
    <button
      onClick={onClick}
      className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition
        ${active ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-ink/30 hover:border-ink'}`}
    >
      {label ?? m.label} <span className={active ? 'text-paper/70' : 'text-grey'}>· {count}</span>
    </button>
  )
}
