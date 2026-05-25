import { useState } from 'react'
import { supabase } from '../lib/supabase.js'

export default function TaskQuickAdd({ assignees, onAdded }) {
  const [open, setOpen]         = useState(false)
  const [desc, setDesc]         = useState('')
  const [assignee, setAssignee] = useState('Jonathan Gomez')
  const [saving, setSaving]     = useState(false)

  async function save() {
    if (!desc.trim()) return
    setSaving(true)
    const { error } = await supabase.from('taches').insert({
      description: desc.trim(),
      assignee_nom: assignee,
      statut: 'A_FAIRE',
      source: 'manuelle',
    })
    setSaving(false)
    if (!error) {
      setDesc('')
      setOpen(false)
      onAdded?.()
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border border-ink/30 hover:border-ink hover:bg-ink/5 transition">
        <span className="text-ocre-d mr-1">+</span> Nouvelle tâche
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 border border-ink p-2 bg-paper">
      <input
        autoFocus
        value={desc}
        onChange={e => setDesc(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setOpen(false) }}
        placeholder="Description de la tâche…"
        className="bg-transparent border-b border-ink/30 focus:border-ink py-1 outline-none font-sans text-sm flex-1"
      />
      <select
        value={assignee}
        onChange={e => setAssignee(e.target.value)}
        className="font-mono text-[11px] uppercase tracking-widest bg-paper border-b border-ink/30 py-1 outline-none"
      >
        {assignees.map(a => <option key={a} value={a}>{a}</option>)}
      </select>
      <button onClick={save} disabled={saving || !desc.trim()}
        className="font-mono text-[11px] uppercase tracking-widest bg-ink text-paper px-3 py-1 hover:bg-ocre-d transition disabled:opacity-30">
        Ajouter
      </button>
      <button onClick={() => setOpen(false)}
        className="font-mono text-[11px] uppercase tracking-widest border border-ink/30 px-2 py-1 hover:border-ink">
        Annuler
      </button>
    </div>
  )
}
