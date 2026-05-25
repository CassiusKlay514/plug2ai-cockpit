import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { STATUTS } from '../lib/statuts.js'
import { formatDate } from '../lib/format.js'

const EMPTY = {
  prenom: '', nom: '', societe: '', fonction: '',
  email: '', telephone: '', linkedin_url: '',
  statut: 'PROSPECT_FROID', categorie: '', vague_campagne: '',
  score: 0, email_valide: true,
  notes: '', action_suivante: '',
}

export default function ContactDrawer({ contact, open, onClose, onSaved }) {
  const isNew = !contact?.id
  const [form, setForm]       = useState(EMPTY)
  const [interactions, setIx] = useState([])
  const [saving, setSaving]   = useState(false)
  const [err, setErr]         = useState(null)

  useEffect(() => {
    if (!open) return
    if (isNew) {
      setForm(EMPTY)
      setIx([])
      return
    }
    setForm({ ...EMPTY, ...contact })
    // charge interactions
    supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contact.id)
      .order('date_event', { ascending: false })
      .limit(20)
      .then(({ data }) => setIx(data ?? []))
  }, [open, contact, isNew])

  if (!open) return null

  function patch(k, v) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function save() {
    setSaving(true); setErr(null)
    try {
      // nettoyage : convertir '' → null pour les colonnes optionnelles
      const payload = { ...form }
      ;['prenom','nom','societe','fonction','email','telephone','linkedin_url',
        'categorie','vague_campagne','notes','action_suivante'].forEach(k => {
        if (payload[k] === '') payload[k] = null
      })
      payload.score = Number(payload.score) || 0

      let res
      if (isNew) {
        // pas d'id ni created_at/updated_at à envoyer
        const { id, created_at, updated_at, ...insert } = payload
        res = await supabase.from('contacts').insert(insert).select().single()
      } else {
        const { id, created_at, updated_at, ...update } = payload
        res = await supabase.from('contacts').update(update).eq('id', contact.id).select().single()
      }
      if (res.error) throw res.error
      onSaved?.(res.data)
      onClose?.()
    } catch (e) {
      setErr(e.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (isNew) { onClose?.(); return }
    if (!window.confirm(`Supprimer définitivement ${form.prenom ?? ''} ${form.nom ?? ''} ${form.societe ?? ''} ?`)) return
    setSaving(true); setErr(null)
    try {
      const { error } = await supabase.from('contacts').delete().eq('id', contact.id)
      if (error) throw error
      onSaved?.(null)
      onClose?.()
    } catch (e) {
      setErr(e.message ?? String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <aside className="w-[560px] bg-paper border-l border-ink shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-ink/20 sticky top-0 bg-paper z-10 flex items-center justify-between">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
              {isNew ? 'Nouveau contact' : 'Édition contact'}
            </div>
            <h2 className="font-title text-[28px] leading-none mt-1">
              {isNew ? 'À RENSEIGNER' : (
                [form.prenom, form.nom].filter(Boolean).join(' ') || form.societe || '—'
              )}
            </h2>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 border border-ink/30 hover:border-ink flex items-center justify-center font-mono text-lg leading-none">
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {err && <div className="font-mono text-sm text-rust border border-rust/40 bg-rust/5 p-3">Erreur : {err}</div>}

          <Section title="Identité">
            <Two>
              <Field label="Prénom" value={form.prenom ?? ''} onChange={v => patch('prenom', v)} />
              <Field label="Nom" value={form.nom ?? ''} onChange={v => patch('nom', v)} />
            </Two>
            <Field label="Société" value={form.societe ?? ''} onChange={v => patch('societe', v)} />
            <Field label="Fonction" value={form.fonction ?? ''} onChange={v => patch('fonction', v)} />
          </Section>

          <Section title="Contact">
            <Field label="Email" type="email" value={form.email ?? ''} onChange={v => patch('email', v)} />
            <Two>
              <Field label="Téléphone" value={form.telephone ?? ''} onChange={v => patch('telephone', v)} />
              <Field label="LinkedIn URL" value={form.linkedin_url ?? ''} onChange={v => patch('linkedin_url', v)} />
            </Two>
            <Toggle label="Email valide (non bouncé)"
              value={form.email_valide} onChange={v => patch('email_valide', v)} />
          </Section>

          <Section title="Pipeline">
            <Field
              label="Statut" as="select"
              value={form.statut}
              onChange={v => patch('statut', v)}
              options={STATUTS.map(s => ({ value: s.code, label: s.label }))}
            />
            <Two>
              <Field label="Catégorie" value={form.categorie ?? ''} onChange={v => patch('categorie', v)} />
              <Field label="Vague campagne" value={form.vague_campagne ?? ''} onChange={v => patch('vague_campagne', v)} />
            </Two>
            <Field label="Score (0-100)" type="number" value={form.score ?? 0} onChange={v => patch('score', v)} />
          </Section>

          <Section title="Notes & action">
            <Field label="Notes" as="textarea" value={form.notes ?? ''} onChange={v => patch('notes', v)} />
            <Field label="Action suivante" value={form.action_suivante ?? ''} onChange={v => patch('action_suivante', v)} />
          </Section>

          {!isNew && interactions.length > 0 && (
            <Section title={`Historique · ${interactions.length} interactions`}>
              <ul className="space-y-1 text-sm">
                {interactions.map(ix => (
                  <li key={ix.id} className="border-b border-ink/10 py-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-grey">{ix.type}</span>
                      <span className="font-mono text-[11px] text-grey">{formatDate(ix.date_event)}</span>
                    </div>
                    {ix.sujet && <div className="text-ink mt-0.5">{ix.sujet}</div>}
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>

        <div className="sticky bottom-0 bg-paper border-t border-ink/20 p-4 flex items-center justify-between gap-3">
          {!isNew ? (
            <button onClick={remove} disabled={saving}
              className="px-4 py-2 font-mono text-[11px] uppercase tracking-widest border border-rust/40 text-rust hover:bg-rust hover:text-paper transition">
              Supprimer
            </button>
          ) : <div />}
          <div className="flex gap-3">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2 font-mono text-[11px] uppercase tracking-widest border border-ink/30 hover:border-ink transition">
              Annuler
            </button>
            <button onClick={save} disabled={saving}
              className="px-5 py-2 font-mono text-[11px] uppercase tracking-widest bg-ink text-paper hover:bg-ocre-d transition">
              {saving ? '...' : (isNew ? 'Créer' : 'Enregistrer')}
            </button>
          </div>
        </div>
      </aside>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-mono text-[10px] uppercase tracking-[0.25em] text-ocre-d mb-3 pb-1 border-b border-ocre/30">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Two({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Field({ label, value, onChange, type = 'text', as = 'input', options }) {
  const baseCls = 'w-full bg-transparent border-b border-ink/30 focus:border-ink py-1.5 outline-none font-sans text-sm'
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-widest text-grey mb-1">{label}</span>
      {as === 'textarea' ? (
        <textarea
          rows={3}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={baseCls + ' resize-y border rounded-none px-2 py-2'}
        />
      ) : as === 'select' ? (
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className={baseCls + ' appearance-none px-1'}
        >
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={baseCls}
        />
      )}
    </label>
  )
}

function Toggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-9 h-5 rounded-full transition ${value ? 'bg-ink' : 'bg-ink/20'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-paper rounded-full transition-transform ${value ? 'translate-x-4' : ''}`} />
      </button>
      <span className="font-mono text-[11px] uppercase tracking-widest text-ink">{label}</span>
    </label>
  )
}
