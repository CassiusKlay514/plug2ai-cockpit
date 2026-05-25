import useExecutiveData from '../lib/useExecutiveData.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import COONarrative from '../components/COONarrative.jsx'
import { formatEur, formatEurShort, formatNumber, formatDate } from '../lib/format.js'

export default function COO() {
  const { data, loading, error } = useExecutiveData()
  const clients = data?.clientsSignes ?? []
  const fact = data?.factures ?? []
  const ca = (data?.caParClient ?? []).filter(c => c.client !== 'Inconnu')

  const total = fact.reduce((s,f) => s + Number(f.montant_eur || 0), 0)
  const payees = fact.filter(f => f.statut === 'PAYEE').length
  const emises = fact.filter(f => f.statut === 'EMISE' || f.statut === 'IMPAYEE').length
  const moyenne = fact.length > 0 ? total / fact.length : 0

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module IV · opérations · livraison · capacité équipe
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">OPÉRATIONS</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · COO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <COONarrative data={data} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <StatTile roman="I"   label="Clients signés"    value={formatNumber(clients.length)} sub="missions à livrer" accent />
        <StatTile roman="II"  label="Factures émises"    value={formatNumber(fact.length)} sub={`${payees} encaissées · ${emises} en cours`} />
        <StatTile roman="III" label="Total facturé TTC"  value={formatEurShort(total)} sub="cumul historique" />
        <StatTile roman="IV"  label="Facture moyenne"    value={formatEurShort(moyenne)} sub="ticket moyen TTC" />
      </section>

      <section className="grid grid-cols-2 gap-10 mb-12">
        <div>
          <SectionTitle num="01" label="Clients en production" hint="par CA HT cumulé" />
          {ca.slice(0, 10).map((c, i) => {
            const max = Number(ca[0]?.total_ht) || 1
            const pct = (Number(c.total_ht) / max) * 100
            return (
              <div key={c.client} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{c.client}</span>
                    <span className="text-[11px] text-grey">· {c.n_factures} f.</span>
                  </div>
                  <span className="font-mono text-sm">{formatEur(Number(c.total_ht))}</span>
                </div>
                <div className="h-[3px] bg-ink/10 relative overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <SectionTitle num="02" label="Factures récentes" hint={`${fact.length} émises`} />
          {fact.slice(0, 12).sort((a,b) => new Date(b.date_emission) - new Date(a.date_emission)).map(f => (
            <div key={f.id} className="py-2 border-b border-ink/10 flex items-center justify-between">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="font-mono text-[11px] text-grey">{formatDate(f.date_emission)}</span>
                <span className="font-medium truncate">{f.numero ?? '—'}</span>
              </div>
              <div className="flex items-baseline gap-3 shrink-0">
                <span className={`font-mono text-[10px] uppercase tracking-widest ${f.statut === 'PAYEE' ? 'text-ink' : 'text-ocre-d'}`}>
                  {f.statut}
                </span>
                <span className="font-mono text-sm">{formatEur(Number(f.montant_eur))}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · coo · v.02</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
