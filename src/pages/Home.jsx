import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import useExecutiveData from '../lib/useExecutiveData.js'
import { formatEur, formatEurShort, formatNumber, formatDate } from '../lib/format.js'
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import CxoCard from '../components/CxoCard.jsx'

const MODULE_META = {
  crm:    { roman: 'I',    nom: 'CRM',      color: 'text-ink' },
  cfo:    { roman: 'II',   nom: 'CFO',      color: 'text-ink' },
  cmo:    { roman: 'III',  nom: 'CMO',      color: 'text-ink' },
  coo:    { roman: 'IV',   nom: 'COO',      color: 'text-ink' },
  cto:    { roman: 'V',    nom: 'CTO',      color: 'text-ink' },
  agenda: { roman: 'VI',   nom: 'Agenda',   color: 'text-ink' },
  ceo:    { roman: 'VII',  nom: 'CEO',      color: 'text-ocre-d' },
  veille: { roman: 'VIII', nom: 'Veille',   color: 'text-ocre-d' },
  kb:     { roman: 'IX',   nom: 'KB',       color: 'text-ocre-d' },
}

export default function Home({ onNavigate }) {
  const { data, loading, error } = useExecutiveData()
  const s = data?.synth
  const [activite, setActivite] = useState([])
  useEffect(() => {
    supabase.from('activite_hebdo')
      .select('*')
      .order('date_event', { ascending: false })
      .limit(40)
      .then(({ data }) => setActivite(data ?? []))
  }, [])

  // Stats étendues
  const contacts = data?.contacts ?? []
  const vagues = data?.vagues ?? []
  const tools = data?.tools ?? []
  const deals = data?.deals ?? []
  const interactions = data?.interactions ?? []
  const monthly = data?.saasMonthly ?? 0

  const bounced = contacts.filter(c => c.email_valide === false).length
  const wealth = contacts.filter(c => c.statut === 'PROSPECT_WEALTH' || c.statut === 'PROSPECT_CGP').length

  // Top client pour le headline CFO
  const topClient = data?.caParClient?.[0]
  const concentration = topClient && s?.ca_ht_total
    ? Math.round((Number(topClient.total_ht) / Number(s.ca_ht_total)) * 100)
    : null

  return (
    <main className="max-w-[1500px] mx-auto px-6 py-12 relative z-10">

      {/* HERO */}
      <section className="mb-16">
        <div className="flex items-end justify-between mb-3">
          <p className="font-serif italic text-[15px] text-grey">
            tableau de gouvernance · une page pour tout voir
          </p>
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey">
            mise à jour {s?.derniere_op ? formatDate(s.derniere_op) : '…'}
          </div>
        </div>
        <h1 className="font-title text-[96px] leading-[0.9] tracking-tight">
          ÉTAT DU<br/>
          <span className="text-ocre-d">CABINET</span>
        </h1>
        <p className="font-serif italic text-[17px] text-ink/80 mt-6 max-w-[760px]">
          Plug2AI en chiffres réels, lus depuis la base bancaire, le CRM et l'orchestrateur.
          Cliquez une tuile pour son détail, ou consultez chaque CxO du Conseil exécutif plus bas.
        </p>
      </section>

      {error && <div className="font-mono text-sm text-rust mb-6">Erreur : {error}</div>}

      {/* GRID 1 — pipeline commercial */}
      <section className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey mb-3">
          Pipeline commercial
        </div>
      </section>
      <section className="grid grid-cols-4 gap-3 mb-8">
        <StatTile roman="I" label="Contacts"
          value={s ? formatNumber(s.n_contacts) : '…'}
          sub={s ? `${s.n_clients} clients · ${s.n_prospects} prospects` : ''}
          onClick={() => onNavigate('crm')} />
        <StatTile roman="II" label="Clients signés"
          value={s ? formatNumber(s.n_clients) : '…'}
          sub={s ? `${s.n_prospects_chauds} prospects chauds` : ''}
          onClick={() => onNavigate('crm')} accent />
        <StatTile roman="III" label="Vagues de campagne"
          value={formatNumber(vagues.length)}
          sub="documentées dans la base"
          onClick={() => onNavigate('cmo')} />
        <StatTile roman="IV" label="Wealth · CGP"
          value={formatNumber(wealth)}
          sub="patrimoine · conformité"
          onClick={() => onNavigate('cmo')} />
      </section>

      {/* GRID 2 — finance */}
      <section className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey mb-3">
          Performance financière
        </div>
      </section>
      <section className="grid grid-cols-4 gap-3 mb-8">
        <StatTile label="CA HT cumulé"
          value={s ? formatEurShort(s.ca_ht_total) : '…'}
          sub={s ? `TTC ${formatEurShort(s.ca_ttc_total)} · ${s.n_factures} f.` : ''}
          onClick={() => onNavigate('cfo')} />
        <StatTile label="Charges cumulées"
          value={s ? formatEurShort(s.charges_ttc_total) : '…'}
          sub={s ? `dernière op. ${formatDate(s.derniere_op)}` : ''}
          onClick={() => onNavigate('cfo')} />
        <StatTile label="Résultat net estimé"
          value={s ? formatEurShort(s.resultat_net_estime ?? 0) : '…'}
          sub="CA HT − charges TTC"
          accent={s && Number(s.resultat_net_estime) > 0}
          onClick={() => onNavigate('cfo')} />
        <StatTile label="Burn 30 derniers j."
          value={s ? formatEurShort(s.charges_30j ?? 0) : '…'}
          sub="rythme de dépense"
          onClick={() => onNavigate('cfo')} />
      </section>

      {/* GRID 3 — opérations & stack */}
      <section className="mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-grey mb-3">
          Opérations et infrastructure
        </div>
      </section>
      <section className="grid grid-cols-4 gap-3 mb-16">
        <StatTile label="Outils SaaS actifs"
          value={formatNumber(tools.length)}
          sub={`${formatEurShort(monthly)} / mois`}
          onClick={() => onNavigate('cto')} />
        <StatTile label="Interactions"
          value={formatNumber(interactions.length)}
          sub="mails, RDV, appels (à syncer)"
          onClick={() => onNavigate('cmo')} />
        <StatTile label="Deals en cours"
          value={formatNumber(deals.length)}
          sub="opportunités qualifiées"
          onClick={() => onNavigate('coo')} />
        <StatTile label="Activité depuis"
          value={s?.date_debut_activite
            ? new Date(s.date_debut_activite).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
            : '…'}
          sub="premier mouvement bancaire" />
      </section>

      {/* CONSEIL EXECUTIF */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-ink/30">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ocre-d mb-1">§ 01</div>
            <h2 className="font-title text-[42px] leading-none">CONSEIL EXÉCUTIF</h2>
            <p className="font-serif italic text-[14px] text-grey mt-2">
              chaque CxO lit la même donnée avec son angle, et donne son insight prioritaire
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey text-right">
            cliquer pour lire<br/>le mot complet
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <CxoCard
            roman="II" code="CFO"
            title="Finances"
            tagline="cash · burn · risque"
            headlineKind={concentration && concentration >= 50 ? 'alert' : 'success'}
            headline={
              s ? (
                concentration >= 50
                  ? `Résultat estimé ${formatEur((Number(s.ca_ht_total) || 0) - (Number(s.charges_ttc_total) || 0))} mais ${concentration}% du CA repose sur un seul client. Diversification urgente.`
                  : `Marge brute saine de ${Math.round((1 - Number(s.charges_ttc_total) / Number(s.ca_ht_total)) * 100)} %, sans apport personnel. Continuer à élargir la base client.`
              ) : '…'
            }
            onClick={() => onNavigate('cfo')}
          />
          <CxoCard
            roman="III" code="CMO"
            title="Acquisition"
            tagline="funnel · campagnes · conversion"
            headlineKind={bounced > 10 ? 'warn' : 'info'}
            headline={
              s ? (
                `${vagues.length} vagues documentées sur ${s.n_contacts} contacts, ${bounced} emails bouncés à requalifier. Importer la campagne CGP récente et les 900+ conversations Codeur.`
              ) : '…'
            }
            onClick={() => onNavigate('cmo')}
          />
          <CxoCard
            roman="IV" code="COO"
            title="Opérations"
            tagline="projets · livraison · équipe"
            headlineKind="info"
            headline={
              s ? (
                `${s.n_clients} clients en production, ${s.n_factures} factures émises pour ${formatEur(Number(s.ca_ttc_total))} TTC. Aucun outil de kanban : risque d'opacité sur la marge réelle par projet.`
              ) : '…'
            }
            onClick={() => onNavigate('coo')}
          />
          <CxoCard
            roman="V" code="CTO"
            title="Infrastructure"
            tagline="stack · coûts · doublons"
            headlineKind="warn"
            headline={
              tools.length > 0 ? (
                `${tools.length} outils SaaS récurrents pour ${formatEur(monthly)}/mois. Doublons identifiés : ChatGPT vs Claude, Lovable vs Replit. Audit = 150-200 €/mois récupérables.`
              ) : '…'
            }
            onClick={() => onNavigate('cto')}
          />
          <CxoCard
            roman="VII" code="CEO"
            title="Stratégie"
            tagline="OKR · décisions · roadmap"
            headlineKind="info"
            headline="5 OKRs Q3 actifs, 8 chantiers roadmap. Cap : doubler le CA et sortir de la dépendance Balmont. Journal de décisions à tenir hebdo."
            onClick={() => onNavigate('ceo')}
          />
          <CxoCard
            roman="VIII" code="VEILLE"
            title="Veille IA"
            tagline="AI Act · concurrence · annonces"
            headlineKind="warn"
            headline="5 alertes régulatoires et annonces produits suivies. Chaque article doit déclencher une action commerciale dans les 48h sur les segments régulés."
            onClick={() => onNavigate('veille')}
          />
          <CxoCard
            roman="IX" code="KB"
            title="Connaissance"
            tagline="agents · KB · postmortems"
            headlineKind="success"
            headline="5 agents IA documentés (3 en production), 4 knowledge bases, 2 postmortems. Le vrai capital de l'agence — packager 3 agents en offre produit Q3."
            onClick={() => onNavigate('kb')}
          />
        </div>
      </section>

      {/* ACTIVITÉ HEBDO */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-6 pb-3 border-b border-ink/30">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-ocre-d mb-1">§ 02</div>
            <h2 className="font-title text-[42px] leading-none">ACTIVITÉ HEBDOMADAIRE</h2>
            <p className="font-serif italic text-[14px] text-grey mt-2">
              tout ce qui a bougé dans la boîte ces 14 derniers jours, agrégé en temps réel
            </p>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-grey text-right">
            {activite.length} événements
          </div>
        </div>

        {activite.length === 0 && (
          <div className="font-serif italic text-grey text-center py-12">aucune activité récente</div>
        )}

        {activite.length > 0 && (
          <div className="space-y-1">
            {activite.map((a, i) => {
              const m = MODULE_META[a.module] ?? { roman: '·', nom: a.module, color: 'text-grey' }
              return (
                <button
                  key={`${a.ref}_${i}`}
                  onClick={() => onNavigate(a.module === 'kb' ? 'kb' : a.module)}
                  className="w-full flex items-baseline gap-3 px-3 py-2 hover:bg-ink/5 border-b border-ink/10 text-left transition group"
                >
                  <span className={`font-title text-[14px] w-7 shrink-0 ${m.color}`}>{m.roman}</span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-grey w-16 shrink-0">{m.nom}</span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-ocre-d w-24 shrink-0">{a.type}</span>
                  <span className="flex-1 truncate text-[13px] group-hover:text-ocre-d transition-colors">{a.titre}</span>
                  <span className="font-mono text-[10px] text-grey shrink-0">{formatDate(a.date_event)}</span>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <footer className="mt-20 pt-4 border-t border-ink/20 flex items-baseline justify-between font-mono text-[10px] uppercase tracking-widest text-grey">
        <span>plug2ai · cockpit · v.02 · accueil</span>
        <span>« ce qui n'est pas mesuré ne peut être gouverné »</span>
        <span>jonathan gomez · {new Date().getFullYear()}</span>
      </footer>
    </main>
  )
}
