# Plug2AI Cockpit · Handoff Document

> Document à lire AVANT d'écrire la moindre ligne de code dans ce repo.
> Dernière mise à jour : 25 mai 2026 · v.06

## 1. Vue d'ensemble

Plug2AI est une agence IA (Jonathan Gomez fondateur, Espoir co-fondateur).
Ce repo est le cockpit privé de pilotage : **10 modules C-Suite** + base de
gouvernance d'une flotte de 14 agents IA.

- **Cockpit web** : Vite + React 18 + Tailwind + Supabase (ce repo)
- **Base de données** : Supabase Postgres, projet `abgyjapkjdnpgsnzkaov`
  (compte Maman H Pro), région eu-west-3 Paris
- **GitHub** : `CassiusKlay514/plug2ai-cockpit`
- **Déploiement cible** : Vercel → cockpit.plug2ai.com (pas encore en prod)

## 2. Architecture en 1 page

```
COCKPIT WEB (React)        cockpit.plug2ai.com
  10 modules : Accueil + I CRM + II CFO + III CMO
               + IV COO + V CTO + VI Agenda
               + VII CEO + VIII Veille + IX Connaissance
                      |
                      | lit/écrit via @supabase/supabase-js
                      v
SUPABASE (PostgreSQL)      abgyjapkjdnpgsnzkaov
  ~30 tables · ~10 vues · RLS activée partout
                      ^
                      | lit/écrit (lecture seule pour V0)
                      |
CLAUDE COWORK              flotte d'agents
  14 agents (#00 à #13) avec scope strict, audits, kill
```

## 3. Stack technique

| Couche | Choix |
|---|---|
| Front | Vite 5 + React 18, sans router (state-based nav dans App.jsx) |
| Style | Tailwind 3, palette : paper, ink, ocre, ocre-d, rust, grey |
| Fonts | Big Shoulders (titres), IBM Plex Mono (mono), Instrument Serif (italics) |
| BD | Supabase PostgreSQL, accès via src/lib/supabase.js |
| Hook unifié | src/lib/useExecutiveData.js charge toute la donnée commune |
| Routing | state page dans App.jsx, pas de react-router |
| Auth | Pas encore (anon key + RLS permissive V0) |

## 4. Conventions de code

### Pattern de page module

```jsx
// src/pages/<Module>.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import useExecutiveData from '../lib/useExecutiveData.js'  // si besoin agrégé
import StatTile from '../components/StatTile.jsx'
import SectionTitle from '../components/SectionTitle.jsx'
import ModuleNarrative from '../components/ModuleNarrative.jsx'

export default function Module() {
  // 1. State local + reload()
  // 2. useEffect → fetch des tables propres au module
  // 3. Computed values (useMemo)
  // 4. Quick-add handlers (insert via supabase)
  // 5. CRUD handlers (update, delete avec confirm)
  // 6. JSX :
  //    - Header (subtitle italic + h1 title 72px)
  //    - <ModuleNarrative data={...} />
  //    - StatTiles en 1 ou 2 rows de 4
  //    - SectionTitle + content avec quick-add
  //    - Footer
}
```

### Pattern de narrative

```jsx
// src/components/ModuleNarrative.jsx
import NarrativeShell, { P, S } from './NarrativeShell.jsx'

export default function ModuleNarrative({ data }) {
  if (!data) return null
  return (
    <NarrativeShell role="ROLE" title="LE MOT DU ROLE" subtitle="...">
      <P tag="thème">Texte avec <S>chiffre fort</S> ...</P>
      <P tag="alerte" alert>Texte rouge si critique</P>
      <P tag="recommandations">(1) ..., (2) ..., (3) ...</P>
    </NarrativeShell>
  )
}
```

### Tailwind classes récurrentes

- Tuile stat : `border border-ink/30 bg-paper/40 p-6 hover:border-ink hover:-translate-y-[2px]`
- Section title : voir src/components/SectionTitle.jsx
- Filter chip : `font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 border ...`
- Title : `font-title text-[72px] leading-[0.92] tracking-tight`

## 5. Schéma de base — tables disponibles

Fichiers SQL par version :
- schema.sql — base initiale : contacts, interactions, deals, factures
- schema_cfo.sql — module CFO : transactions, paiements_stripe, vues
- schema_v2_synthesis.sql — vue synthese_globale, charges_par_categorie
- schema_v3_agenda.sql — module Agenda : reunions, taches
- schema_v5_strategie.sql — modules CEO/Veille/KB
- schema_v6_agents.sql — gouvernance flotte d'agents + Site Concierge
- schema_v7_agent_views.sql — vues utilitaires : agent_health, incidents_open, agents_runs_recent

### Tables critiques à connaître

| Table | Rôle | Lignes |
|---|---|---|
| contacts | CRM unifié | 117 |
| transactions | Bank Qonto | 206 |
| factures | Factures émises | 10 |
| reunions | Réunions Fathom | 58 |
| taches | Action items Fathom | 183 |
| okrs | OKRs Q3 2026 | 5 |
| decisions | Décisions stratégiques | 5 |
| roadmap | Chantiers planifiés | 8 |
| agents | Flotte de 14 agents | 14 |
| agents_runs | Runs (vides pour l'instant) | 0 |
| incidents | Incidents (vides) | 0 |
| site_visitors | Visiteurs plug2ai.com qualifiés | 0 |
| leads | Leads multi-source | 0 |

### Vues utiles

- synthese_globale : KPIs agrégés (Accueil + CFO)
- cfo_kpis : sous-set finances
- ca_par_client : top clients
- fournisseurs : top fournisseurs récurrents
- activite_hebdo : agrégation 14 derniers jours
- agent_health : 1 ligne par agent avec dernier run + incidents + budgets
- incidents_open : incidents non résolus avec ancienneté
- agents_runs_recent : 100 derniers runs

## 6. Connexion Supabase

### Variables d'env (.env.local)

```
VITE_SUPABASE_URL=https://abgyjapkjdnpgsnzkaov.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

### Pour scripts Python ou edge functions

```
SUPABASE_DB_URL=postgresql://postgres.abgyjapkjdnpgsnzkaov:DB_PASSWORD@aws-0-eu-west-3.pooler.supabase.com:5432/postgres
FATHOM_API_KEY=...
ANTHROPIC_API_KEY=...
```

## 7. Flotte d'agents (Module X à construire)

14 agents enregistrés dans public.agents. Chacun a :
- id (ex: `09-site-concierge`)
- nom lisible
- scope_read[] : tables qu'il peut lire
- scope_write[] : tables qu'il peut écrire (Compliance Sentinel surveille)
- autonomie : pleine | mixte | draft
- actif : true/false (kill switch)
- killed_at, killed_reason : trace du dernier kill

### État actuel
- 12-compliance-sentinel : ACTIF (pédale de frein)
- 13 autres : off — activation manuelle par Jonathan

### Vues à utiliser pour le Module X

```sql
-- Dashboard Module X :
select * from agent_health order by id;       -- ligne par agent

-- Alertes :
select * from incidents_open;                  -- non résolus

-- Live ticker :
select * from agents_runs_recent;              -- 100 derniers runs
```

## 8. Roadmap actuelle

OKRs Q3 2026 :
1. Doubler le CA mensuel (5 000€/mo cible, 1 500€ actuel)
2. Réduire dépendance Balmont (50% hors Balmont, 25% actuel)
3. Industrialiser la prospection (150 contacts, 117 actuel)
4. Lancer offre produit SaaS (3 clients pilotes, 1 actuel)
5. Optimiser stack tooling (-150€/mo, -50€ actuel)

Chantiers en cours :
- Sync Fathom automatique (edge function)
- Mot du CFO IA dynamique (Claude API)
- Import Codeur 900+ msgs
- Gmail OAuth sync interactions
- Auth Supabase + déploiement Vercel
- **Module X Flotte d'agents (sprint suivant)**
- Lancement offre SaaS Plug2AI Cockpit (Q4)
- Diversification client (sortir de Balmont)

## 9. Sécurité

- RLS activée sur 24 tables (policies permissives V0 — durcir avant prod)
- Aucune clé secrète committée (.env.local gitignored)
- Clés sensibles à régénérer régulièrement et stocker hors-repo
- Compliance Sentinel surveille les agents toutes les 15 min
- Trigger SQL anti-suicide sur la table agents (Compliance ne peut pas être désactivé par un agent)

## 10. Workflow de contribution

```bash
# Démarrer en local
cd ~/Desktop/Plug2AI-Tout/cockpit
npm install
npm run dev    # http://localhost:5173

# Branche, code, test
git checkout -b feature/module-x-agents
# ... édit ...
npm run dev    # vérifier

# Commit & push
git add -A
git commit -m "Module X · Flotte d'agents (lecture)"
git push -u origin feature/module-x-agents
```

## 11. Définition de "done"

Une feature est livrée quand :
1. Le code compile sans warning
2. La page rend correctement à localhost:5173
3. Aucune erreur dans la console navigateur
4. Le PR ou commit décrit ce qui change
5. Les tables Supabase nécessaires existent
6. Les conventions de style sont respectées (typo, palette, patterns)

## 12. Contacts

- Fondateur : Jonathan Gomez · jonathnan.gomez@gmail.com
- Co-fondateur : Espoir (doseit) · doseitpro@gmail.com
- Maman H : compte Supabase Pro (propriétaire de l'org Plug2AI)
- Repo GitHub : https://github.com/CassiusKlay514/plug2ai-cockpit
