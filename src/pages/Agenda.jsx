import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import MeetingDrawer from '../components/MeetingDrawer.jsx'
import TaskQuickAdd from '../components/TaskQuickAdd.jsx'

const TYPE_COLOR = {
  CLIENT: 'bg-ink text-paper',
  INTERNE: 'bg-ocre-d text-paper',
  PROSPECT: 'bg-rust text-paper',
  PARTENAIRE: 'bg-ocre text-ink',
  AUTRE: 'bg-grey-l text-ink',
}

export default function Agenda() {
  const [reunions, setReunions] = useState([])
  const [taches, setTaches]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  const [filterType, setFilterType]  = useState('TOUS')
  const [drawer, setDrawer]          = useState({ open: false, meeting: null })

  const [tasksMode, setTasksMode]    = useState('par_personne') // par_personne | par_statut
  const [filterAssignee, setFilterA] = useState('TOUS')
  const [filterTaskStatut, setFTS]   = useState('TOUS')

  async function reload() {
    setLoading(true)
    const [r, t] = await Promise.all([
      supabase.from('reunions').select('*').order('date_event', { ascending: false }).limit(500),
      supabase.from('taches').select('*').order('created_at', { ascending: false }).limit(1000),
    ])
    if (r.error || t.error) setError((r.error || t.error).message)
    else { setReunions(r.data ?? []); setTaches(t.data ?? []) }
    setLoading(false)
  }

  useEffect(() => { reload() }, [])

  // Stats
  const stats = useMemo(() => {
    const total = reunions.length
    const client = reunions.filter(r => r.type_reunion === 'CLIENT').length
    const interne = reunions.filter(r => r.type_reunion === 'INTERNE').length
    const totalTaches = taches.length
    const taFaire = taches.filter(t => t.statut === 'A_FAIRE').length
    const enCours = taches.filter(t => t.statut === 'EN_COURS').length
    const terminees = taches.filter(t => t.statut === 'TERMINE').length
    return { total, client, interne, totalTaches, taFaire, enCours, terminees }
  }, [reunions, taches])

  // Filtrage réunions
  const filteredReunions = useMemo(() => {
    if (filterType === 'TOUS') return reunions
    return reunions.filter(r => r.type_reunion === filterType)
  }, [reunions, filterType])

  // Groupes de réunions par mois
  const reunionsParMois = useMemo(() => {
    const groups = {}
    filteredReunions.forEach(r => {
      const d = new Date(r.date_event)
      const key = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
      if (!groups[key]) groups[key] = []
      groups[key].push(r)
    })
    return groups
  }, [filteredReunions])

  // Assignees uniques
  const assignees = useMemo(() => {
    const set = new Set(taches.map(t => t.assignee_nom).filter(Boolean))
    return Array.from(set).sort()
  }, [taches])

  // Tâches groupées par personne
  const tachesParPersonne = useMemo(() => {
    const map = {}
    taches.forEach(t => {
      if (filterTaskStatut !== 'TOUS' && t.statut !== filterTaskStatut) return
      const k = t.assignee_nom || 'Non assigné'
      if (!map[k]) map[k] = []
      map[k].push(t)
    })
    // tri : la personne avec le plus de tâches en premier
    return Object.entries(map).sort((a, b) => b[1].length - a[1].length)
  }, [taches, filterTaskStatut])

  async function toggleTache(tache) {
    const newStatut = tache.statut === 'TERMINE' ? 'A_FAIRE' : 'TERMINE'
    const { error } = await supabase.from('taches').update({
      statut: newStatut,
      date_completion: newStatut === 'TERMINE' ? new Date().toISOString() : null,
    }).eq('id', tache.id)
    if (!error) reload()
  }

  async function deleteTache(tache) {
    if (!window.confirm(`Supprimer cette tâche ?\n\n"${tache.description}"`)) return
    const { error } = await supabase.from('taches').delete().eq('id', tache.id)
    if (!error) reload()
  }

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-12 relative z-10">

      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module VI · agenda · réunions · tâches par personne
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">AGENDA</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · Agenda
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* KPI */}
      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile roman="I"   label="Réunions"       value={stats.total}   sub={`${stats.client} client · ${stats.interne} interne`} accent />
        <StatTile roman="II"  label="Tâches actives"  value={stats.taFaire + stats.enCours} sub={`${stats.taFaire} à faire · ${stats.enCours} en cours`} />
        <StatTile roman="III" label="Tâches terminées" value={stats.terminees} sub="historique cumulé" />
        <StatTile roman="IV"  label="Personnes"        value={assignees.length} sub="assignees distincts" />
      </section>

      {/* AGENDA */}
      <section className="mb-16">
        <SectionTitle num="01" label="Calendrier des réunions"
                      hint={`${filteredReunions.length} réunions · cliquer pour le résumé`} />

        <div className="flex gap-2 mb-5 flex-wrap">
          {['TOUS','CLIENT','INTERNE','AUTRE'].map(t => {
            const n = t === 'TOUS' ? reunions.length : reunions.filter(r => r.type_reunion === t).length
            const active = filterType === t
            return (
              <button key={t} onClick={() => setFilterType(t)}
                className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition
                  ${active ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-ink/30 hover:border-ink'}`}>
                {t.charAt(0) + t.slice(1).toLowerCase()} <span className={active ? 'text-paper/70' : 'text-grey'}>· {n}</span>
              </button>
            )
          })}
        </div>

        {loading && <div className="font-mono text-sm text-grey">Chargement…</div>}

        <div className="space-y-8">
          {Object.entries(reunionsParMois).map(([mois, items]) => (
            <div key={mois}>
              <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-grey mb-3 pb-1 border-b border-ink/15">
                {mois} <span className="text-ocre-d">· {items.length}</span>
              </div>
              <div className="space-y-2">
                {items.map(r => (
                  <button key={r.id}
                    onClick={() => setDrawer({ open: true, meeting: r })}
                    className="w-full flex items-start gap-4 p-3 border border-ink/15 hover:border-ink hover:bg-ink/5 text-left transition group">
                    <div className="shrink-0 text-center w-14">
                      <div className="font-title text-[24px] leading-none">
                        {new Date(r.date_event).getDate()}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-widest text-grey mt-1">
                        {new Date(r.date_event).toLocaleDateString('fr-FR', { weekday: 'short' })}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-mono text-[9px] uppercase tracking-widest px-1.5 py-[1px] ${TYPE_COLOR[r.type_reunion]}`}>
                          {r.type_reunion}
                        </span>
                        <span className="font-mono text-[10px] text-grey">
                          {new Date(r.date_event).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {r.duree_minutes && ` · ${r.duree_minutes} min`}
                        </span>
                      </div>
                      <div className="font-medium text-[15px] group-hover:text-ocre-d transition-colors truncate">
                        {r.titre}
                      </div>
                      {r.participants && (
                        <div className="font-serif italic text-[12px] text-grey mt-1 truncate">
                          {r.participants}
                        </div>
                      )}
                    </div>
                    <div className="font-mono text-[10px] text-grey opacity-0 group-hover:opacity-100 self-center transition-opacity shrink-0">
                      lire →
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {Object.keys(reunionsParMois).length === 0 && !loading && (
            <div className="text-center font-serif italic text-grey py-12">
              aucune réunion à afficher
            </div>
          )}
        </div>
      </section>

      {/* TÂCHES PAR PERSONNE */}
      <section>
        <SectionTitle num="02" label="Tâches par personne"
                      hint={`${stats.totalTaches} tâches au total`}
                      action={<TaskQuickAdd assignees={assignees.length > 0 ? assignees : ['Jonathan Gomez','doseit','Camille']} onAdded={reload} />} />

        <div className="flex gap-2 mb-5 flex-wrap">
          {[
            { code: 'TOUS', label: 'Toutes', n: stats.totalTaches },
            { code: 'A_FAIRE', label: 'À faire', n: stats.taFaire },
            { code: 'EN_COURS', label: 'En cours', n: stats.enCours },
            { code: 'TERMINE', label: 'Terminées', n: stats.terminees },
          ].map(t => {
            const active = filterTaskStatut === t.code
            return (
              <button key={t.code} onClick={() => setFTS(t.code)}
                className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border transition
                  ${active ? 'bg-ink text-paper border-ink' : 'bg-transparent text-ink border-ink/30 hover:border-ink'}`}>
                {t.label} <span className={active ? 'text-paper/70' : 'text-grey'}>· {t.n}</span>
              </button>
            )
          })}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {tachesParPersonne.map(([nom, items]) => (
            <div key={nom} className="border border-ink/20 p-5 bg-paper/40">
              <div className="flex items-baseline justify-between mb-3 pb-2 border-b border-ink/15">
                <h3 className="font-mono text-[12px] uppercase tracking-[0.25em] text-ink">{nom}</h3>
                <span className="font-mono text-[10px] text-grey">{items.length} tâche{items.length > 1 ? 's' : ''}</span>
              </div>
              <ul className="space-y-2">
                {items.slice(0, 12).map(t => (
                  <li key={t.id} className="flex items-start gap-2 group">
                    <button
                      onClick={() => toggleTache(t)}
                      className={`shrink-0 mt-0.5 w-4 h-4 border ${t.statut === 'TERMINE' ? 'bg-ink border-ink' : 'border-ink/40 hover:border-ink'} flex items-center justify-center transition`}>
                      {t.statut === 'TERMINE' && <span className="text-paper text-[10px] leading-none">✓</span>}
                    </button>
                    <div className={`flex-1 text-[13px] leading-snug ${t.statut === 'TERMINE' ? 'line-through text-grey' : 'text-ink'}`}>
                      {t.description}
                    </div>
                    <button onClick={() => deleteTache(t)}
                      className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline transition shrink-0"
                      title="Supprimer">
                      ×
                    </button>
                  </li>
                ))}
                {items.length > 12 && (
                  <li className="font-mono text-[10px] uppercase tracking-widest text-grey text-center pt-2">
                    + {items.length - 12} non affichées
                  </li>
                )}
              </ul>
            </div>
          ))}
          {tachesParPersonne.length === 0 && (
            <div className="col-span-2 text-center font-serif italic text-grey py-12">
              aucune tâche
            </div>
          )}
        </div>
      </section>

      <footer className="mt-20 pt-4 border-t border-ink/20 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · agenda · v.03</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>

      <MeetingDrawer
        open={drawer.open}
        meeting={drawer.meeting}
        onClose={() => setDrawer({ open: false, meeting: null })}
        onUpdated={reload}
      />
    </main>
  )
}
