import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate, formatEur, formatNumber } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CEONarrative from '../components/CEONarrative.jsx'

const STATUT_OKR = {
  A_LANCER:  { label: 'À lancer',  color: 'bg-grey-l text-ink' },
  EN_COURS:  { label: 'En cours',  color: 'bg-ocre text-ink' },
  ATTEINT:   { label: 'Atteint',   color: 'bg-ink text-paper' },
  RATE:      { label: 'Raté',      color: 'bg-rust text-paper' },
}
const STATUT_DEC = {
  A_PRENDRE:    { label: 'À prendre',   color: 'bg-rust/30 text-rust' },
  EN_REFLEXION: { label: 'En réflexion', color: 'bg-ocre text-ink' },
  PRISE:        { label: 'Prise',       color: 'bg-ink text-paper' },
  ANNULEE:      { label: 'Annulée',     color: 'bg-grey-l text-ink' },
}
const STATUT_RM = {
  PREVU:      { label: 'Prévu',     color: 'bg-grey-l text-ink' },
  EN_COURS:   { label: 'En cours',  color: 'bg-ocre text-ink' },
  LIVRE:      { label: 'Livré',     color: 'bg-ink text-paper' },
  REPORTE:    { label: 'Reporté',   color: 'bg-rust/30 text-rust' },
  ABANDONNE:  { label: 'Abandonné', color: 'bg-grey-l text-ink line-through' },
}

export default function CEO() {
  const [okrs, setOkrs]               = useState([])
  const [decisions, setDecisions]     = useState([])
  const [roadmap, setRoadmap]         = useState([])
  const [synth, setSynth]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)

  async function reload() {
    setLoading(true)
    try {
      const [o, d, r, s] = await Promise.all([
        supabase.from('okrs').select('*').order('trimestre', { ascending: false }),
        supabase.from('decisions').select('*').order('date_decision', { ascending: false }).limit(20),
        supabase.from('roadmap').select('*').order('trimestre').order('ordre'),
        supabase.from('synthese_globale').select('*').single(),
      ])
      if (o.error) throw o.error
      setOkrs(o.data ?? [])
      setDecisions(d.data ?? [])
      setRoadmap(r.data ?? [])
      setSynth(s.data)
    } catch (e) { setError(e.message ?? String(e)) }
    finally { setLoading(false) }
  }
  useEffect(() => { reload() }, [])

  const trimestres = useMemo(() => Array.from(new Set(roadmap.map(r => r.trimestre))).sort(), [roadmap])
  const trimCourant = okrs[0]?.trimestre ?? '2026-Q3'
  const okrsTrim = okrs.filter(o => o.trimestre === trimCourant)

  async function quickAddDecision() {
    const titre = window.prompt('Titre de la décision :')
    if (!titre) return
    const { error } = await supabase.from('decisions').insert({ titre, statut: 'A_PRENDRE' })
    if (!error) reload()
    else window.alert('Erreur : ' + error.message)
  }
  async function quickAddOkr() {
    const obj = window.prompt('Objectif (ex: « Doubler le CA mensuel ») :')
    if (!obj) return
    const kr = window.prompt('Résultat clé (ex: « CA HT mensuel récurrent ») :')
    if (!kr) return
    const cible = Number(window.prompt('Cible (nombre) :')) || 0
    const unite = window.prompt('Unité (€, clients, %)') || 'unités'
    const { error } = await supabase.from('okrs').insert({
      trimestre: trimCourant, objectif: obj, resultat_cle: kr, cible, actuel: 0, unite, statut: 'EN_COURS',
    })
    if (!error) reload()
    else window.alert('Erreur : ' + error.message)
  }
  async function quickAddRoadmap() {
    const titre = window.prompt('Titre de l\'item roadmap :')
    if (!titre) return
    const trim = window.prompt('Trimestre (ex: 2026-Q3)') || trimCourant
    const { error } = await supabase.from('roadmap').insert({ titre, trimestre: trim, statut: 'PREVU' })
    if (!error) reload()
    else window.alert('Erreur : ' + error.message)
  }
  async function updateOkrActuel(id, current) {
    const v = window.prompt('Nouvelle valeur actuelle :', current ?? 0)
    if (v === null) return
    const { error } = await supabase.from('okrs').update({ actuel: Number(v) }).eq('id', id)
    if (!error) reload()
  }
  async function deleteRow(table, id) {
    if (!window.confirm('Supprimer cette ligne ?')) return
    await supabase.from(table).delete().eq('id', id)
    reload()
  }
  async function cycleStatutRoadmap(item) {
    const order = ['PREVU','EN_COURS','LIVRE','REPORTE','ABANDONNE']
    const next = order[(order.indexOf(item.statut) + 1) % order.length]
    await supabase.from('roadmap').update({ statut: next }).eq('id', item.id)
    reload()
  }
  async function cycleStatutDecision(d) {
    const order = ['A_PRENDRE','EN_REFLEXION','PRISE','ANNULEE']
    const next = order[(order.indexOf(d.statut) + 1) % order.length]
    await supabase.from('decisions').update({ statut: next }).eq('id', d.id)
    reload()
  }
  async function cycleStatutOkr(o) {
    const order = ['A_LANCER','EN_COURS','ATTEINT','RATE']
    const next = order[(order.indexOf(o.statut) + 1) % order.length]
    await supabase.from('okrs').update({ statut: next }).eq('id', o.id)
    reload()
  }

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module VII · stratégie · OKRs · décisions · roadmap
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">STRATÉGIE</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CEO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <CEONarrative okrs={okrs} decisions={decisions} roadmap={roadmap} synth={synth} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile roman="I"   label="OKRs trimestre" value={formatNumber(okrsTrim.length)} sub={trimCourant} accent />
        <StatTile roman="II"  label="OKRs atteints"  value={okrsTrim.filter(o => o.statut === 'ATTEINT').length} sub="cible validée" />
        <StatTile roman="III" label="Décisions"      value={formatNumber(decisions.length)} sub={`${decisions.filter(d => d.statut === 'PRISE').length} prises`} />
        <StatTile roman="IV"  label="Roadmap"        value={formatNumber(roadmap.length)} sub={`${roadmap.filter(r => r.statut === 'EN_COURS').length} en cours · ${roadmap.filter(r => r.statut === 'LIVRE').length} livrés`} />
      </section>

      {/* OKRs */}
      <section className="mb-12">
        <SectionTitle num="01" label={`OKRs · ${trimCourant}`} hint={`${okrsTrim.length} key results`}
          action={<button onClick={quickAddOkr} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Nouvel OKR</button>} />
        <div className="space-y-3">
          {okrsTrim.map(o => {
            const cible = Number(o.cible) || 0
            const actuel = Number(o.actuel) || 0
            const pct = cible !== 0 ? Math.min(100, Math.max(0, Math.abs((actuel / cible) * 100))) : 0
            const meta = STATUT_OKR[o.statut] ?? STATUT_OKR.EN_COURS
            return (
              <div key={o.id} className="p-4 border border-ink/20 group">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-[10px] uppercase tracking-widest text-grey mb-1">Objectif</div>
                    <div className="font-medium text-[15px] mb-1">{o.objectif}</div>
                    <div className="font-serif italic text-[13px] text-ink2">{o.resultat_cle}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => cycleStatutOkr(o)} className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 ${meta.color} hover:opacity-80`}>{meta.label}</button>
                    <button onClick={() => deleteRow('okrs', o.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline">suppr</button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-1">
                  <button onClick={() => updateOkrActuel(o.id, o.actuel)}
                    className="font-mono text-[13px] text-ink hover:text-ocre-d transition">
                    <span className="font-bold">{actuel}</span> {o.unite} <span className="text-grey">/ {cible}</span>
                  </button>
                  <span className="font-mono text-[11px] text-grey">{Math.round(pct)} %</span>
                </div>
                <div className="h-[3px] bg-ink/10 relative overflow-hidden">
                  <div className="h-full bg-ink transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
          {okrsTrim.length === 0 && <div className="font-serif italic text-grey text-center py-6">aucun OKR pour {trimCourant} — clique « + Nouvel OKR »</div>}
        </div>
      </section>

      {/* Décisions */}
      <section className="mb-12">
        <SectionTitle num="02" label="Journal de décisions" hint={`${decisions.length} décisions consignées`}
          action={<button onClick={quickAddDecision} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Nouvelle décision</button>} />
        <div className="space-y-2">
          {decisions.slice(0, 12).map(d => {
            const meta = STATUT_DEC[d.statut] ?? STATUT_DEC.PRISE
            return (
              <div key={d.id} className="p-3 border border-ink/15 hover:border-ink/40 group flex items-start gap-3">
                <div className="font-mono text-[11px] text-grey w-20 shrink-0">{formatDate(d.date_decision)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[14px]">{d.titre}</div>
                  {d.decision_prise && <div className="font-serif italic text-[12px] text-ink2 mt-0.5">{d.decision_prise}</div>}
                  {d.tags && <div className="font-mono text-[9px] uppercase tracking-widest text-grey mt-1">{d.tags}</div>}
                </div>
                <button onClick={() => cycleStatutDecision(d)} className={`font-mono text-[10px] uppercase tracking-widest px-2 py-1 ${meta.color} shrink-0`}>{meta.label}</button>
                <button onClick={() => deleteRow('decisions', d.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline shrink-0">×</button>
              </div>
            )
          })}
        </div>
      </section>

      {/* Roadmap */}
      <section className="mb-12">
        <SectionTitle num="03" label="Roadmap" hint={`${trimestres.length} trimestres planifiés`}
          action={<button onClick={quickAddRoadmap} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Chantier</button>} />
        {trimestres.map(trim => (
          <div key={trim} className="mb-5">
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-grey mb-2 pb-1 border-b border-ink/15">
              {trim} <span className="text-ocre-d">· {roadmap.filter(r => r.trimestre === trim).length}</span>
            </div>
            <div className="space-y-1">
              {roadmap.filter(r => r.trimestre === trim).map(r => {
                const meta = STATUT_RM[r.statut] ?? STATUT_RM.PREVU
                return (
                  <div key={r.id} className="flex items-center gap-3 px-2 py-1.5 hover:bg-ink/5 group">
                    <button onClick={() => cycleStatutRoadmap(r)} className={`font-mono text-[9px] uppercase tracking-widest px-2 py-[2px] ${meta.color} w-24 text-center shrink-0`}>{meta.label}</button>
                    <div className="flex-1 text-[14px] font-medium">{r.titre}</div>
                    {r.module_lie && <div className="font-mono text-[9px] uppercase tracking-widest text-grey">{r.module_lie}</div>}
                    <button onClick={() => deleteRow('roadmap', r.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline">×</button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · ceo · v.05</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
