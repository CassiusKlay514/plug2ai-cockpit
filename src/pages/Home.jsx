import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatEur, formatEurShort, formatNumber, formatDate } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CFONarrative from '../components/CFONarrative.jsx'

export default function Home({ onNavigate }) {
  const [synth, setSynth]       = useState(null)
  const [topClient, setTopCli]  = useState(null)
  const [topCharges, setCharg]  = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const [s, c, ch] = await Promise.all([
          supabase.from('synthese_globale').select('*').single(),
          supabase.from('ca_par_client').select('*').order('total_ht', { ascending: false, nullsFirst: false }).limit(1),
          supabase.from('charges_par_categorie').select('*').limit(8),
        ])
        if (!alive) return
        if (s.error) throw s.error
        if (c.error) throw c.error
        if (ch.error) throw ch.error
        setSynth(s.data)
        setTopCli(c.data?.[0] ?? null)
        setCharg(ch.data ?? [])
      } catch (e) {
        setError(e.message ?? String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">

      {/* HERO */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <p className="font-serif italic text-[15px] text-grey">
            tableau de gouvernance · une page pour tout voir
          </p>
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
            mise à jour {synth?.derniere_op ? formatDate(synth.derniere_op) : '…'}
          </div>
        </div>
        <h1 className="font-title text-[88px] leading-[0.92] tracking-tight">
          ÉTAT DU<br/>
          <span className="text-ocre-d">CABINET</span>
        </h1>
        <p className="font-serif italic text-[17px] text-ink/80 mt-6 max-w-[700px]">
          Plug2AI en chiffres réels, lus directement depuis la base bancaire et le CRM.
          Cliquez sur une tuile pour entrer dans le détail.
        </p>
      </section>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* GRID stats principales */}
      <section className="grid grid-cols-4 gap-4 mb-8">
        <StatTile
          roman="I"
          label="Contacts"
          value={synth ? formatNumber(synth.n_contacts) : '…'}
          sub={synth ? `${synth.n_clients} clients · ${synth.n_prospects} prospects` : ''}
          onClick={() => onNavigate('crm')}
        />
        <StatTile
          roman="II"
          label="Clients signés"
          value={synth ? formatNumber(synth.n_clients) : '…'}
          sub={synth ? `${synth.n_prospects_chauds} prospects chauds` : ''}
          onClick={() => onNavigate('crm')}
          accent
        />
        <StatTile
          roman="III"
          label="CA HT cumulé"
          value={synth ? formatEurShort(synth.ca_ht_total) : '…'}
          sub={synth ? `TTC ${formatEurShort(synth.ca_ttc_total)} · ${synth.n_factures} factures` : ''}
          onClick={() => onNavigate('cfo')}
        />
        <StatTile
          roman="IV"
          label="Charges cumulées"
          value={synth ? formatEurShort(synth.charges_ttc_total) : '…'}
          sub={synth ? `dernière op. ${formatDate(synth.derniere_op)}` : ''}
          onClick={() => onNavigate('cfo')}
        />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-16">
        <StatTile
          label="Résultat net estimé"
          value={synth ? formatEurShort(synth.resultat_net_estime ?? 0) : '…'}
          sub="CA HT − charges TTC"
          accent={synth && Number(synth.resultat_net_estime) > 0}
        />
        <StatTile
          label="Burn 30 derniers j."
          value={synth ? formatEurShort(synth.charges_30j ?? 0) : '…'}
          sub="rythme de dépense"
        />
        <StatTile
          label="Encaissements 30 j."
          value={synth ? formatEurShort(synth.ca_30j ?? 0) : '…'}
          sub="virements et Stripe"
        />
        <StatTile
          label="Activité depuis"
          value={synth?.date_debut_activite
            ? new Date(synth.date_debut_activite).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
            : '…'}
          sub="premier mouvement bancaire"
        />
      </section>

      {/* MOT DU CFO */}
      <section className="mb-16">
        <CFONarrative s={synth} topClient={topClient} topCharges={topCharges} />
      </section>

      {/* RACCOURCIS */}
      <section className="mb-12">
        <SectionTitle num="01" label="Raccourcis" hint="entrer dans le détail" />
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => onNavigate('crm')}
            className="text-left p-6 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-all group"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-grey mb-2">Module I</div>
            <div className="font-title text-[28px] leading-none mb-2 group-hover:text-ocre-d transition-colors">CRM</div>
            <div className="font-serif italic text-[14px] text-ink2">
              voir, filtrer, ajouter ou modifier les contacts du pipeline
            </div>
          </button>
          <button
            onClick={() => onNavigate('cfo')}
            className="text-left p-6 border border-ink/20 hover:border-ink hover:bg-ink/5 transition-all group"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-grey mb-2">Module II</div>
            <div className="font-title text-[28px] leading-none mb-2 group-hover:text-ocre-d transition-colors">CFO</div>
            <div className="font-serif italic text-[14px] text-ink2">
              clients, fournisseurs, transactions et évolution mensuelle
            </div>
          </button>
          <div className="text-left p-6 border border-dashed border-ink/20 opacity-50">
            <div className="font-mono text-[10px] uppercase tracking-widest text-grey mb-2">Modules à venir</div>
            <div className="font-title text-[28px] leading-none mb-2">CMO · COO</div>
            <div className="font-serif italic text-[14px] text-grey">
              acquisition, opérations, automatisations
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-20 pt-4 border-t border-ink/20 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · v.02 · accueil</span>
        <span>« ce qui n'est pas mesuré ne peut être gouverné »</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
