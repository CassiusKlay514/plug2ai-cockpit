import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate, formatNumber } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import VeilleNarrative from '../components/VeilleNarrative.jsx'

const CAT = {
  AI_ACT:          { label: 'AI Act',         color: 'bg-rust text-paper' },
  RGPD:            { label: 'RGPD',           color: 'bg-rust text-paper' },
  NIS2:            { label: 'NIS2',           color: 'bg-rust text-paper' },
  ANNONCE_PRODUIT: { label: 'Annonce produit', color: 'bg-ocre text-ink' },
  CONCURRENCE:     { label: 'Concurrence',    color: 'bg-ink text-paper' },
  ARTICLE_EXPERT:  { label: 'Article expert', color: 'bg-ink2 text-paper' },
  VEILLE_CYBER:    { label: 'Veille cyber',   color: 'bg-grey text-paper' },
  AUTRE:           { label: 'Autre',          color: 'bg-grey-l text-ink' },
}

export default function Veille() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [filterCat, setCat]     = useState('TOUS')
  const [onlyUnread, setUnread] = useState(false)

  async function reload() {
    setLoading(true)
    const { data, error } = await supabase.from('veille').select('*').order('date_pub', { ascending: false })
    if (error) setError(error.message)
    else setArticles(data ?? [])
    setLoading(false)
  }
  useEffect(() => { reload() }, [])

  const filtered = useMemo(() => {
    let rows = articles
    if (filterCat !== 'TOUS') rows = rows.filter(a => a.categorie === filterCat)
    if (onlyUnread) rows = rows.filter(a => !a.vu)
    return rows
  }, [articles, filterCat, onlyUnread])

  async function quickAdd() {
    const titre = window.prompt('Titre de l\'article ou alerte :')
    if (!titre) return
    const source = window.prompt('Source (ex: « Anthropic », « EU Commission ») :')
    const url = window.prompt('URL (optionnel) :')
    const cat = window.prompt('Catégorie ? AI_ACT, RGPD, NIS2, ANNONCE_PRODUIT, CONCURRENCE, ARTICLE_EXPERT, VEILLE_CYBER, AUTRE', 'AUTRE')
    const { error } = await supabase.from('veille').insert({ titre, source, url, categorie: cat })
    if (!error) reload()
  }
  async function toggleVu(a) {
    await supabase.from('veille').update({ vu: !a.vu }).eq('id', a.id)
    reload()
  }
  async function togglePertinent(a) {
    await supabase.from('veille').update({ pertinent: !a.pertinent }).eq('id', a.id)
    reload()
  }
  async function deleteRow(id) {
    if (!window.confirm('Supprimer cet article ?')) return
    await supabase.from('veille').delete().eq('id', id)
    reload()
  }

  const aLire = articles.filter(a => !a.vu).length
  const pertinents = articles.filter(a => a.pertinent && !a.vu).length
  const compteParCat = useMemo(() => {
    const c = {}
    articles.forEach(a => { c[a.categorie] = (c[a.categorie] ?? 0) + 1 })
    return c
  }, [articles])

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module VIII · veille IA · AI Act · concurrence · annonces
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">VEILLE</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · Veille
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <VeilleNarrative articles={articles} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile roman="I"   label="Articles suivis"  value={formatNumber(articles.length)} sub="cumul total" />
        <StatTile roman="II"  label="À lire"           value={formatNumber(aLire)} sub="non consultés" accent />
        <StatTile roman="III" label="Pertinents"       value={formatNumber(pertinents)} sub="action recommandée" />
        <StatTile roman="IV"  label="AI Act + RGPD"    value={(compteParCat['AI_ACT'] ?? 0) + (compteParCat['RGPD'] ?? 0)} sub="alertes régulatoires" />
      </section>

      <section>
        <SectionTitle num="01" label="Flux de veille" hint={`${filtered.length} articles affichés`}
          action={<button onClick={quickAdd} className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5">+ Article</button>} />

        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <button onClick={() => setCat('TOUS')}
            className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border ${filterCat === 'TOUS' ? 'bg-ink text-paper border-ink' : 'border-ink/30 hover:border-ink'}`}>
            Tous <span className="text-grey">· {articles.length}</span>
          </button>
          {Object.entries(CAT).filter(([c]) => compteParCat[c]).map(([c, m]) => (
            <button key={c} onClick={() => setCat(c)}
              className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border ${filterCat === c ? 'bg-ink text-paper border-ink' : 'border-ink/30 hover:border-ink'}`}>
              {m.label} <span className="text-grey">· {compteParCat[c]}</span>
            </button>
          ))}
          <label className="flex items-center gap-2 ml-3 cursor-pointer">
            <button onClick={() => setUnread(!onlyUnread)}
              className={`w-9 h-5 rounded-full transition relative ${onlyUnread ? 'bg-ink' : 'bg-ink/20'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full transition-transform ${onlyUnread ? 'translate-x-4' : ''}`} />
            </button>
            <span className="font-mono text-[11px] uppercase tracking-widest">À lire uniquement</span>
          </label>
        </div>

        <div className="space-y-2">
          {filtered.map(a => {
            const m = CAT[a.categorie] ?? CAT.AUTRE
            return (
              <div key={a.id} className={`p-3 border ${a.vu ? 'border-ink/15 opacity-60' : 'border-ink/30'} hover:border-ink group flex items-start gap-3`}>
                <button onClick={() => toggleVu(a)}
                  className={`shrink-0 mt-0.5 w-4 h-4 border ${a.vu ? 'bg-ink border-ink' : 'border-ink/40 hover:border-ink'} flex items-center justify-center`}
                  title={a.vu ? 'Marquer non lu' : 'Marquer lu'}>
                  {a.vu && <span className="text-paper text-[10px] leading-none">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-[1px] ${m.color}`}>{m.label}</span>
                    <span className="font-mono text-[10px] text-grey">{formatDate(a.date_pub)}</span>
                    {a.source && <span className="font-mono text-[10px] text-grey">· {a.source}</span>}
                    {a.pertinent && (
                      <button onClick={() => togglePertinent(a)}
                        className="font-mono text-[9px] uppercase tracking-widest text-ocre-d border border-ocre/40 px-1.5">
                        ★ pertinent
                      </button>
                    )}
                  </div>
                  <div className="font-medium text-[14px] mb-1">
                    {a.url ? <a href={a.url} target="_blank" rel="noreferrer" className="hover:text-ocre-d">{a.titre} ↗</a> : a.titre}
                  </div>
                  {a.resume && <div className="font-serif italic text-[13px] text-ink2">{a.resume}</div>}
                  {a.action_a_faire && <div className="font-mono text-[10px] uppercase tracking-widest text-ocre-d mt-1">Action : {a.action_a_faire}</div>}
                </div>
                <button onClick={() => deleteRow(a.id)} className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline shrink-0">×</button>
              </div>
            )
          })}
          {filtered.length === 0 && <div className="font-serif italic text-grey text-center py-6">aucun article ne correspond aux filtres</div>}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · veille · v.05</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
