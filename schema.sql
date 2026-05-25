-- =====================================================================
-- PLUG2AI COCKPIT - Schéma minimal v0.1
-- =====================================================================
-- Principe : Supabase = source unique. Plus jamais de CSV éparpillés.
-- Tables : contacts, interactions, deals, factures.
-- =====================================================================

-- Suppression idempotente (utile pour ré-appliquer le schéma en dev)
drop table if exists public.factures cascade;
drop table if exists public.interactions cascade;
drop table if exists public.deals cascade;
drop table if exists public.contacts cascade;

-- =====================================================================
-- CONTACTS — toute personne en lien avec Plug2AI
-- =====================================================================
create table public.contacts (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- identité
  prenom          text,
  nom             text,
  societe         text,
  fonction        text,
  email           text,
  telephone       text,
  linkedin_url    text,

  -- segmentation
  statut          text not null default 'PROSPECT_FROID'
                  check (statut in (
                    'CLIENT_SIGNE',
                    'PROSPECT_CHAUD',
                    'PROSPECT_PUBLIC',
                    'PROSPECT_PARTENAIRE',
                    'PROSPECT_WEALTH',
                    'PROSPECT_CGP',
                    'PROSPECT_SECTORIEL',
                    'PROSPECT_FROID',
                    'EQUIPE',
                    'COMPTABLE',
                    'PERDU'
                  )),
  categorie       text,           -- libre : Wealth Mgmt, Avocats, Auto, etc.
  vague_campagne  text,           -- libre : Wealth-CGP-Mai, Avril-29-Avril, etc.

  -- scoring
  score           int not null default 0 check (score between 0 and 100),
  derniere_interaction_at timestamptz,

  -- état
  email_valide    boolean not null default true,
  notes           text,
  action_suivante text,

  -- origine
  source          text default 'import_csv'
);

create index contacts_statut_idx     on public.contacts (statut);
create index contacts_score_idx      on public.contacts (score desc);
create index contacts_societe_idx    on public.contacts (societe);
create index contacts_categorie_idx  on public.contacts (categorie);

-- =====================================================================
-- INTERACTIONS — chaque mail, RDV, appel, note
-- =====================================================================
create table public.interactions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  contact_id    uuid references public.contacts(id) on delete cascade,

  type          text not null check (type in (
                  'MAIL_SORTANT', 'MAIL_ENTRANT',
                  'APPEL', 'RDV', 'NOTE', 'WHATSAPP',
                  'LINKEDIN', 'AUTRE'
                )),
  sujet         text,
  contenu       text,
  date_event    timestamptz not null default now(),

  -- traçabilité
  source_externe_id text,   -- ex: Gmail thread id
  source_url    text
);

create index interactions_contact_idx on public.interactions (contact_id);
create index interactions_date_idx    on public.interactions (date_event desc);

-- =====================================================================
-- DEALS — opportunités commerciales
-- =====================================================================
create table public.deals (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  contact_id      uuid references public.contacts(id) on delete set null,
  titre           text not null,
  description     text,

  -- pipeline
  phase           text not null default 'QUALIFICATION'
                  check (phase in (
                    'QUALIFICATION', 'PROPOSITION_ENVOYEE',
                    'NEGOCIATION', 'GAGNE', 'PERDU'
                  )),
  montant_eur     numeric(12,2),
  probabilite     int default 50 check (probabilite between 0 and 100),
  date_signature_prevue date,
  date_signature_reelle date,

  notes           text
);

create index deals_phase_idx   on public.deals (phase);
create index deals_contact_idx on public.deals (contact_id);

-- =====================================================================
-- FACTURES — émises, en cours, payées
-- =====================================================================
create table public.factures (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  deal_id       uuid references public.deals(id) on delete set null,
  contact_id    uuid references public.contacts(id) on delete set null,

  numero        text,
  montant_eur   numeric(12,2) not null,
  date_emission date not null default current_date,
  date_echeance date,
  date_paiement date,

  statut        text not null default 'EMISE'
                check (statut in ('EMISE', 'PAYEE', 'IMPAYEE', 'ANNULEE')),

  url_pdf       text,
  notes         text
);

create index factures_statut_idx  on public.factures (statut);
create index factures_contact_idx on public.factures (contact_id);

-- =====================================================================
-- TRIGGERS - mise à jour automatique de updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

create trigger deals_updated_at before update on public.deals
  for each row execute function public.set_updated_at();

-- =====================================================================
-- RLS — verrouillé par défaut. À ouvrir progressivement quand on
-- branchera l'auth utilisateur. Pour le V0, on lit/écrit via service key.
-- =====================================================================
alter table public.contacts    enable row level security;
alter table public.interactions enable row level security;
alter table public.deals       enable row level security;
alter table public.factures    enable row level security;

-- politique permissive temporaire (V0 single-user dev)
-- À remplacer par auth.uid() quand on ajoutera les utilisateurs
create policy "dev_open_contacts"     on public.contacts     for all using (true) with check (true);
create policy "dev_open_interactions" on public.interactions for all using (true) with check (true);
create policy "dev_open_deals"        on public.deals        for all using (true) with check (true);
create policy "dev_open_factures"     on public.factures     for all using (true) with check (true);
