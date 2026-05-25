import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { formatEur, formatEurShort, formatDate } from '../lib/format.js'
import KpiCard from '../components/KpiCard.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CFONarrative from '../components/CFONarrative.jsx'
import useExecutiveData from '../lib/useExecutiveData.js'

export default function CFO() {
  const { data, loading, error } = useExecutiveData()
  const kpis = data?.synth
  const topClients = data?.caParClient ?? []
  const topFournisseurs = data?.fournisseurs ?? []
  const recentTx = data?.transactions ?? []
  const [chargesParMois, setCharges] = useState([])

  useEffect(() => {
    supabase.from('charges_par_mois').select('*').limit(12)
      .then(({ data }) => setCharges(data ?? []))
  }, [])

  const maxCharge = useMemo(() => {
    if (chargesParMois.length === 0) return 0
    return Math.max(...chargesParMois.map(c => Number(c.total_ttc) || 0))
  }, [chargesParMois])

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">

      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module II · finances · cash · burn · risque
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">FINANCES</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CFO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* MOT DU CFO */}
      <section className="mb-12">
        <CFONarrative data={data} />
      </section>

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

      <section className="grid grid-cols-2 gap-10 mb-12">
        <div>
          <SectionTitle num="01" label="Top clients — CA HT" hint="cumul historique" />
          {loading && <div className="font-mono text-sm text-grey">…</div>}
          {topClients.slice(0, 10).map((c, i) => {
            const total = Number(c.total_ht) || 0
            const max = Math.max(...topClients.slice(0, 10).map(x => Number(x.total_ht) || 0)) || 1
            const pct = (total / max) * 100
            return (
              <div key={`${c.client}_${i}`} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{c.client}</span>
                    <span className="text-[11px] text-grey">· {c.n_factures} f.</span>
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

        <div>
          <SectionTitle num="02" label="Top fournisseurs récurrents" hint="≥ 2 opérations" />
          {topFournisseurs.slice(0, 12).map((f, i) => {
            const total = Number(f.total_paye_ttc) || 0
            const max = Math.max(...topFournisseurs.slice(0, 12).map(x => Number(x.total_paye_ttc) || 0)) || 1
            const pct = (total / max) * 100
            return (
              <div key={`${f.nom}_${i}`} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{f.nom}</span>
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

      {chargesParMois.length > 0 && (
        <section className="mb-12">
          <SectionTitle num="03" label="Évolution mensuelle des charges" hint={`${chargesParMois.length} mois`} />
          <div className="grid grid-cols-12 gap-1 items-end h-[120px]">
            {[...chargesParMois].reverse().map(m => {
              const total = Number(m.total_ttc) || 0
              const pct = (total / maxCharge) * 100
              const mois = new Date(m.mois).toLocaleDateString('fr-FR', { month: 'short' })
              return (
                <div key={m.mois} className="flex flex-col items-center gap-1 h-full justify-end">
                  <span className="font-mono text-[9px] text-grey">{formatEurShort(total)}</span>
                  <div className="w-full bg-ink" style={{ height: `${Math.max(pct, 2)}%` }} title={`${mois}: ${formatEur(total)}`} />
                  <span className="font-mono text-[9px] uppercase text-grey">{mois}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-12">
        <SectionTitle num="04" label="20 dernières opérations" hint="par date décroissante" />
        <div className="border border-ink/20">
          <div className="grid grid-cols-12 gap-3 font-mono text-[10px] uppercase tracking-widest text-grey px-4 py-2 border-b border-ink/20 bg-ink/5">
            <div className="col-span-1">Date</div>
            <div className="col-span-5">Intitulé</div>
            <div className="col-span-3">Catégorie</div>
            <div className="col-span-3 text-right">Montant TTC</div>
          </div>
          {recentTx.slice(0, 20).map(tx => {
            const v = Number(tx.montant_ttc) || 0
            const isRev = v > 0
            return (
              <div key={tx.id} className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-ink/10 text-sm hover:bg-ink/5">
                <div className="col-span-1 font-mono text-[11px]">{formatDate(tx.date_op)}</div>
                <div className="col-span-5 truncate">{tx.intitule}</div>
                <div className="col-span-3 text-[11px] text-grey truncate">{tx.categorie ?? '—'}</div>
                <div className={`col-span-3 text-right font-mono ${isRev ? 'text-ink font-medium' : 'text-grey'}`}>
                  {formatEur(v)}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · cfo · v.02</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
