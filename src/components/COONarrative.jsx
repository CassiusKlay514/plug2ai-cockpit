import NarrativeShell, { P, S } from './NarrativeShell.jsx'
import { formatEur } from '../lib/format.js'

// Mot du COO — projets, livraison, capacité, charge équipe
export default function COONarrative({ data }) {
  const fact = data?.factures ?? []
  const clients = data?.clientsSignes ?? []
  if (fact.length === 0 && clients.length === 0) return null

  const nClients = clients.length
  const facturesPayees = fact.filter(f => f.statut === 'PAYEE').length
  const facturesEmises = fact.filter(f => f.statut === 'EMISE' || f.statut === 'IMPAYEE').length
  const totalFacture = fact.reduce((s, f) => s + Number(f.montant_eur || 0), 0)
  const moyenneFacture = fact.length > 0 ? totalFacture / fact.length : 0

  // Top clients par facturation
  const ca = (data?.caParClient ?? []).filter(c => c.client !== 'Inconnu')
  const top = ca[0]

  return (
    <NarrativeShell role="COO" title="LE MOT DU COO" subtitle="opérations · livraison · capacité">
      <P tag="portefeuille">
        Le portefeuille actif compte <S>{nClients} clients signés</S> répartis sur des missions
        variées : conseil patrimonial (Balmont), avocats (Picovschi, Harris/Drai),
        cabinets de conseil (Cooktech, ADR2i, EL MELIANI), partenaires tech (Rank-Up.io, FBNV),
        et associations (Quiétude). <S>{fact.length} factures</S> ont été émises au total dont{' '}
        <S>{facturesPayees} encaissées</S>, pour un total cumulé de{' '}
        <S>{formatEur(totalFacture)}</S> TTC, soit une facture moyenne de{' '}
        <S>{formatEur(moyenneFacture)}</S>.
      </P>

      {top && (
        <P tag="charge">
          La majorité de la production actuelle repose sur <S>{top.client}</S>{' '}
          ({top.n_factures} factures, {formatEur(Number(top.total_ht))} HT cumulés). À 2 fondateurs
          (Jonathan + Espoir) plus quelques freelances ponctuels via Codeur, la capacité de
          livraison plafonne autour de <S>~150-200 h/mois</S> hors temps commercial.
          Les missions actuelles tiennent dans cette enveloppe mais ne laissent pas de marge pour
          absorber un deuxième compte de l'envergure de Balmont sans bras supplémentaire.
        </P>
      )}

      <P tag="rituels">
        Le pilotage projet repose aujourd'hui sur Fathom (transcripts de RDV), Google Calendar
        (synchronisation des RDV), Codeur (échanges clients ponctuels) et WhatsApp (équipe).
        Aucun outil de gestion de projet structuré (Notion, Linear, Plane) n'est utilisé,
        ce qui rend la mesure de marge par projet difficile et la livraison opaque pour le client.
      </P>

      <P tag="risques">
        Les <S>5 directes-debit rejections cumulées en 2026</S> indiquent des tensions ponctuelles
        de trésorerie qui auraient pu être anticipées avec un calendrier de paiements partagé.
        Aucune facture impayée actuellement, mais la dépendance Balmont reste un risque opérationnel
        si la prestation est suspendue ou ralentie.
      </P>

      <P tag="recommandations">
        (1) installer un kanban projet (Notion ou Linear) pour rendre la livraison lisible,
        (2) mesurer heures vendues vs heures consommées par projet pour calculer la marge réelle,
        (3) constituer un vivier <S>3-5 freelances</S> qualifiés pour absorber un second compte
        sans dégrader la qualité,
        (4) industrialiser un onboarding client en 5 étapes documentées pour réduire la friction
        sur les nouveaux contrats.
      </P>
    </NarrativeShell>
  )
}
