-- =====================================================================
-- PLUG2AI COCKPIT — v0.3 Module VI Agenda
-- Tables : reunions (Fathom + manuelles), taches (action items par personne)
-- =====================================================================

drop table if exists public.taches cascade;
drop table if exists public.reunions cascade;

-- =====================================================================
-- RÉUNIONS — comptes-rendus de réunions (Fathom + manuelles)
-- =====================================================================
create table public.reunions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- identifiant Fathom (unique si import auto)
  fathom_id       text unique,

  -- métadonnées de la réunion
  titre           text not null,
  date_event      timestamptz not null,
  duree_minutes   int,

  -- type / nature
  type_reunion    text not null default 'CLIENT'
                  check (type_reunion in ('CLIENT','INTERNE','PROSPECT','PARTENAIRE','AUTRE')),

  -- participants (texte libre + JSON)
  participants    text,           -- séparés par virgule
  participants_json jsonb,         -- structure détaillée si dispo
  contact_id      uuid references public.contacts(id) on delete set null,

  -- contenu
  resume          text,           -- résumé Fathom ou rédigé manuellement
  transcript_url  text,           -- URL de la transcription
  recording_url   text,           -- URL Fathom replay
  meeting_url     text,           -- URL Fathom

  -- meta
  source          text default 'fathom'
);

create index reunions_date_idx      on public.reunions (date_event desc);
create index reunions_type_idx      on public.reunions (type_reunion);
create index reunions_contact_idx   on public.reunions (contact_id);

-- =====================================================================
-- TÂCHES — action items, rangées par personne assignée
-- =====================================================================
create table public.taches (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- contenu
  description     text not null,
  notes           text,

  -- assignation (texte libre OU lien contact)
  assignee_nom    text not null default 'Non assigné',
  assignee_contact_id uuid references public.contacts(id) on delete set null,

  -- contexte
  reunion_id      uuid references public.reunions(id) on delete set null,
  contact_id      uuid references public.contacts(id) on delete set null,
                  -- contact "client" lié à la tâche (≠ assignee)

  -- état
  statut          text not null default 'A_FAIRE'
                  check (statut in ('A_FAIRE','EN_COURS','TERMINE','ANNULE')),
  priorite        text default 'NORMALE'
                  check (priorite in ('BASSE','NORMALE','HAUTE','CRITIQUE')),
  date_echeance   date,
  date_completion timestamptz,

  -- meta
  source          text default 'manuelle',   -- 'manuelle', 'fathom', 'auto'
  fathom_id       text                       -- id Fathom de l'action item si auto
);

create index taches_assignee_idx on public.taches (assignee_nom);
create index taches_statut_idx   on public.taches (statut);
create index taches_reunion_idx  on public.taches (reunion_id);
create index taches_date_idx     on public.taches (date_echeance);

-- =====================================================================
-- TRIGGERS
-- =====================================================================
create trigger reunions_updated_at before update on public.reunions
  for each row execute function public.set_updated_at();

create trigger taches_updated_at before update on public.taches
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS — permissif pour V0
-- =====================================================================
alter table public.reunions enable row level security;
alter table public.taches   enable row level security;

create policy "dev_open_reunions" on public.reunions for all using (true) with check (true);
create policy "dev_open_taches"   on public.taches   for all using (true) with check (true);

-- =====================================================================
-- VUES utiles
-- =====================================================================
create or replace view public.taches_par_assignee as
select
  assignee_nom,
  count(*) filter (where statut = 'A_FAIRE')    as n_a_faire,
  count(*) filter (where statut = 'EN_COURS')   as n_en_cours,
  count(*) filter (where statut = 'TERMINE')    as n_terminees,
  count(*)                                       as n_total
from public.taches
group by assignee_nom
order by n_total desc;
