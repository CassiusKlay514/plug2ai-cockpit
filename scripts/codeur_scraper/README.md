# Codeur Scout — Apify Actor

> Scraper Playwright qui lit codeur.com et ingère projets + messages dans Supabase.
> Tourne soit en local (test/debug), soit sur Apify (production, cron toutes les 2h).

## Architecture

```
Apify Actor (Playwright)
   ↓ login codeur.com (creds dans Apify Vault)
   ↓ visite /projects/c/ia
   ↓ extract 20 derniers projets
   ↓ visite /users/<id>/messages
   ↓ pagine sur tous les threads
   ↓ POST vers Supabase REST (avec Secret Key)
   ↓ INSERT INTO codeur_projets, codeur_messages
   ↓ logger run dans apify_runs
```

## Variables d'environnement attendues

| Variable | Source | Sensibilité |
|---|---|---|
| `CODEUR_EMAIL` | Apify Vault (compte secondaire) | Haute |
| `CODEUR_PASSWORD` | Apify Vault (compte secondaire) | Critique |
| `SUPABASE_URL` | Apify Vault | Faible |
| `SUPABASE_SECRET_KEY` | Apify Vault (sb_secret_*) | Haute |

## Fichiers

- `main.js` — entry point Playwright (lance le navigateur, orchestrate scraping)
- `lib/login.js` — gestion de la session (login + persistance cookies)
- `lib/projets.js` — extraction des projets depuis /projects/c/ia
- `lib/messages.js` — extraction des conversations
- `lib/scoring.js` — scoring de pertinence (mots-clés Plug2AI)
- `lib/supabase.js` — client Supabase REST minimal (fetch + upsert)
- `package.json` — dépendances : playwright, node-fetch
- `apify.json` — config actor Apify (memory, timeout, schedule)
- `Dockerfile` — pour déploiement Apify

## Mots-clés de scoring (à ajuster)

```js
const KEYWORDS_HOT = [
  'agent ia', 'agent ai',
  'chatbot',
  'automatisation', 'automation',
  'crm ia', 'crm ai',
  'saas audit',
  'rag', 'retrieval augmented',
  'n8n', 'make.com',
  'claude api', 'openai api',
  'cgp', 'conseil patrimoine', 'wealth',
  'cabinet avocat',
]

// Si projet contient 2+ keywords → score 80+
// Si budget > 2000€ → +10
// Si urgent + < 3 offres déjà → +10
```

## Premier déploiement

1. Récupérer le code en local
2. `npm install`
3. Créer `.env.local` avec les 4 variables d'env
4. `node main.js --mode test` (n'écrit pas en base, juste affiche)
5. `node main.js --mode full` (importe les 900+ messages historiques)
6. Push vers Apify : `apify push`
7. Schedule sur Apify (cron `0 */2 * * *`)

## Garde-fous

- Login : 1 tentative, si KO → STOP + log incident
- Pagination messages : max 100 pages (~3000 messages) puis stop
- Delay aléatoire 2-5 sec entre actions (anti-rate-limit)
- Backoff exponentiel si erreur 429/503
- Sauvegarde le cookie de session pour éviter de se relogguer à chaque run
- Compliance Sentinel monitore via la table `agents_runs`
