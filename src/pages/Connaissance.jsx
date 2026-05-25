import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate, formatNumber } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import ConnaissanceNarrative from '../components/ConnaissanceNarrative.jsx'

const STATUT_AGENT = {
  PROTOTYPE:  { label: 'Prototype',   color: 'bg-grey-l text-ink' },
  EN_COURS:   { label: 'En cours',    color: 'bg-ocre text-ink' },
  PRODUCTION: { label: 'Production',  color: 'bg-ink text-paper' },
  ABANDONNE:  { label: 'Abandonné',   color: 'bg-grey-l text-ink line-through' },
}

export default function Connaissance() {
  const [agents, setAgents]         = useState([])
  const [kbs, setKbs]               = useState([])
  const [postmortems, setPostm]     = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState(null)
  const [tab, setTab]               = useState('agents')

  async function reload() {
    setLoading(true)
    try {
      const [a, k, p] = await Promise.all([
        supabase.from('agents_ia').select('*').order('updated_at', { ascending: false }),
        supabase.from('knowledge_bases').select('*').order('created_at', { ascending: false }),
        supabase.from('postmortems').select('*').order('date_fin', { ascending: false }),
      ])
      if (a.error) throw a.error
      setAgents(a.data ?? [])
      setKbs(k.data ?? [])
      setPostm(p.data ?? [])
    } catch (e) { setError(e.message ?? String(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  async function addAgent() {
    const nom = window.prompt('Nom de l\'agent :')
    if (!nom) return
    const desc = window.prompt('Description / cas d\'usage :')
    const { error } = await supabase.from('agents_ia').insert({ nom, description: desc, statut: 'PROTOTYPE' })
    if (!error) reload()
  }
  async function addKB() {
    const nom = window.prompt('Nom de la knowledge base :')
    if (!nom) return
    const client = window.prompt('Client (optionnel) :')
    const tech = window.prompt('Technologie (ex: « Supabase pgvector »)')
    const { error } = await supabase.from('knowledge_bases').insert({ nom, client_nom: client, technologie: tech })
    if (!error) reload()
  }
  async function addPostmortem() {
    const projet = window.prompt('Nom du projet livré :')
    if (!projet) return
    const client = window.prompt('Client :')
    const ok = window.prompt('Ce qui a marché :')
    const ko = window.prompt('Ce qui n\'a pas marché :')
    const lc = window.prompt('Leçons :')
    const { error } = await supabase.from('postmortems').insert({
      projet, client_nom: client, ce_qui_a_marche: ok, ce_qui_n_a_pas: ko, lecons: lc,
    })
    if (!error) reload()
  }
  async function deleteRow(table, id) {
    if (!window.confirm('Supprimer cette ligne ?')) return
    await supabase.from(table).delete().eq('id', id)
    reload()
  }
  async function cycleStatutAgent(a) {
    const order = ['PROTOTYPE','EN_COURS','PRODUCTION','ABANDONNE']
    const next = order[(order.indexOf(a.statut) + 1) % order.length]
    await supabase.from('agents_ia').update({ statut: next }).eq('id', a.id)
    reload()
  }

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module IX · capital intellectuel · agents · KB · postmortems
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">CONNAISSANCE</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · Connaissance
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <ConnaissanceNarrative agents={agents} kbs={kbs} postmortems={postmortems} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile roman="I"   label="Agents IA"        value={formatNumber(agents.length)} sub={`${agents.filter(a => a.statut === 'PRODUCTION').length} en prod`} accent />
        <StatTile roman="II"  label="Réutilisables"     value={formatNumber(agents.filter(a => a.reusable).length)} sub="prêts à redéployer" />
        <StatTile roman="III" label="Knowledge bases"  value={formatNumber(kbs.length)} sub={`${kbs.filter(k => k.reusable).length} mutualisables`} />
        <StatTile roman="IV"  label="Postmortems"      value={formatNumber(postmortems.length)} sub="leçons capitalisées" />
      </section>

      {/* tabs */}
      <div className="flex gap-2 mb-6 border-b border-ink/20 pb-1">
        {[
          { code: 'agents', label: 'Agents IA', n: agents.length },
          { code: 'kbs',    label: 'Knowledge bases', n: kbs.length },
          { code: 'pm',     label: 'Postmortems', n: postmortems.length },
        ].map(t => (
          <button key={t.code} onClick={() => setTab(t.code)}
            className={`font-mono text-[11px] uppercase tracking-widest px-4 py-2 -mb-px border-b-2 ${tab === t.code ? 'border-ink text-ink' : 'border-transparent text-grey hover:text-ink'}`}>
            {t.label} <span className="text-ocre-d">· {t.n}</span>
          </button>
        ))}
      </div>

      {tab === 'agents' && (
        <section>
          <SectionTitle num="01" label="Catalogue d'agents IA"
            action={<button onClick={addAgent} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Agent</button>} />
          <div className="grid grid-cols-2 gap-4">
            {agents.map(a => {
              const m = STATUT_AGENT[a.statut] ?? STATUT_AGENT.PROTOTYPE
              return (
                <div key={a.id} className="p-5 border border-ink/20 hover:border-ink/40 group">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[15px]">{a.nom}</div>
                      {a.modele && <div className="font-mono text-[10px] uppercase tracking-widest text-grey mt-0.5">{a.modele}</div>}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => cycleStatutAgent(a)} className={`font-mono text-[9px] uppercase tracking-widest px-2 py-1 ${m.color}`}>{m.label}</button>
                      <button onClick={() => deleteRow('agents_ia', a.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline">×</button>
                    </div>
                  </div>
                  {a.description && <div className="font-serif italic text-[13px] text-ink2 mb-2">{a.description}</div>}
                  {a.cas_usage && <div className="font-mono text-[10px] uppercase tracking-widest text-ocre-d mb-2">Cas d'usage : {a.cas_usage}</div>}
                  {a.outils_utilises && <div className="font-mono text-[10px] text-grey">Outils : {a.outils_utilises}</div>}
                  {a.clients_utilises && <div className="font-mono text-[10px] text-grey mt-0.5">Clients : {a.clients_utilises}</div>}
                  {a.reusable && <div className="font-mono text-[9px] uppercase tracking-widest text-ocre-d mt-2 border-t border-ocre/30 pt-2">★ réutilisable</div>}
                </div>
              )
            })}
            {agents.length === 0 && <div className="col-span-2 font-serif italic text-grey text-center py-6">aucun agent — clique « + Agent »</div>}
          </div>
        </section>
      )}

      {tab === 'kbs' && (
        <section>
          <SectionTitle num="01" label="Knowledge bases"
            action={<button onClick={addKB} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ KB</button>} />
          <div className="space-y-2">
            {kbs.map(k => (
              <div key={k.id} className="p-4 border border-ink/20 hover:border-ink/40 group flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[15px]">{k.nom}</div>
                  {k.description && <div className="font-serif italic text-[12px] text-ink2 mt-0.5">{k.description}</div>}
                  <div className="flex items-center gap-3 mt-1">
                    {k.client_nom && <span className="font-mono text-[10px] text-grey">Client : {k.client_nom}</span>}
                    {k.technologie && <span className="font-mono text-[10px] text-grey">Tech : {k.technologie}</span>}
                    {k.nombre_docs && <span className="font-mono text-[10px] text-grey">{k.nombre_docs} docs</span>}
                    {k.reusable && <span className="font-mono text-[9px] uppercase tracking-widest text-ocre-d">★ mutualisable</span>}
                  </div>
                </div>
                <button onClick={() => deleteRow('knowledge_bases', k.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline shrink-0">×</button>
              </div>
            ))}
            {kbs.length === 0 && <div className="font-serif italic text-grey text-center py-6">aucune KB — clique « + KB »</div>}
          </div>
        </section>
      )}

      {tab === 'pm' && (
        <section>
          <SectionTitle num="01" label="Postmortems projet"
            action={<button onClick={addPostmortem} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Postmortem</button>} />
          <div className="space-y-4">
            {postmortems.map(p => (
              <div key={p.id} className="p-5 border border-ink/20 group">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-widest text-grey mb-1">{formatDate(p.date_fin)} {p.client_nom && `· ${p.client_nom}`}</div>
                    <div className="font-medium text-[16px]">{p.projet}</div>
                  </div>
                  <button onClick={() => deleteRow('postmortems', p.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline">×</button>
                </div>
                {p.ce_qui_a_marche && (
                  <div className="mt-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-ocre-d mb-1">Ce qui a marché</div>
                    <div className="text-[13px] leading-snug">{p.ce_qui_a_marche}</div>
                  </div>
                )}
                {p.ce_qui_n_a_pas && (
                  <div className="mt-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-rust mb-1">Ce qui n'a pas marché</div>
                    <div className="text-[13px] leading-snug">{p.ce_qui_n_a_pas}</div>
                  </div>
                )}
                {p.lecons && (
                  <div className="mt-3">
                    <div className="font-mono text-[9px] uppercase tracking-widest text-ink mb-1">Leçons</div>
                    <div className="font-serif italic text-[13px] leading-snug">{p.lecons}</div>
                  </div>
                )}
                {p.reutilisable_pour && (
                  <div className="font-mono text-[10px] text-grey mt-3 border-t border-ink/15 pt-2">
                    Réutilisable pour : {p.reutilisable_pour}
                  </div>
                )}
              </div>
            ))}
            {postmortems.length === 0 && <div className="font-serif italic text-grey text-center py-6">aucun postmortem — clique « + Postmortem »</div>}
          </div>
        </section>
      )}

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · connaissance · v.05</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
