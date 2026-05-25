import useExecutiveData from '../lib/useExecutiveData.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CTONarrative from '../components/CTONarrative.jsx'
import { formatEur, formatEurShort, formatNumber } from '../lib/format.js'

export default function CTO() {
  const { data, loading, error } = useExecutiveData()
  const tools = data?.tools ?? []
  const monthly = data?.saasMonthly ?? 0
  const total3m = data?.saasTotal3m ?? 0
  const totalAllTime = tools.reduce((s, t) => s + t.total, 0)

  const isIA = (n) => /ChatGPT|Claude|Anthropic/.test(n)
  const isCode = (n) => /Replit|Lovable|Framer/.test(n)

  return (
    <main className="max-w-[1400px] mx-auto px-8 py-12 relative z-10">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="font-serif italic text-[15px] text-grey mb-3">
            module V · infrastructure · stack tech · coûts SaaS
          </p>
          <h1 className="font-title text-[72px] leading-[0.92] tracking-tight">INFRASTRUCTURE</h1>
        </div>
        <div className="font-mono text-[11px] uppercase tracking-widest text-grey">
          Planche · CTO
        </div>
      </div>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      <section className="mb-12">
        <CTONarrative data={data} />
      </section>

      <section className="grid grid-cols-4 gap-4 mb-12">
        <StatTile roman="I"   label="Coût SaaS / mois" value={formatEurShort(monthly)}
                  sub="moyenne 3 mois glissants" accent />
        <StatTile roman="II"  label="Outils récurrents" value={formatNumber(tools.length)}
                  sub="abonnements actifs" />
        <StatTile roman="III" label="Total SaaS cumulé" value={formatEurShort(totalAllTime)}
                  sub="depuis le début de l'activité" />
        <StatTile roman="IV"  label="Total SaaS 3 mois"  value={formatEurShort(total3m)}
                  sub="dépensé sur 90 derniers j" />
      </section>

      <section>
        <SectionTitle num="01" label="Catalogue des outils" hint={`${tools.length} abonnements`} />
        <div className="border border-ink/20">
          <div className="grid grid-cols-12 gap-3 font-mono text-[10px] uppercase tracking-widest text-grey px-4 py-2 border-b border-ink/20 bg-ink/5">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Outil</div>
            <div className="col-span-3">Famille</div>
            <div className="col-span-1 text-right">Ops</div>
            <div className="col-span-3 text-right">Total cumulé</div>
          </div>
          {tools.map((t, i) => {
            const family = isIA(t.nom)   ? 'IA générative'
                         : isCode(t.nom) ? 'Build & deploy'
                         : t.categorie ?? '—'
            return (
              <div key={t.nom} className="grid grid-cols-12 gap-3 px-4 py-2 border-b border-ink/10 text-sm hover:bg-ink/5">
                <div className="col-span-1 font-mono text-[11px] text-grey">{String(i+1).padStart(2,'0')}</div>
                <div className="col-span-4 font-medium">{t.nom}</div>
                <div className="col-span-3 text-[11px] text-grey">{family}</div>
                <div className="col-span-1 text-right font-mono text-[11px] text-grey">{t.n}</div>
                <div className="col-span-3 text-right font-mono">{formatEur(t.total)}</div>
              </div>
            )
          })}
        </div>
      </section>

      <footer className="mt-16 pt-4 border-t border-ink/30 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · cto · v.02</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
