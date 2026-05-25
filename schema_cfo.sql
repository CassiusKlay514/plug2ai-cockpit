-- =====================================================================
-- PLUG2AI COCKPIT — Extension Module CFO v0.1
-- =====================================================================
-- Ajoute : transactions (Qonto), paiements_stripe, vue fournisseurs
-- Enrichit : factures (lien avec transactions/Stripe)
-- =====================================================================

-- Suppression idempotente
drop view  if exists public.fournisseurs cascade;
drop view  if exists public.cfo_kpis cascade;
drop view  if exists public.ca_par_client cascade;
drop view  if exists public.charges_par_mois cascade;
drop table if exists public.paiements_stripe cascade;
drop table if exists public.transactions cascade;

-- =====================================================================
-- TRANSACTIONS — toutes les opérations bancaires (Qonto)
-- =====================================================================
create table public.transactions (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  -- identifiant Qonto (unique)
  source_id       text unique,

  -- date & nature
  date_op         date not null,
  type_op         text,        -- CarteEnLigne, Virement, Prélèvement, VirementInstantané, etc.
  intitule        text,

  -- montants (négatif = charge, positif = revenu)
  montant_ttc     numeric(12,2) not null,
  montant_ht      numeric(12,2),
  tva_collectee   numeric(12,2) default 0,
  tva_deductible  numeric(12,2) default 0,
  taux_tva        numeric(5,2),
  devise          text default 'EUR',

  -- classification
  categorie       text,
  geographie      text,
  immobilisation  boolean default false,
  statut_compta   text,
  impact_compta   text,        -- Charges / Chiffre d'affaires / Aucun
  source_categ    text,        -- IA / Utilisateur / Utilisateur en masse

  -- liens
  contact_id      uuid references public.contacts(id) on delete set null,
  facture_id      uuid references public.factures(id) on delete set null,

  -- meta
  commentaire     text,
  reliee_a        text,
  informations    text,
  source          text default 'qonto_csv'
);

create index transactions_date_idx      on public.transactions (date_op desc);
create index transactions_type_idx      on public.transactions (type_op);
create index transactions_categorie_idx on public.transactions (categorie);
create index transactions_intitule_idx  on public.transactions (intitule);
create index transactions_impact_idx    on public.transactions (impact_compta);

-- =====================================================================
-- PAIEMENTS STRIPE
-- =====================================================================
create table public.paiements_stripe (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),

  stripe_id       text unique,
  type_op         text not null,   -- Charge, Stripe Fee
  date_op         timestamptz not null,
  description     text,

  montant_brut    numeric(12,2) not null,
  frais           numeric(12,2) default 0,
  montant_net     numeric(12,2),
  devise          text default 'EUR',

  customer_id     text,
  customer_email  text,
  customer_name   text,

  contact_id      uuid references public.contacts(id) on delete set null,
  facture_id      uuid references public.factures(id) on delete set null,

  source          text default 'stripe_csv'
);

create index stripe_date_idx     on public.paiements_stripe (date_op desc);
create index stripe_email_idx    on public.paiements_stripe (customer_email);

-- =====================================================================
-- VUES — pré-calcul de quelques KPIs CFO
-- =====================================================================

-- Fournisseurs récurrents (au moins 2 transactions négatives)
create view public.fournisseurs as
select
  intitule                              as nom,
  categorie,
  count(*)                              as n_transactions,
  sum(abs(montant_ttc))::numeric(12,2)  as total_paye_ttc,
  avg(abs(montant_ttc))::numeric(12,2)  as moyenne_ttc,
  min(date_op)                          as premiere_op,
  max(date_op)                          as derniere_op
from public.transactions
where montant_ttc < 0
  and intitule is not null
group by intitule, categorie
having count(*) >= 2
order by total_paye_ttc desc;

-- CA par client (revenus identifiés via transactions Virement type "Prestations de services")
create view public.ca_par_client as
select
  coalesce(c.societe, t.reliee_a, t.intitule, 'Inconnu') as client,
  c.id                                                   as contact_id,
  count(*)                                               as n_factures,
  sum(t.montant_ht)::numeric(12,2)                       as total_ht,
  sum(t.montant_ttc)::numeric(12,2)                      as total_ttc,
  min(t.date_op)                                         as premiere_facture,
  max(t.date_op)                                         as derniere_facture
from public.transactions t
left join public.contacts c on c.id = t.contact_id
where t.impact_compta = 'Chiffre d''affaires'
   or (t.montant_ttc > 0 and t.categorie = 'Prestations de services')
group by coalesce(c.societe, t.reliee_a, t.intitule, 'Inconnu'), c.id
order by total_ht desc nulls last;

-- Charges par mois
create view public.charges_par_mois as
select
  date_trunc('month', date_op)::date    as mois,
  count(*)                              as n_charges,
  sum(abs(montant_ttc))::numeric(12,2)  as total_ttc,
  sum(abs(montant_ht))::numeric(12,2)   as total_ht
from public.transactions
where impact_compta = 'Charges'
   or (montant_ttc < 0 and categorie is not null)
group by date_trunc('month', date_op)
order by mois desc;

-- KPIs CFO synthétiques
create view public.cfo_kpis as
with
  ca as (
    select sum(montant_ht)::numeric(12,2) as ca_ht
    from public.transactions
    where impact_compta = 'Chiffre d''affaires'
  ),
  ca_ttc as (
    select sum(montant_ttc)::numeric(12,2) as ca_ttc
    from public.transactions
    where impact_compta = 'Chiffre d''affaires'
  ),
  charges as (
    select sum(abs(montant_ttc))::numeric(12,2) as charges_ttc
    from public.transactions
    where impact_compta = 'Charges'
  ),
  charges_30j as (
    select sum(abs(montant_ttc))::numeric(12,2) as charges_30j
    from public.transactions
    where impact_compta = 'Charges'
      and date_op >= current_date - interval '30 days'
  ),
  ca_30j as (
    select sum(montant_ht)::numeric(12,2) as ca_30j
    from public.transactions
    where impact_compta = 'Chiffre d''affaires'
      and date_op >= current_date - interval '30 days'
  ),
  derniere_tx as (
    select max(date_op) as derniere_date from public.transactions
  ),
  factures_imp as (
    select count(*) as n_impayees,
           coalesce(sum(montant_eur), 0)::numeric(12,2) as montant_impayees
    from public.factures
    where statut = 'IMPAYEE' or (statut = 'EMISE' and date_echeance < current_date)
  )
select
  (select ca_ht from ca)                  as ca_ht_total,
  (select ca_ttc from ca_ttc)             as ca_ttc_total,
  (select charges_ttc from charges)       as charges_ttc_total,
  (select charges_30j from charges_30j)   as charges_30j,
  (select ca_30j from ca_30j)             as ca_30j,
  (select derniere_date from derniere_tx) as derniere_op,
  (select n_impayees from factures_imp)   as n_factures_impayees,
  (select montant_impayees from factures_imp) as montant_impayees;

-- =====================================================================
-- RLS — permissif pour V0
-- =====================================================================
alter table public.transactions    enable row level security;
alter table public.paiements_stripe enable row level security;

create policy "dev_open_transactions"      on public.transactions      for all using (true) with check (true);
create policy "dev_open_paiements_stripe"  on public.paiements_stripe  for all using (true) with check (true);
