-- =====================================================================
-- PLUG2AI COCKPIT — v0.8 Codeur + Apify
-- =====================================================================

drop view if exists public.codeur_overview cascade;
drop table if exists public.codeur_messages cascade;
drop table if exists public.codeur_projets cascade;
drop table if exists public.apify_runs cascade;

-- =====================================================================
-- apify_runs : journal de TOUTES les exécutions Apify
-- =====================================================================
create table public.apify_runs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  apify_run_id    text unique not null,            -- ID Apify
  actor_id        text not null,                   -- 'codeur-scout', 'linkedin-enricher', etc.
  actor_name      text,

  started_at      timestamptz not null,
  finished_at     timestamptz,
  status          text not null,                   -- 'RUNNING','SUCCEEDED','FAILED','TIMED-OUT','ABORTED'
  duration_sec    int,

  -- stats
  pages_scraped   int default 0,
  items_extracted int default 0,
  errors_count    int default 0,

  -- coût
  compute_units   numeric(8,4),                    -- unité de coût Apify
  cost_usd        numeric(8,4),

  -- liens
  log_url         text,
  dataset_url     text,

  -- payload résumé
  output_summary  jsonb
);
create index apify_runs_actor_idx on public.apify_runs (actor_id, started_at desc);
create index apify_runs_status_idx on public.apify_runs (status);

-- =====================================================================
-- codeur_projets : projets postés sur codeur.com/projects/c/ia
-- =====================================================================
create table public.codeur_projets (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- identifiant Codeur (unique)
  codeur_id       text unique not null,           -- ex: '483276'
  url             text not null,
  url_offres      text,                            -- /projects/{id}/offers

  -- contenu
  titre           text not null,
  description     text,
  description_en  text,                            -- traduit en anglais si besoin
  budget_min_eur  numeric(10,2),
  budget_max_eur  numeric(10,2),
  budget_label    text,                            -- 'Moins de 500 €', etc.

  -- métadonnées
  date_pub        timestamptz,
  date_limite     timestamptz,
  duree_jours     int,
  urgent          bool default false,

  -- catégorisation
  categorie       text,                            -- 'IA', 'Dev web', etc.
  tags            text[],
  mots_cles       text[],                          -- tags détectés (chatbot, agent IA, etc.)

  -- état
  statut_codeur   text,                            -- 'Ouvert', 'En cours', 'Fermé'
  n_offres        int default 0,
  n_vues          int default 0,
  n_interactions  int default 0,

  -- auteur
  auteur_nom      text,
  auteur_url      text,
  auteur_note     numeric(3,2),

  -- scoring interne Plug2AI
  score_pertinence int default 0,                 -- 0-100, calculé par l'agent
  raison_score    text,
  candidature_envoyee bool default false,
  candidature_date timestamptz,
  candidature_id  text,                            -- ID Codeur de l'offre Plug2AI

  -- meta
  source          text default 'apify_codeur_scout',
  raw_payload     jsonb
);
create index codeur_projets_date_idx on public.codeur_projets (date_pub desc);
create index codeur_projets_score_idx on public.codeur_projets (score_pertinence desc);
create index codeur_projets_statut_idx on public.codeur_projets (statut_codeur);

-- =====================================================================
-- codeur_messages : conversations Codeur (les 900+ historiques)
-- =====================================================================
create table public.codeur_messages (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  codeur_id       text unique not null,           -- ID du message côté Codeur

  -- lien
  thread_id       text not null,                   -- ID de la conversation
  projet_id       uuid references public.codeur_projets(id) on delete set null,
  projet_codeur_id text,                            -- ID Codeur du projet si pas dans notre table

  -- contenu
  sujet           text,
  contenu         text,
  date_envoi      timestamptz not null,

  -- sens
  direction       text not null check (direction in ('IN','OUT')),  -- IN = reçu, OUT = envoyé par nous

  -- interlocuteur
  contact_nom     text,
  contact_url     text,
  contact_id      uuid references public.contacts(id) on delete set null,

  -- état
  lu              bool default false,
  archive         bool default false,

  -- meta
  raw_payload     jsonb
);
create index codeur_messages_thread_idx on public.codeur_messages (thread_id, date_envoi);
create index codeur_messages_date_idx on public.codeur_messages (date_envoi desc);
create index codeur_messages_direction_idx on public.codeur_messages (direction, lu);

-- =====================================================================
-- Vue : overview Codeur pour le module XI
-- =====================================================================
create view public.codeur_overview as
select
  (select count(*) from public.codeur_projets where statut_codeur = 'Ouvert')      as n_projets_ouverts,
  (select count(*) from public.codeur_projets where score_pertinence >= 70)        as n_leads_chauds,
  (select count(*) from public.codeur_projets where candidature_envoyee = true)    as n_candidatures,
  (select count(*) from public.codeur_messages)                                    as n_messages_total,
  (select count(*) from public.codeur_messages where direction='IN' and lu=false)  as n_messages_non_lus,
  (select count(*) from public.codeur_messages where direction='IN' and date_envoi > now() - interval '7 days') as n_msgs_in_7j,
  (select count(*) from public.codeur_messages where direction='OUT' and date_envoi > now() - interval '7 days') as n_msgs_out_7j,
  (select max(date_envoi) from public.codeur_messages)                             as dernier_message_at,
  (select max(date_pub) from public.codeur_projets)                                as dernier_projet_at;

-- =====================================================================
-- Triggers
-- =====================================================================
create trigger codeur_projets_updated_at before update on public.codeur_projets
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS permissif V0
-- =====================================================================
alter table public.apify_runs       enable row level security;
alter table public.codeur_projets   enable row level security;
alter table public.codeur_messages  enable row level security;

drop policy if exists "dev_open_apify_runs"      on public.apify_runs;
drop policy if exists "dev_open_codeur_projets"  on public.codeur_projets;
drop policy if exists "dev_open_codeur_messages" on public.codeur_messages;

create policy "dev_open_apify_runs"      on public.apify_runs      for all using (true) with check (true);
create policy "dev_open_codeur_projets"  on public.codeur_projets  for all using (true) with check (true);
create policy "dev_open_codeur_messages" on public.codeur_messages for all using (true) with check (true);

-- =====================================================================
-- Ajout aux scopes des agents existants
-- =====================================================================
update public.agents
set scope_read = array_append(scope_read, 'codeur_projets'),
    scope_write = array_append(scope_write, 'codeur_projets')
where id = '01-codeur-scout' and not 'codeur_projets' = any(scope_write);

update public.agents
set scope_read = array_append(scope_read, 'codeur_messages'),
    scope_write = array_append(scope_write, 'codeur_messages')
where id = '01-codeur-scout' and not 'codeur_messages' = any(scope_write);
