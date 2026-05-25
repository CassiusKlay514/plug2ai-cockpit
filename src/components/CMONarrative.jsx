import NarrativeShell, { P, S } from './NarrativeShell.jsx'
import { formatEur } from '../lib/format.js'

// Mot du CMO — acquisition, funnel, campagnes
export default function CMONarrative({ data }) {
  const c = data?.contacts ?? []
  if (c.length === 0) return null

  const total      = c.length
  const clients    = c.filter(x => x.statut === 'CLIENT_SIGNE').length
  const chauds     = c.filter(x => x.statut === 'PROSPECT_CHAUD').length
  const prospects  = c.filter(x => x.statut?.startsWith('PROSPECT_')).length
  const bounced    = c.filter(x => x.email_valide === false).length
  const conversion = prospects > 0 ? ((clients / (clients + prospects)) * 100).toFixed(1) : '0'

  const topCats = (data.categoriesContact ?? []).slice(0, 3)
  const topVagues = (data.vagues ?? []).slice(0, 3)
  const wealth = c.filter(x => x.statut === 'PROSPECT_WEALTH').length
  const cgp = c.filter(x => x.statut === 'PROSPECT_CGP').length

  return (
    <NarrativeShell role="CMO" title="LE MOT DU CMO" subtitle="acquisition · funnel · conversion">
      <P tag="pipeline">
        Sur les <S>{total} contacts</S> de la base, <S>{prospects} sont en prospection active</S>{' '}
        et <S>{clients} clients ont signé</S>. Le taux de conversion brut prospect → client atteint
        <S> {conversion} %</S>, ce qui place Plug2AI dans la moyenne basse d'une agence B2B,
        mais reste cohérent avec une approche email à froid sur des verticales très exigeantes
        (CGP, wealth management, conseil régulé).
      </P>

      <P tag="segments">
        Les trois principaux segments adressés sont{' '}
        {topCats.length > 0 ? (
          <>
            <S>{topCats[0]?.categorie}</S> ({topCats[0]?.n} contacts),{' '}
            <S>{topCats[1]?.categorie}</S> ({topCats[1]?.n}),{' '}
            <S>{topCats[2]?.categorie}</S> ({topCats[2]?.n}).
          </>
        ) : 'à requalifier dans la base.'}{' '}
        La concentration sur le verticale wealth/CGP est marquée :{' '}
        <S>{wealth + cgp} contacts</S> sur ce segment ({Math.round((wealth + cgp) / total * 100)} % de la base),
        avec un cycle de vente long et des contraintes réglementaires fortes (AMF, AI Act, RGPD)
        qui justifient le positionnement « conformité IA » du discours commercial.
      </P>

      <P tag="campagnes">
        {topVagues.length > 0 ? (
          <>
            Les vagues identifiées dans la base sont menées par{' '}
            <S>{topVagues[0].code}</S> ({topVagues[0].total} contacts, {topVagues[0].signes} signés, {topVagues[0].chauds} chauds),{' '}
            <S>{topVagues[1]?.code}</S> ({topVagues[1]?.total}) et{' '}
            <S>{topVagues[2]?.code}</S> ({topVagues[2]?.total}).
          </>
        ) : 'À documenter pour suivre les campagnes.'}{' '}
        Plusieurs autres campagnes récentes ne sont pas encore importées dans la base (mailing CGP de
        cette semaine, +900 conversations Codeur) et brouilleraient le pilotage si elles restaient
        hors-CRM.
      </P>

      {bounced > 0 && (
        <P tag="qualité" alert>
          <S>{bounced} emails sont actuellement bouncés</S> dans la base, soit{' '}
          {Math.round(bounced / total * 100)} % du fichier. C'est un signal de qualité de sourcing
          médiocre sur le segment international wealth/CGP (domaines fermés, emails publics échoués).
          La requalification de ces contacts ou leur retrait améliorerait mécaniquement la délivrabilité
          des prochaines campagnes.
        </P>
      )}

      <P tag="recommandations">
        (1) <S>importer Codeur</S> dans la base pour avoir une vue unifiée du pipeline entrant,
        (2) industrialiser une vague mensuelle « CGP français » + une vague « wealth EU »
        avec sequencing automatique J+3 / J+7 / J+14,
        (3) lancer un programme de référence avec Balmont et les 7 autres clients signés
        pour générer 2-3 leads chauds/mois,
        (4) qualifier l'origine de chaque contact pour calculer un CAC par canal.
      </P>
    </NarrativeShell>
  )
}
