import useExecutiveData from '../lib/useExecutiveData.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CMONarrative from '../components/CMONarrative.jsx'
import { formatNumber } from '../lib/format.js'

export default function CMO() {
  const { data, loading, error } = useExecutiveData()
  const contacts = data?.contacts ?? []
  const vagues = data?.vagues ?? []
  const cats = data?.categoriesContact ?? []

  const total = contacts.length
  const clients = contacts.filter(c => c.statut === 'CLIENT_SIGNE').length
  const chauds = contacts.filter(c => c.statut === 'PROSPECT_CHAUD').length
  const wealth = contacts.filter(c => c.statut === 'PROSPECT_WEALTH' || c.statut === 'PROSPECT_CGP').length
  const sectoriel = contacts.filter(c => c.statut === 'PROSPECT_SECTORIEL').length
  const bounced = contacts.filter(c => c.email_valide === false).length
  const conv = clients > 0 && total > 0 ? ((clients / total) * 100).toFixed(1) : '0'

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">

      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module III · acquisition · funnel · conversion
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">ACQUISITION</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CMO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <CMONarrative data={data} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-6">
        <StatTile roman="I"  label="Contacts totaux" value={formatNumber(total)} sub="pipeline tous statuts" />
        <StatTile roman="II" label="Taux conversion" value={`${conv} %`} sub="clients / contacts" accent />
        <StatTile roman="III" label="Prospects chauds" value={formatNumber(chauds)} sub="devis / RDV en cours" />
        <StatTile roman="IV"  label="Emails bouncés"   value={formatNumber(bounced)} sub="à requalifier" />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile label="Wealth + CGP" value={formatNumber(wealth)} sub="segment patrimoine" />
        <StatTile label="Sectoriels"  value={formatNumber(sectoriel)} sub="mailing tous secteurs" />
        <StatTile label="Vagues identifiées" value={formatNumber(vagues.length)} sub="campagnes documentées" />
        <StatTile label="Catégories cibles" value={formatNumber(cats.length)} sub="verticales adressées" />
      </section>

      <section className="grid grid-cols-2 gap-10">
        <div>
          <SectionTitle num="01" label="Vagues de campagne" hint="contacts générés" />
          {vagues.length === 0 && <div className="font-serif italic text-grey">aucune vague documentée</div>}
          {vagues.map((v, i) => {
            const max = vagues[0].total
            const pct = (v.total / max) * 100
            return (
              <div key={v.code} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{v.code}</span>
                  </div>
                  <div className="flex items-baseline gap-3 shrink-0 font-mono text-sm">
                    <span className="text-grey text-[11px]">{v.signes}c · {v.chauds}h</span>
                    <span>{v.total}</span>
                  </div>
                </div>
                <div className="h-[3px] bg-ink/10 relative overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>

        <div>
          <SectionTitle num="02" label="Catégories ciblées" hint="verticales adressées" />
          {cats.length === 0 && <div className="font-serif italic text-grey">aucune catégorie</div>}
          {cats.slice(0, 12).map((c, i) => {
            const max = cats[0].n
            const pct = (c.n / max) * 100
            return (
              <div key={c.categorie} className="py-2 border-b border-ink/10">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-[11px] text-grey w-5">{String(i+1).padStart(2,'0')}</span>
                    <span className="truncate font-medium">{c.categorie}</span>
                  </div>
                  <span className="font-mono text-sm">{c.n}</span>
                </div>
                <div className="h-[3px] bg-ocre/20 relative overflow-hidden">
                  <div className="h-full bg-ocre-d" style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · cmo · v.02</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
