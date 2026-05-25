import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatDate } from '../lib/format.js'

const TYPE_LABEL = {
  CLIENT: 'Client',
  INTERNE: 'Interne',
  PROSPECT: 'Prospect',
  PARTENAIRE: 'Partenaire',
  AUTRE: 'Autre',
}

export default function MeetingDrawer({ meeting, open, onClose, onUpdated }) {
  const [taches, setTaches] = useState([])

  useEffect(() => {
    if (!open || !meeting?.id) return
    supabase.from('taches').select('*').eq('reunion_id', meeting.id)
      .order('statut').order('assignee_nom')
      .then(({ data }) => setTaches(data ?? []))
  }, [open, meeting])

  if (!open || !meeting) return null

  const md = (meeting.resume ?? '').toString()
  // Conversion markdown très simple en HTML lisible
  const htmlBlocks = md
    .split('\n\n')
    .map(block => {
      let b = block
      // links [text](url) → text + petit link
      b = b.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="underline decoration-ocre/40 decoration-dotted underline-offset-2 hover:decoration-ocre">$1</a>')
      // ** bold **
      b = b.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-mono not-italic">$1</strong>')
      // headings
      if (b.startsWith('## ')) return `<h3 class="font-mono text-[12px] uppercase tracking-[0.3em] text-ocre-d mt-6 mb-3 pb-1 border-b border-ocre/30">${b.slice(3)}</h3>`
      if (b.startsWith('### ')) return `<h4 class="font-mono text-[11px] uppercase tracking-widest text-ink mt-4 mb-2">${b.slice(4)}</h4>`
      // bullets
      if (b.includes('\n  - ')) {
        const items = b.split('\n').filter(l => l.trim().startsWith('- ')).map(l => `<li class="pl-2">${l.trim().slice(2)}</li>`).join('')
        return `<ul class="list-[circle] pl-5 space-y-1.5 text-[14px] leading-relaxed">${items}</ul>`
      }
      if (b.startsWith('- ') || b.startsWith('  - ')) {
        const items = b.split('\n').filter(l => l.trim().startsWith('- ')).map(l => `<li class="pl-2">${l.trim().slice(2)}</li>`).join('')
        return `<ul class="list-[circle] pl-5 space-y-1.5 text-[14px] leading-relaxed">${items}</ul>`
      }
      return `<p class="text-[14px] leading-relaxed">${b}</p>`
    })
    .join('')

  async function toggleTache(tache) {
    const newStatut = tache.statut === 'TERMINE' ? 'A_FAIRE' : 'TERMINE'
    const { error } = await supabase.from('taches').update({
      statut: newStatut,
      date_completion: newStatut === 'TERMINE' ? new Date().toISOString() : null,
    }).eq('id', tache.id)
    if (!error) {
      setTaches(prev => prev.map(t => t.id === tache.id ? { ...t, statut: newStatut } : t))
      onUpdated?.()
    }
  }

  async function deleteTache(tache) {
    if (!window.confirm(`Supprimer cette tâche ?\n\n"${tache.description}"`)) return
    const { error } = await supabase.from('taches').delete().eq('id', tache.id)
    if (!error) {
      setTaches(prev => prev.filter(t => t.id !== tache.id))
      onUpdated?.()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-[720px] bg-paper border-l border-ink shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-ink/20 sticky top-0 bg-paper z-10 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ocre-d">
                Réunion · {TYPE_LABEL[meeting.type_reunion]}
              </span>
              <span className="font-mono text-[10px] text-grey">{formatDate(meeting.date_event)}</span>
              {meeting.duree_minutes && (
                <span className="font-mono text-[10px] text-grey">· {meeting.duree_minutes} min</span>
              )}
            </div>
            <h2 className="font-title text-[26px] leading-tight">{meeting.titre}</h2>
            {meeting.participants && (
              <div className="font-serif italic text-[12px] text-ink2 mt-1 truncate">
                {meeting.participants}
              </div>
            )}
            {meeting.recording_url && (
              <a href={meeting.recording_url} target="_blank" rel="noreferrer"
                 className="inline-block mt-2 font-mono text-[10px] uppercase tracking-widest text-ink border border-ink/30 px-2 py-1 hover:border-ink hover:bg-ink/5">
                ↗ Replay Fathom
              </a>
            )}
          </div>
          <button onClick={onClose}
            className="shrink-0 w-9 h-9 border border-ink/30 hover:border-ink flex items-center justify-center font-mono text-lg leading-none">
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Action items */}
          {taches.length > 0 && (
            <section className="mb-8">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ocre-d mb-3 pb-1 border-b border-ocre/30">
                Action items · {taches.length}
              </h3>
              <ul className="space-y-2">
                {taches.map(t => (
                  <li key={t.id} className="flex items-start gap-3 group">
                    <button
                      onClick={() => toggleTache(t)}
                      className={`shrink-0 mt-0.5 w-4 h-4 border ${t.statut === 'TERMINE' ? 'bg-ink border-ink' : 'border-ink/40 hover:border-ink'} flex items-center justify-center transition`}
                      title="Marquer comme fait"
                    >
                      {t.statut === 'TERMINE' && <span className="text-paper text-[10px] leading-none">✓</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] ${t.statut === 'TERMINE' ? 'line-through text-grey' : 'text-ink'}`}>
                        {t.description}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-[9px] uppercase tracking-widest text-ocre-d">{t.assignee_nom}</span>
                        {t.notes && /timestamp=(\d+)/.test(t.notes) && (
                          <span className="font-mono text-[9px] text-grey">@{t.notes.match(/À ([0-9:]+)/)?.[1] ?? ''}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteTache(t)}
                      className="opacity-0 group-hover:opacity-100 font-mono text-[10px] text-rust hover:underline transition"
                      title="Supprimer">
                      suppr
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Résumé */}
          {md && (
            <section>
              <h3 className="font-mono text-[11px] uppercase tracking-[0.3em] text-ocre-d mb-3 pb-1 border-b border-ocre/30">
                Résumé
              </h3>
              <div className="prose prose-sm max-w-none text-ink" dangerouslySetInnerHTML={{ __html: htmlBlocks }} />
            </section>
          )}

          {!md && (
            <div className="font-serif italic text-grey text-center py-12">
              aucun résumé disponible pour cette réunion
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
