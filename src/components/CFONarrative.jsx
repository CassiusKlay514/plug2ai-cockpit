import NarrativeShell, { P, S } from './NarrativeShell.jsx'
import { formatEur } from '../lib/format.js'

// Mot du CFO — narration dynamique basée sur les KPIs réels
export default function CFONarrative({ data }) {
  const s = data?.synth
  if (!s) return null

  const debut = s.date_debut_activite
    ? new Date(s.date_debut_activite).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'juillet 2025'
  const moisEcoules = s.date_debut_activite
    ? Math.max(1, Math.round((Date.now() - new Date(s.date_debut_activite).getTime()) / (1000*60*60*24*30)))
    : 11
  const ca = Number(s.ca_ht_total) || 0
  const charges = Number(s.charges_ttc_total) || 0
  const resultat = ca - charges
  const positif = resultat >= 0
  const topClient = data.caParClient?.[0]
  const top3Charges = (data.chargesParCategorie ?? []).slice(0, 3)
  const concentration = topClient ? Math.round((Number(topClient.total_ht) / ca) * 100) : null

  return (
    <NarrativeShell role="CFO" title="LE MOT DU CFO" subtitle="finances · cash · risque">
      <P tag="activité">
        En {moisEcoules} mois depuis le <S>{debut}</S>, Plug2AI a généré <S>{formatEur(ca)}</S> de
        chiffre d'affaires HT, sur <S>{s.n_clients} clients signés</S>. La structure n'a reçu
        aucun apport personnel des fondateurs : seuls les <S>500 €</S> de capital social initial
        ont été déposés. Les remboursements de notes de frais (cartes pro réglées personnellement)
        sont les seuls flux sortants en faveur des associés.
      </P>

      <P tag="résultat">
        Le résultat net estimé est <strong className={`font-mono not-italic ${positif ? 'text-ink' : 'text-rust'}`}>
          {positif ? '+' : ''}{formatEur(resultat)}</strong> sur la période, soit{' '}
        <S>{formatEur(resultat / Math.max(moisEcoules, 1))}</S> en moyenne par mois.
        Le ratio charges / CA atteint <S>{Math.round((charges / ca) * 100)} %</S>,
        ce qui laisse une marge brute de {Math.round((1 - charges / ca) * 100)} % à investir,
        recruter, ou consolider.
      </P>

      {concentration !== null && concentration >= 50 && (
        <P tag="alerte" alert>
          Concentration critique : <strong className="font-mono not-italic text-rust">{concentration} % du CA</strong>{' '}
          provient d'un seul client, <S>{topClient.client}</S> ({formatEur(Number(topClient.total_ht))}).
          Sans diversification rapide, la fragilité de la trésorerie sera structurellement liée à ce compte.
        </P>
      )}

      {top3Charges.length > 0 && (
        <P tag="charges">
          Les trois plus gros postes de dépense sur la période sont{' '}
          <S>{top3Charges[0].categorie}</S> ({formatEur(Number(top3Charges[0].total_ttc))}, {top3Charges[0].n_ops} ops),
          <S> {top3Charges[1]?.categorie}</S> ({formatEur(Number(top3Charges[1]?.total_ttc))})
          et <S>{top3Charges[2]?.categorie}</S> ({formatEur(Number(top3Charges[2]?.total_ttc))}).
          L'outillage logiciel domine.
        </P>
      )}

      <P tag="recommandations">
        (1) diversifier la base client avant que la dépendance ne devienne fragilité,
        (2) auditer les abonnements SaaS pour rationaliser ~150-200 €/mois,
        (3) lisser les prélèvements pour éviter les rejets (6 rejets cumulés entre février et mai 2026),
        (4) constituer une réserve de trésorerie équivalente à 3 mois de charges courantes.
      </P>
    </NarrativeShell>
  )
}
