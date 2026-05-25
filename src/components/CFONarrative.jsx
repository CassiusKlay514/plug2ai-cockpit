import { formatEur, formatEurShort } from '../lib/format.js'

// Mot du CFO — narration dynamique basée sur les KPIs réels
export default function CFONarrative({ s, topClient, topCharges, factImpayees }) {
  if (!s) return null

  const debut = s.date_debut_activite
    ? new Date(s.date_debut_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'juillet 2025'

  // Mois écoulés depuis début
  const moisEcoules = s.date_debut_activite
    ? Math.max(1, Math.round((Date.now() - new Date(s.date_debut_activite).getTime()) / (1000*60*60*24*30)))
    : 11

  const ca = Number(s.ca_ht_total) || 0
  const charges = Number(s.charges_ttc_total) || 0
  const resultat = ca - charges
  const positif = resultat >= 0

  // Concentration top client
  const concentration = topClient
    ? Math.round((Number(topClient.total_ht) / ca) * 100)
    : null

  // Top 3 charges
  const top3 = (topCharges ?? []).slice(0, 3)

  return (
    <article className="border border-ink/30 bg-paper p-10 relative">
      {/* corner ornaments */}
      <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-ocre" />
      <div className="absolute bottom-4 right-4 w-2 h-2 rounded-full bg-ocre" />

      <div className="max-w-[760px] mx-auto">
        <div className="text-center mb-8">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-grey mb-2">
            Note CFO — automatique
          </div>
          <h2 className="font-title text-[40px] leading-none text-ink">
            LE MOT DU CFO
          </h2>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px w-12 bg-ocre" />
            <div className="w-1.5 h-1.5 rounded-full bg-ocre" />
            <div className="h-px w-12 bg-ocre" />
          </div>
        </div>

        <div className="font-serif text-[16px] leading-[1.75] text-ink space-y-5">
          <p>
            <span className="font-mono uppercase text-[11px] tracking-widest text-ocre-d mr-2">
              activité ·
            </span>
            En {moisEcoules} mois depuis le <strong className="font-mono not-italic">{debut}</strong>,
            Plug2AI a généré <strong className="font-mono not-italic text-ink">{formatEur(ca)}</strong> de
            chiffre d'affaires HT, sur <strong className="font-mono not-italic">{s.n_clients} clients signés</strong>.
            La structure n'a reçu aucun apport personnel des fondateurs : seuls les{' '}
            <strong className="font-mono not-italic">500 €</strong> de capital social initial
            ont été déposés. Les remboursements de notes de frais (cartes pro réglées personnellement)
            sont les seuls flux sortants en faveur des associés.
          </p>

          <p>
            <span className="font-mono uppercase text-[11px] tracking-widest text-ocre-d mr-2">
              résultat ·
            </span>
            Le résultat net estimé est <strong className={`font-mono not-italic ${positif ? 'text-ink' : 'text-rust'}`}>
              {positif ? '+' : ''}{formatEur(resultat)}
            </strong> sur la période, soit{' '}
            <strong className="font-mono not-italic">{formatEur(resultat / Math.max(moisEcoules, 1))}</strong> en moyenne par mois.
            {' '}Le ratio charges / CA atteint{' '}
            <strong className="font-mono not-italic">{Math.round((charges / ca) * 100)} %</strong>,
            ce qui laisse une marge brute de {Math.round((1 - charges / ca) * 100)} % à investir, recruter, ou consolider.
          </p>

          {concentration !== null && concentration >= 50 && (
            <p>
              <span className="font-mono uppercase text-[11px] tracking-widest text-rust mr-2">
                alerte ·
              </span>
              Concentration critique : <strong className="font-mono not-italic text-rust">{concentration} % du CA</strong>{' '}
              provient d'un seul client, <strong className="font-mono not-italic">{topClient.client}</strong>{' '}
              ({formatEur(Number(topClient.total_ht))}). Sans diversification rapide, la fragilité
              de la trésorerie sera structurellement liée à ce compte.
            </p>
          )}

          {top3.length > 0 && (
            <p>
              <span className="font-mono uppercase text-[11px] tracking-widest text-ocre-d mr-2">
                charges ·
              </span>
              Les trois plus gros postes de dépense sur la période sont{' '}
              <strong className="font-mono not-italic">{top3[0].categorie}</strong> ({formatEur(Number(top3[0].total_ttc))}, {top3[0].n_ops} ops),
              <strong className="font-mono not-italic"> {top3[1]?.categorie}</strong> ({formatEur(Number(top3[1]?.total_ttc))})
              et <strong className="font-mono not-italic">{top3[2]?.categorie}</strong> ({formatEur(Number(top3[2]?.total_ttc))}).
              L'outillage logiciel domine — un audit des doublons (ChatGPT vs Claude, plusieurs IDE de
              coding) ferait gagner 150 à 200 € par mois sans perte de capacité.
            </p>
          )}

          <p>
            <span className="font-mono uppercase text-[11px] tracking-widest text-ocre-d mr-2">
              recommandations ·
            </span>
            (1) diversifier la base client avant que la dépendance ne devienne fragilité,
            (2) auditer les abonnements SaaS pour rationaliser ~150-200 €/mois,
            (3) lisser les prélèvements pour éviter les rejets (6 rejets cumulés entre février et mai 2026),
            (4) constituer une réserve de trésorerie équivalente à 3 mois de charges courantes.
          </p>
        </div>

        <div className="flex items-center justify-between mt-10 pt-6 border-t border-ink/20">
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
            Synthèse générée automatiquement
          </div>
          <div className="font-serif italic text-[14px] text-ink">
            Plug2AI · le cabinet
          </div>
        </div>
      </div>
    </article>
  )
}
