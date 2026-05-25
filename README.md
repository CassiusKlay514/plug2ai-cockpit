# Plug2AI · Cockpit

Tableau de bord privé pour piloter Plug2AI. Lit Supabase, source unique de vérité.

## Stack
- Vite + React 18
- Tailwind CSS
- Supabase (PostgreSQL + Auth + Storage)

## Lancer en local

```bash
npm install
cp .env.local.example .env.local   # puis renseigner les clés Supabase
npm run dev
```

Ouvrir http://localhost:5173

## Variables d'environnement

`.env.local` doit contenir :
```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xxx
```

## Schéma BD

Voir [schema.sql](./schema.sql) — 4 tables : contacts, interactions, deals, factures.

## Prochaines étapes

- [ ] Auth (login Jonathan + équipe)
- [ ] Fiche contact détail (édition)
- [ ] Sync Gmail automatique
- [ ] Module Codeur (suivi des offres)
- [ ] Module Devis (génération auto depuis template)
- [ ] Module Factures (Stripe + LegalPlace)
- [ ] Scoring IA (Claude via edge function)
- [ ] Site public plug2ai.com avec agent commercial
