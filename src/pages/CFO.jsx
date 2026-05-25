import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatEur, formatEurShort, formatDate, formatNumber } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'

export default function CFO() {
  const [kpis, setKpis]                 = useState(null)
  const [topClients, setTopClients]     = useState([])
  const [topFournisseurs, setTopFours]  = useState([])
  const [chargesParMois, setCharges]    = useState([])
  const [recentTx, setRecentTx]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoading(true)
      try {
        const [k, c, f, m, r] = await Promise.all([
          supabase.from('cfo_kpis').select('*').single(),
          supabase.from('ca_par_client').select('*').order('total_ht', { ascending: false, nullsFirst: false }).limit(10),
          supabase.from('fournisseurs').select('*').limit(12),
          supabase.from('charges_par_mois').select('*').limit(12),
          supabase.from('transactions')
            .select('id,date_op,type_op,intitule,montant_ttc,categorie,impact_compta,contact_id')
            .order('date_op', { ascending: false })
            .limit(20),
        ])
        if (!alive) return
        if (k.error) throw k.error
        if (c.error) throw c.error
        if (f.error) throw f.error
        if (m.error) throw m.error
        if (r.error) throw r.error
        setKpis(k.data)
        setTopClients(c.data ?? [])
        setTopFours(f.data ?? [])
        setCharges(m.data ?? [])
        setRecentTx(r.data ?? [])
      } catch (e) {
        setError(e.message ?? String(e))
      } finally {
        setLoading(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  // Calcule runway (mois de cash restant à burn rate constant)
  // À défaut de cash_position réel (pas branché), on estime sur charges récurrentes
  const maxCharge = useMemo(() => {
    if (chargesParMois.length === 0) return 0
    return Math.max(...chargesParMois.map(c => Number(c.total_ttc) || 0))
  }, [chargesParMois])

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-10 relative z-10">

      <div className="flex items-end justify-between mb-12">
        <div>
          <h1 className="font-title text-[68px] leading-none tracking-tight">
            FINANCES
          </h1>
          <p className="font-serif italic text-[15px] text-ink2 mt-3">
            module II · CFO · cash, burn, runway, clients, fournisseurs
          </p>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CFO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* KPI ROW */}
      <section className="grid grid-cols-4 gap-5 mb-12">
        <KpiCard roman="I"   label="CA HT cumulé"
                 value={kpis ? formatEurShort(kpis.ca_ht_total) : '…'}
                 sub={kpis ? `TTC ${formatEurShort(kpis.ca_ttc_total)}` : ''} />
        <KpiCard roman="II"  label="CA 30 derniers j."
                 value={kpis ? formatEurShort(kpis.ca_30j ?? 0) : '…'}
                 sub="encaissements HT récents" />
        <KpiCard roman="III" label="Charges cumulées"
                 value={kpis ? formatEurShort(kpis.charges_ttc_total) : '…'}
                 sub={kpis ? `dernière op. ${formatDate(kpis.derniere_op)}` : ''} />
        <KpiCard roman="IV"  label="Burn 30 derniers j."
                 value={kpis ? formatEurShort(kpis.charges_30j ?? 0) : '…'}
                 sub="rythme de dépense récent" />
      </section>

      {/* GRID 2 colonnes : Top clients + Top fournisseurs */}
      <section className="grid grid-cols-2 gap-10 mb-12">

        {/* TOP CLIENTS */}
        <div>
          <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 01 · Top clients — CA HT</h2>
            <span className="font-serif italic text-[12px] text-grey">cumul historique</span>
          </div>
          {loading && <div className="font-mono text-sm text-grey">…</div>}
          {!loading && topClients.length === 0 && (
            <div className="font-serif italic text-grey">aucun client identifié</div>
          )}
          {topClients.map((c, i) => {
            const total = Number(c.total_ht) || 0
            const max = Math.max(...topClients.map(x => Number(x.total_ht) || 0)) || 1
            const pct = (total / max) * 100
            return (
              <div key={`${c.client}_${i}`} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{c.client}</span>
                    <span className="text-[11px] text-grey">· {c.n_factures} facture{c.n_factures > 1 ? 's' : ''}</span>
                  </div>
                  <span className="font-mono text-sm shrink-0">{formatEur(total)}</span>
                </div>
                <div className="h-[3px] bg-ink/10 relative overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* TOP FOURNISSEURS */}
        <div>
          <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
            <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 02 · Top fournisseurs récurrents</h2>
            <span className="font-serif italic text-[12px] text-grey">≥ 2 opérations</span>
          </div>
          {loading && <div className="font-mono text-sm text-grey">…</div>}
          {topFournisseurs.map((f, i) => {
            const total = Number(f.total_paye_ttc) || 0
            const max = Math.max(...topFournisseurs.map(x => Number(x.total_paye_ttc) || 0)) || 1
            const pct = (total / max) * 100
            return (
              <div key={`${f.nom}_${i}`} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{f.nom}</span>
                    {f.categorie && <span className="text-[11px] text-grey truncate">· {f.categorie}</span>}
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0">
                    <span className="font-mono text-[11px] text-grey">{f.n_transactions} ops</span>
                    <span className="font-mono text-sm">{formatEur(total)}</span>
                  </div>
                </div>
                <div className="h-[3px] bg-ocre/20 relative overflow-hidden">
                  <div className="h-full bg-ocre-d" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* CHARGES PAR MOIS */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 03 · Évolution mensuelle des charges</h2>
          <span className="font-serif italic text-[12px] text-grey">{chargesParMois.length} mois</span>
        </div>
        <div className="grid grid-cols-12 gap-1 items-end h-[120px]">
          {[...chargesParMois].reverse().map(m => {
            const total = Number(m.total_ttc) || 0
            const pct = (total / maxCharge) * 100
            const mois = new Date(m.mois).toLocaleDateString('fr-FR', { month: 'short' })
            return (
              <div key={m.mois} className="flex flex-col items-center gap-1 h-full justify-end">
                <span className="font-mono text-[9px] text-grey">{formatEurShort(total)}</span>
                <div
                  className="w-full bg-ink"
                  style={{ height: `${Math.max(pct, 2)}%` }}
                  title={`${mois} : ${formatEur(total)}`}
                />
                <span className="font-mono text-[9px] uppercase text-grey">{mois}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* TRANSACTIONS RECENTES */}
      <section>
        <div className="flex items-baseline justify-between mb-4 border-b border-ink/30 pb-2">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.3em]">§ 04 · 20 dernières opérations</h2>
          <span className="font-serif italic text-[12px] text-grey">par date décroissante</span>
        </div>
        <div className="border border-ink/20">
          <div className="grid grid-cols-12 gap-3 font-mono text-[10px] uppercase tracking-widest text-grey px-4 py-2 border-b border-ink/20 bg-ink/5">
            <div className="col-span-1">Date</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-5">Intitulé</div>
            <div className="col-span-2">Catégorie</div>
            <div className="col-span-2 text-right">Montant TTC</div>
          </div>
          {recentTx.map(tx => {
            const v = Number(tx.montant_ttc) || 0
            const isRev = v > 0
            return (
              <div key={tx.id} className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-ink/10 text-sm hover:bg-ink/5">
                <div className="col-span-1 font-mono text-[11px]">{formatDate(tx.date_op)}</div>
                <div className="col-span-2 font-mono text-[11px] text-grey">{tx.type_op}</div>
                <div className="col-span-5 truncate">{tx.intitule}</div>
                <div className="col-span-2 text-[11px] text-grey truncate">{tx.categorie ?? '—'}</div>
                <div className={`col-span-2 text-right font-mono ${isRev ? 'text-ink font-medium' : 'text-grey'}`}>
                  {formatEur(v)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · cfo · v.01</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
