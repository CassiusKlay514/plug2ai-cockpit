import NarrativeShell, { P, S } from './NarrativeShell.jsx'
import { formatEur } from '../lib/format.js'

export default function CEONarrative({ okrs, decisions, roadmap, synth }) {
  if (!okrs?.length) return null

  const trimestreCourant = okrs[0]?.trimestre ?? '2026-Q3'
  const okrsTrim = okrs.filter(o => o.trimestre === trimestreCourant)
  const atteint = okrsTrim.filter(o => o.statut === 'ATTEINT').length
  const total = okrsTrim.length
  const progress = total > 0
    ? Math.round(okrsTrim.reduce((s, o) => {
        const c = Number(o.cible) || 0
        const a = Number(o.actuel) || 0
        if (!c) return s
        return s + Math.min(100, Math.abs((a / c) * 100))
      }, 0) / total)
    : 0

  const decisionsRecentes = decisions?.slice(0, 3) ?? []
  const enCours = roadmap?.filter(r => r.statut === 'EN_COURS').length ?? 0
  const prevus = roadmap?.filter(r => r.statut === 'PREVU').length ?? 0

  return (
    <NarrativeShell role="CEO" title="LE MOT DU CEO" subtitle="vision · OKR · décisions">
      <P tag="cap">
        Plug2AI traverse une phase de structuration : <S>{total} OKR</S> définis pour {trimestreCourant},
        dont <S>{atteint} atteints</S> et un avancement moyen de <S>{progress} %</S>. La roadmap court
        sur deux trimestres avec <S>{enCours} chantiers en cours</S> et <S>{prevus} prévus</S>.
        L'agence est passée du mode « prouver qu'on peut livrer » à <S>industrialiser ce qui marche</S>{' '}
        — c'est le bon moment pour formaliser les décisions au lieu de les improviser.
      </P>

      <P tag="boussole">
        Le résultat net actuel ({synth ? formatEur(Number(synth.resultat_net_estime) || 0) : '…'})
        est <S>fragile</S> : 75 % du CA repose sur un seul client. Tant que la diversification n'est pas
        engagée, chaque décision stratégique doit être lue à l'aune de cette question :
        « est-ce que ça réduit la dépendance Balmont, ou est-ce que ça l'aggrave ? ».
        Les OKRs Q3 le reflètent : doubler le CA mensuel ET sortir de Balmont.
      </P>

      {decisionsRecentes.length > 0 && (
        <P tag="dernières décisions">
          {decisionsRecentes.map((d, i) => (
            <span key={d.id}>
              <S>{d.titre}</S> ({new Date(d.date_decision).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}){i < decisionsRecentes.length - 1 ? ', ' : '.'}
            </span>
          ))}{' '}
          Le journal de décisions est en place — il documente les arbitrages au moment où ils sont pris,
          au lieu de les retrouver péniblement dans les transcripts Fathom plus tard.
        </P>
      )}

      <P tag="recommandations">
        (1) <S>fermer chaque OKR sur 2 chiffres</S> : cible et actuel, mis à jour chaque semaine,
        (2) une décision stratégique par semaine documentée (même si simple),
        (3) la roadmap est l'outil de discipline : pas plus de 3 chantiers en parallèle,
        (4) chaque module CxO du cockpit doit alimenter un OKR pour rester pertinent.
      </P>
    </NarrativeShell>
  )
}
