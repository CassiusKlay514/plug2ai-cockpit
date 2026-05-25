-- =====================================================================
-- PLUG2AI COCKPIT — v0.6 Gouvernance flotte d'agents + Site Concierge
-- =====================================================================

create extension if not exists "pgcrypto";

-- =====================================================================
-- 1) Registre des agents
-- =====================================================================
create table if not exists public.agents (
  id              text primary key,
  nom             text not null,
  scope_read      text[] not null default '{}',
  scope_write     text[] not null default '{}',
  autonomie       text not null check (autonomie in ('pleine','mixte','draft')),
  actif           bool default true,
  killed_at       timestamptz,
  killed_reason   text,
  created_at      timestamptz default now()
);

-- =====================================================================
-- 2) Prompts versionnés
-- =====================================================================
create table if not exists public.agent_prompts (
  id              uuid primary key default gen_random_uuid(),
  agent_id        text references public.agents(id) on delete cascade,
  version         int not null,
  prompt          text not null,
  changelog       text,
  actif           bool default false,
  created_at      timestamptz default now()
);
create unique index if not exists idx_agent_prompts_active
  on public.agent_prompts(agent_id) where actif = true;

-- =====================================================================
-- 3) Journal de runs (mémoire entre runs)
-- =====================================================================
create table if not exists public.agents_runs (
  id              uuid primary key default gen_random_uuid(),
  agent_id        text references public.agents(id) on delete cascade,
  started_at      timestamptz default now(),
  ended_at        timestamptz,
  status          text default 'running' check (status in ('running','success','error','killed')),
  output_summary  text,
  next_action     text,
  tokens_used     int default 0,
  envois_externes int default 0,
  errors          text[]
);
create index if not exists agents_runs_agent_idx on public.agents_runs (agent_id, started_at desc);

-- =====================================================================
-- 4) Budget cap par agent
-- =====================================================================
create table if not exists public.agent_budget (
  agent_id                  text primary key references public.agents(id) on delete cascade,
  tokens_max_jour           int default 100000,
  envois_externes_max_jour  int default 5,
  tokens_used_jour          int default 0,
  envois_externes_used_jour int default 0,
  reset_at                  date default current_date
);

-- =====================================================================
-- 5) Incidents (P0 / P1 / P2)
-- =====================================================================
create table if not exists public.incidents (
  id              uuid primary key default gen_random_uuid(),
  agent_id        text,
  severite        text check (severite in ('P0','P1','P2')),
  type            text check (type in (
                    'out_of_scope','rate_exceeded','budget_exceeded',
                    'unauthorized_write','auto_loop','other'
                  )),
  description     text,
  payload         jsonb,
  resolu          bool default false,
  resolved_at     timestamptz,
  resolved_by     text,
  created_at      timestamptz default now()
);
create index if not exists incidents_unresolved_idx on public.incidents (resolu, severite, created_at desc);

-- =====================================================================
-- 6) Audits unifiés
-- =====================================================================
create table if not exists public.audits (
  id              uuid primary key default gen_random_uuid(),
  agent           text not null,
  action          text not null,
  target          text,
  payload         jsonb,
  created_at      timestamptz default now()
);
create index if not exists audits_agent_idx  on public.audits (agent, created_at desc);
create index if not exists audits_target_idx on public.audits (target, created_at desc);

-- =====================================================================
-- 7) Trigger anti-suicide pour Compliance Sentinel
-- =====================================================================
create or replace function public.prevent_compliance_kill()
returns trigger language plpgsql as $$
begin
  if old.id = '12-compliance-sentinel' and new.actif = false and current_user not in ('postgres','authenticator') then
    raise exception 'Compliance Sentinel ne peut pas être désactivé par un agent. Action manuelle uniquement.';
  end if;
  return new;
end $$;

drop trigger if exists agents_prevent_compliance_kill on public.agents;
create trigger agents_prevent_compliance_kill
  before update on public.agents
  for each row execute function public.prevent_compliance_kill();

-- =====================================================================
-- 8) Tables spécifiques Site Concierge (#09)
-- =====================================================================
create table if not exists public.site_visitors (
  id                  uuid primary key default gen_random_uuid(),
  email               text,
  societe             text,
  segment             text,
  maturite_score      int,
  maturite_responses  jsonb,
  utm_source          text,
  utm_campaign        text,
  opt_in_rgpd         bool default false,
  proposition_calendly bool default false,
  sequence_lancee     text check (sequence_lancee in ('decouverte','education') or sequence_lancee is null),
  created_at          timestamptz default now()
);
create index if not exists idx_site_visitors_email on public.site_visitors(email);
create index if not exists idx_site_visitors_score on public.site_visitors(maturite_score desc);

create table if not exists public.config_maturite (
  question_id     text primary key,
  question        text not null,
  options         jsonb,
  poids           int default 1
);

-- Seed du questionnaire (idempotent)
insert into public.config_maturite (question_id, question, options, poids) values
  ('q1', 'Combien de personnes dans votre équipe ?',
    '[{"label":"1-5","poids":5},{"label":"6-20","poids":15},{"label":"21-50","poids":25},{"label":"50+","poids":30}]'::jsonb, 1),
  ('q2', 'Avez-vous déjà mis en place un agent IA en production ?',
    '[{"label":"non","poids":10},{"label":"partiellement","poids":25},{"label":"oui","poids":15}]'::jsonb, 1),
  ('q3', 'Budget alloué à l''IA cette année ?',
    '[{"label":"<5k","poids":5},{"label":"5-25k","poids":20},{"label":"25-100k","poids":30},{"label":">100k","poids":35}]'::jsonb, 1),
  ('q4', 'Secteur d''activité ?',
    '[{"label":"finance/cgp","poids":20},{"label":"avocat","poids":18},{"label":"fiduciaire","poids":18},{"label":"sante","poids":15},{"label":"autre","poids":5}]'::jsonb, 1),
  ('q5', 'Échéance projet IA ?',
    '[{"label":"<3 mois","poids":25},{"label":"3-6 mois","poids":15},{"label":">6 mois","poids":5}]'::jsonb, 1)
on conflict (question_id) do nothing;

-- Table leads (référencée par Site Concierge)
create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references public.contacts(id) on delete set null,
  source          text,        -- 'site', 'codeur', 'linkedin', ...
  score           int,
  status          text default 'nouveau',
  notes           text,
  created_at      timestamptz default now()
);
create index if not exists leads_status_idx on public.leads(status);

-- =====================================================================
-- 9) Bootstrap des 14 agents
-- =====================================================================
insert into public.agents (id, nom, scope_read, scope_write, autonomie, actif) values
  ('01-codeur-scout',       'Codeur Scout',         array['codeur.com','codeur_logs','deals'],                array['leads','codeur_logs','audits','gmail_drafts'], 'mixte', false),
  ('02-gmail-sentinel',     'Gmail Sentinel',       array['gmail','contacts','deals'],                        array['gmail_labels','contacts','taches','audits'], 'pleine', false),
  ('03-linkedin-voice',     'LinkedIn Voice',       array['veille','tonalite_jonathan'],                      array['posts_draft','gmail_drafts','audits'], 'draft', false),
  ('04-instagram-studio',   'Instagram Studio',     array['veille','assets_visuels'],                         array['posts_draft','audits'], 'draft', false),
  ('05-relance-commerciale','Relance Commerciale',  array['stripe','legalplace','gmail','contacts'],          array['gmail_drafts','gmail_sent','audits'], 'mixte', false),
  ('06-cash-sentinel',      'Cash Sentinel',        array['qonto','stripe','factures','charges_recurrentes'], array['alertes_cash','audits','whatsapp'], 'pleine', false),
  ('07-veille-strategique', 'Veille Stratégique',   array['firecrawl','veille'],                              array['veille','angles_de_vente','audits'], 'pleine', false),
  ('08-crm-keeper',         'CRM Keeper',           array['gmail','calendar','fathom','contacts'],            array['contacts','deals','interactions','audits'], 'pleine', false),
  ('09-site-concierge',     'Site Concierge',       array['site_visitors','config_maturite','contacts'],      array['contacts','leads','site_visitors','gmail_drafts','gmail_sent','audits','whatsapp'], 'mixte', false),
  ('10-onboarding-pilot',   'Onboarding Pilot',     array['deals','contacts','contracts'],                    array['deals','onboarding_tasks','gmail_drafts','calendar','audits'], 'mixte', false),
  ('11-postmortem-scribe',  'Postmortem Scribe',    array['fathom','deals','factures'],                       array['postmortems','audits'], 'pleine', false),
  ('12-compliance-sentinel','Compliance Sentinel',  array['agents','agents_runs','audits','agent_budget'],    array['agents','incidents','audits','whatsapp'], 'pleine', true),
  ('13-board-reporter',     'Board Reporter',       array['factures','okrs','deals','agents_runs','audits'],  array['board_packs','audits'], 'pleine', false),
  ('00-daily-conductor',    'Daily Conductor',      array['*'],                                               array['live_artifact','whatsapp','audits'], 'pleine', false)
on conflict (id) do nothing;

-- =====================================================================
-- 10) Bootstrap des budgets
-- =====================================================================
insert into public.agent_budget (agent_id, tokens_max_jour, envois_externes_max_jour)
  select id, 100000,
         case when autonomie = 'pleine' then 0
              when autonomie = 'mixte' then 10
              else 5 end
  from public.agents
  on conflict (agent_id) do nothing;

-- =====================================================================
-- 11) RLS permissif V0
-- =====================================================================
alter table public.agents          enable row level security;
alter table public.agent_prompts   enable row level security;
alter table public.agents_runs     enable row level security;
alter table public.agent_budget    enable row level security;
alter table public.incidents       enable row level security;
alter table public.audits          enable row level security;
alter table public.site_visitors   enable row level security;
alter table public.config_maturite enable row level security;
alter table public.leads           enable row level security;

drop policy if exists "dev_open_agents"          on public.agents;
drop policy if exists "dev_open_agent_prompts"   on public.agent_prompts;
drop policy if exists "dev_open_agents_runs"     on public.agents_runs;
drop policy if exists "dev_open_agent_budget"    on public.agent_budget;
drop policy if exists "dev_open_incidents"       on public.incidents;
drop policy if exists "dev_open_audits"          on public.audits;
drop policy if exists "dev_open_site_visitors"   on public.site_visitors;
drop policy if exists "dev_open_config_maturite" on public.config_maturite;
drop policy if exists "dev_open_leads"           on public.leads;

create policy "dev_open_agents"          on public.agents          for all using (true) with check (true);
create policy "dev_open_agent_prompts"   on public.agent_prompts   for all using (true) with check (true);
create policy "dev_open_agents_runs"     on public.agents_runs     for all using (true) with check (true);
create policy "dev_open_agent_budget"    on public.agent_budget    for all using (true) with check (true);
create policy "dev_open_incidents"       on public.incidents       for all using (true) with check (true);
create policy "dev_open_audits"          on public.audits          for all using (true) with check (true);
create policy "dev_open_site_visitors"   on public.site_visitors   for all using (true) with check (true);
create policy "dev_open_config_maturite" on public.config_maturite for all using (true) with check (true);
create policy "dev_open_leads"           on public.leads           for all using (true) with check (true);
