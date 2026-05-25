-- =====================================================================
-- PLUG2AI COCKPIT — v0.5 modules stratégiques
-- VII · CEO        — okrs, decisions, roadmap
-- VIII · Veille    — veille (articles, alertes régulatoires)
-- IX · Connaissance — agents_ia, knowledge_bases, postmortems
-- =====================================================================

drop table if exists public.postmortems cascade;
drop table if exists public.knowledge_bases cascade;
drop table if exists public.agents_ia cascade;
drop table if exists public.veille cascade;
drop table if exists public.roadmap cascade;
drop table if exists public.decisions cascade;
drop table if exists public.okrs cascade;

-- =====================================================================
-- VII · CEO
-- =====================================================================

create table public.okrs (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  trimestre       text not null,                       -- '2026-Q3'
  objectif        text not null,
  resultat_cle    text not null,                       -- key result lisible
  cible           numeric(14,2),
  actuel          numeric(14,2),
  unite           text default 'unités',               -- '€', 'clients', '%', '...'
  statut          text not null default 'EN_COURS'
                  check (statut in ('A_LANCER','EN_COURS','ATTEINT','RATE')),
  notes           text
);
create index okrs_trim_idx on public.okrs (trimestre);

create table public.decisions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  date_decision   date not null default current_date,
  titre           text not null,
  contexte        text,
  options         text,
  decision_prise  text,
  impact_attendu  text,
  statut          text default 'PRISE'
                  check (statut in ('A_PRENDRE','EN_REFLEXION','PRISE','ANNULEE')),
  tags            text
);
create index decisions_date_idx on public.decisions (date_decision desc);

create table public.roadmap (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  titre           text not null,
  description     text,
  trimestre       text not null,                       -- '2026-Q3'
  statut          text not null default 'PREVU'
                  check (statut in ('PREVU','EN_COURS','LIVRE','REPORTE','ABANDONNE')),
  ordre           int default 0,
  module_lie      text                                  -- 'CRM','CFO','CMO',...
);
create index roadmap_trim_idx on public.roadmap (trimestre, ordre);

-- =====================================================================
-- VIII · Veille IA & Conformité
-- =====================================================================

create table public.veille (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  date_pub        date not null default current_date,
  titre           text not null,
  source          text,
  url             text,
  categorie       text not null default 'AUTRE'
                  check (categorie in (
                    'AI_ACT','RGPD','NIS2',
                    'ANNONCE_PRODUIT','CONCURRENCE',
                    'ARTICLE_EXPERT','VEILLE_CYBER','AUTRE'
                  )),
  pertinent       boolean not null default true,
  vu              boolean not null default false,
  resume          text,
  action_a_faire  text
);
create index veille_date_idx on public.veille (date_pub desc);
create index veille_cat_idx on public.veille (categorie);

-- =====================================================================
-- IX · Connaissance & Agents
-- =====================================================================

create table public.agents_ia (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  nom             text not null,
  description     text,
  cas_usage       text,
  prompt_template text,
  modele          text,                                 -- 'claude-sonnet-4.6', 'gpt-4', etc.
  outils_utilises text,                                 -- 'n8n, Make, Supabase'
  clients_utilises text,                                -- 'Balmont, Picovschi'
  reusable        boolean not null default true,
  statut          text not null default 'EN_COURS'
                  check (statut in ('PROTOTYPE','EN_COURS','PRODUCTION','ABANDONNE'))
);
create index agents_statut_idx on public.agents_ia (statut);

create table public.knowledge_bases (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  nom             text not null,
  description     text,
  client_id       uuid references public.contacts(id) on delete set null,
  client_nom      text,
  technologie     text,                                 -- 'Supabase pgvector', 'Pinecone'
  nombre_docs     int,
  taille_estimee_mb numeric(10,2),
  reusable        boolean default false
);

create table public.postmortems (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  date_fin        date not null default current_date,
  projet          text not null,
  client_id       uuid references public.contacts(id) on delete set null,
  client_nom      text,
  ce_qui_a_marche text,
  ce_qui_n_a_pas  text,
  lecons          text,
  reutilisable_pour text
);

-- =====================================================================
-- Triggers updated_at
-- =====================================================================
create trigger okrs_updated_at        before update on public.okrs        for each row execute function public.set_updated_at();
create trigger roadmap_updated_at     before update on public.roadmap     for each row execute function public.set_updated_at();
create trigger agents_ia_updated_at   before update on public.agents_ia   for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS permissif V0
-- =====================================================================
alter table public.okrs             enable row level security;
alter table public.decisions        enable row level security;
alter table public.roadmap          enable row level security;
alter table public.veille           enable row level security;
alter table public.agents_ia        enable row level security;
alter table public.knowledge_bases  enable row level security;
alter table public.postmortems      enable row level security;

create policy "dev_open_okrs"             on public.okrs             for all using (true) with check (true);
create policy "dev_open_decisions"        on public.decisions        for all using (true) with check (true);
create policy "dev_open_roadmap"          on public.roadmap          for all using (true) with check (true);
create policy "dev_open_veille"           on public.veille           for all using (true) with check (true);
create policy "dev_open_agents_ia"        on public.agents_ia        for all using (true) with check (true);
create policy "dev_open_knowledge_bases"  on public.knowledge_bases  for all using (true) with check (true);
create policy "dev_open_postmortems"      on public.postmortems      for all using (true) with check (true);

-- =====================================================================
-- Vue : activité de la semaine (agrège tous les modules pour Accueil)
-- =====================================================================
drop view if exists public.activite_hebdo cascade;

create view public.activite_hebdo as
  select 'crm'    as module, 'Nouveau contact'      as type, c.created_at as date_event,
         coalesce(c.prenom||' '||c.nom, c.societe, 'Contact') as titre, c.id::text as ref
  from public.contacts c where c.created_at >= current_date - interval '14 days'
union all
  select 'cfo', 'Transaction', t.created_at, t.intitule, t.id::text
  from public.transactions t where t.created_at >= current_date - interval '14 days'
union all
  select 'coo', 'Facture', f.created_at, coalesce(f.numero,'Sans num'), f.id::text
  from public.factures f where f.created_at >= current_date - interval '14 days'
union all
  select 'agenda', 'Réunion', r.created_at, r.titre, r.id::text
  from public.reunions r where r.created_at >= current_date - interval '14 days'
union all
  select 'agenda', 'Tâche', t.created_at, t.description, t.id::text
  from public.taches t where t.created_at >= current_date - interval '14 days'
union all
  select 'ceo', 'OKR', o.created_at, o.objectif, o.id::text
  from public.okrs o where o.created_at >= current_date - interval '14 days'
union all
  select 'ceo', 'Décision', d.created_at, d.titre, d.id::text
  from public.decisions d where d.created_at >= current_date - interval '14 days'
union all
  select 'ceo', 'Roadmap', r.created_at, r.titre, r.id::text
  from public.roadmap r where r.created_at >= current_date - interval '14 days'
union all
  select 'veille', 'Veille', v.created_at, v.titre, v.id::text
  from public.veille v where v.created_at >= current_date - interval '14 days'
union all
  select 'kb', 'Agent IA', a.created_at, a.nom, a.id::text
  from public.agents_ia a where a.created_at >= current_date - interval '14 days'
union all
  select 'kb', 'Knowledge Base', k.created_at, k.nom, k.id::text
  from public.knowledge_bases k where k.created_at >= current_date - interval '14 days'
union all
  select 'kb', 'Postmortem', p.created_at, p.projet, p.id::text
  from public.postmortems p where p.created_at >= current_date - interval '14 days'
;
