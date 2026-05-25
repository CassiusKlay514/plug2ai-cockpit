import NarrativeShell, { P, S } from './NarrativeShell.jsx'

export default function VeilleNarrative({ articles }) {
  if (!articles?.length) return null

  const total = articles.length
  const aiAct = articles.filter(a => a.categorie === 'AI_ACT').length
  const rgpd = articles.filter(a => a.categorie === 'RGPD').length
  const produits = articles.filter(a => a.categorie === 'ANNONCE_PRODUIT').length
  const aLire = articles.filter(a => !a.vu).length
  const pertinent = articles.filter(a => a.pertinent && !a.vu).length

  return (
    <NarrativeShell role="VEILLE" title="LE MOT DE LA VEILLE" subtitle="AI Act · RGPD · concurrence · produits">
      <P tag="périmètre">
        Plug2AI vend de l'IA à des structures régulées (CGP, avocats, conseil patrimonial).
        La conformité — <S>AI Act</S>, <S>RGPD</S>, NIS2 — n'est pas un bonus marketing : c'est{' '}
        <S>la condition d'achat</S>. Cette veille consigne ce qui sort, ce qui s'applique,
        et ce qui doit déclencher une action commerciale.
      </P>

      <P tag="signal">
        <S>{total} articles suivis</S>, dont <S>{aLire} à consulter</S> ({pertinent} marqués pertinents).
        Répartition : <S>{aiAct} sur l'AI Act</S>, {rgpd} sur le RGPD, <S>{produits} annonces produits</S>{' '}
        (Anthropic, OpenAI, Mistral, Hugging Face).
        Les modules satellites en place — le site jonathan-gomez-cyber, les agents de veille n8n —
        nourrissent cette table de manière semi-automatique.
      </P>

      <P tag="cas d'usage commercial">
        Chaque nouvelle régulation est un <S>argument de vente</S> à activer dans les 48 h auprès
        des prospects régulés (Wealth Mgmt, CGP, avocats). Le pattern qui marche : « Voici ce qui est
        sorti, voici ce que ça implique pour vous, voici ce qu'on déploie pour vous mettre en
        conformité avant le {new Date(Date.now() + 30*86400000).toLocaleDateString('fr-FR')} ».
      </P>

      <P tag="recommandations">
        (1) traiter au moins <S>1 article par semaine</S> en publication LinkedIn pour rester top of mind,
        (2) <S>2 articles par mois</S> en mail séquencé sur les segments wealth/CGP/avocats,
        (3) lier chaque article pertinent à <S>une action commerciale</S> (campagne, RDV, devis),
        (4) automatiser le RSS + tri par Claude (livré dans le sprint « auto-sync » de la roadmap).
      </P>
    </NarrativeShell>
  )
}
