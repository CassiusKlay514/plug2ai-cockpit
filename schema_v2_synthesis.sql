-- =====================================================================
-- PLUG2AI COCKPIT — v0.2 vues de synthèse pour Home + CFO narrative
-- =====================================================================

drop view if exists public.charges_par_categorie cascade;
drop view if exists public.synthese_globale cascade;

-- Charges agrégées par catégorie (pour CFO narrative)
create view public.charges_par_categorie as
select
  coalesce(categorie, 'Non catégorisé')  as categorie,
  count(*)                              as n_ops,
  sum(abs(montant_ttc))::numeric(12,2)  as total_ttc,
  sum(abs(montant_ht))::numeric(12,2)   as total_ht
from public.transactions
where impact_compta = 'Charges'
   or (montant_ttc < 0 and categorie is not null)
group by categorie
order by total_ttc desc;

-- Synthèse globale (utilisée par page Accueil)
create view public.synthese_globale as
with
  contacts_stats as (
    select
      count(*)                                                       as n_contacts,
      count(*) filter (where statut = 'CLIENT_SIGNE')                as n_clients,
      count(*) filter (where statut = 'PROSPECT_CHAUD')              as n_prospects_chauds,
      count(*) filter (where statut like 'PROSPECT_%')               as n_prospects,
      count(*) filter (where statut in ('CLIENT_SIGNE'))             as n_facturables
    from public.contacts
  ),
  factures_stats as (
    select
      count(*)                                                       as n_factures,
      coalesce(sum(montant_eur), 0)::numeric(12,2)                  as ca_factur_ttc
    from public.factures
  ),
  cfo as (
    select * from public.cfo_kpis
  ),
  premiere_op as (
    select min(date_op) as date_debut from public.transactions
  )
select
  (select n_contacts        from contacts_stats) as n_contacts,
  (select n_clients         from contacts_stats) as n_clients,
  (select n_prospects       from contacts_stats) as n_prospects,
  (select n_prospects_chauds from contacts_stats) as n_prospects_chauds,
  (select n_factures        from factures_stats) as n_factures,
  (select ca_factur_ttc     from factures_stats) as ca_factur_ttc,
  (select ca_ht_total       from cfo)            as ca_ht_total,
  (select ca_ttc_total      from cfo)            as ca_ttc_total,
  (select charges_ttc_total from cfo)            as charges_ttc_total,
  (select charges_30j       from cfo)            as charges_30j,
  (select ca_30j            from cfo)            as ca_30j,
  (select derniere_op       from cfo)            as derniere_op,
  (select date_debut        from premiere_op)    as date_debut_activite,
  -- métriques dérivées
  ((select ca_ht_total from cfo) - (select charges_ttc_total from cfo))::numeric(12,2)
                                                  as resultat_net_estime;
