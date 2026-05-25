import NarrativeShell, { P, S } from './NarrativeShell.jsx'

export default function ConnaissanceNarrative({ agents, kbs, postmortems }) {
  if (!agents?.length && !kbs?.length) return null

  const nAgents    = agents?.length ?? 0
  const reusables  = agents?.filter(a => a.reusable).length ?? 0
  const prod       = agents?.filter(a => a.statut === 'PRODUCTION').length ?? 0
  const nKbs       = kbs?.length ?? 0
  const kbsReuse   = kbs?.filter(k => k.reusable).length ?? 0
  const nPostmortem = postmortems?.length ?? 0

  return (
    <NarrativeShell role="CKO" title="LE MOT DU CAPITAL CONNAISSANCE" subtitle="agents · knowledge bases · postmortems">
      <P tag="capital">
        Une agence IA ne se mesure pas qu'à son CA — elle se mesure à <S>ce qu'elle peut réutiliser</S>{' '}
        d'un client à l'autre sans tout recommencer. Plug2AI a aujourd'hui{' '}
        <S>{nAgents} agents documentés</S> (dont <S>{prod} en production</S> et {reusables} réutilisables),{' '}
        <S>{nKbs} knowledge bases</S> ({kbsReuse} mutualisables), et <S>{nPostmortem} postmortems</S>.
        C'est le vrai actif de l'entreprise : sans ça, chaque nouveau client = un projet from scratch.
      </P>

      <P tag="industrialisation">
        Les agents les plus rentables sont ceux qui se redéploient : <S>Agent SEO Balmont</S>,{' '}
        <S>Agent Prospection CGP</S>, <S>Agent Audit IA</S>. Ces trois-là couvrent déjà 60 % des cas
        commerciaux de l'agence. L'objectif Q3 doit être de <S>packager au moins 3 agents en offre
        produit</S> vendable « plug & play » avec un setup minimal — c'est le chemin vers une marge
        non linéaire.
      </P>

      {nPostmortem > 0 && (
        <P tag="apprentissages">
          Les postmortems disponibles (Balmont Phase 2, démarrage Rank-Up) confirment deux schémas :
          <S> scoper la messagerie séparément</S> (WhatsApp Business, plateformes externes), et{' '}
          <S>fixer l'accès infra dès le contrat</S> (VPS, credentials Meta).
          Ces leçons doivent être codifiées dans le contrat-type avant la prochaine signature.
        </P>
      )}

      <P tag="recommandations">
        (1) chaque projet livré déclenche <S>1 postmortem</S> obligatoire (~30 min, format léger),
        (2) chaque agent en production a un <S>prompt versionné</S> + au moins 1 ré-utilisation
        documentée,
        (3) <S>1 knowledge base par segment</S> mutualisable (CGP, avocats, retail) — c'est le
        socle d'un futur produit SaaS Plug2AI,
        (4) publier <S>3 agents en open source</S> ou démo publique pour générer du flux entrant.
      </P>
    </NarrativeShell>
  )
}
