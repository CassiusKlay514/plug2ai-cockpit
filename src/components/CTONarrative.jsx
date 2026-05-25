import NarrativeShell, { P, S } from './NarrativeShell.jsx'
import { formatEur } from '../lib/format.js'

// Mot du CTO — stack tech, coûts SaaS, doublons
export default function CTONarrative({ data }) {
  const tools = data?.tools ?? []
  const monthly = data?.saasMonthly ?? 0
  if (tools.length === 0) return null

  const ia = tools.filter(t => /ChatGPT|Claude|Anthropic/.test(t.nom))
  const code = tools.filter(t => /Replit|Lovable|Framer/.test(t.nom))
  const orch = tools.filter(t => /n8n|Codeur|Supabase|Fathom/.test(t.nom))

  const totalIA = ia.reduce((s, t) => s + t.total, 0)
  const top5 = tools.slice(0, 5)

  return (
    <NarrativeShell role="CTO" title="LE MOT DU CTO" subtitle="stack · coûts · doublons">
      <P tag="empilement">
        Plug2AI consomme aujourd'hui environ <S>{formatEur(monthly)} par mois</S> en logiciels SaaS
        récurrents (moyenne 3 mois glissants). Le stack est dense pour une équipe de cette taille :
        les cinq plus gros postes sont{' '}
        {top5.map((t, i) => (
          <span key={t.nom}>
            <S>{t.nom}</S> ({formatEur(t.total)}{i < top5.length - 1 ? '), ' : ').'}
          </span>
        ))}{' '}
        Pour une agence IA de 2 fondateurs, c'est cohérent mais perfectible.
      </P>

      <P tag="ia générative">
        Les abonnements IA générative pèsent <S>{formatEur(totalIA)}</S> cumulés en une période
        glissante, soit <S>~200-280 €/mois</S>. La présence simultanée de{' '}
        <S>ChatGPT Plus</S> et <S>Claude Pro</S> est un doublon classique : à ce volume,
        passer un seul des deux sur API (Anthropic ou OpenAI) coûterait <S>moins de 30 €/mois</S>{' '}
        pour la même puissance, avec en bonus l'intégration possible dans le cockpit lui-même
        (le « Mot du CFO » dynamique, le scoring contacts, la veille).
      </P>

      <P tag="coding & no-code">
        La présence simultanée de <S>Lovable</S>, <S>Replit</S> et <S>Framer</S> (~120 €/mois cumulés)
        couvre trois usages distincts : prototypage front (Lovable), exécution code (Replit),
        site marketing (Framer). C'est un confort mais aussi une fragmentation de la connaissance :
        ce qui est construit sur Lovable n'est pas trivial à reprendre sur Replit, et inversement.
      </P>

      <P tag="infrastructure">
        Le socle technique est sain : <S>Supabase</S> (~21 €/mois) en base unique, <S>n8n cloud</S>{' '}
        (~29 €/mois) en orchestrateur, <S>Vercel</S> pour le déploiement. C'est exactement la stack
        recommandée pour une agence IA solo/duo. Le bottleneck est la dispersion des outils en amont,
        pas l'infra.
      </P>

      <P tag="recommandations">
        (1) <S>arbitrer ChatGPT vs Claude</S> et migrer sur API pour économiser ~150 €/mois,
        (2) consolider Lovable + Replit en gardant celui qui sert le plus le delivery client,
        (3) brancher Claude API au cockpit pour <S>générer dynamiquement les « mots des CxO »</S>{' '}
        à chaque chargement (vraie analyse, plus contexte injecté),
        (4) ajouter <S>Stripe API</S> en webhook pour récupérer les paiements en temps réel
        sans CSV manuel.
      </P>
    </NarrativeShell>
  )
}
