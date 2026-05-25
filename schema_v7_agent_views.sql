-- =====================================================================
-- PLUG2AI COCKPIT — v0.7 vues utilitaires pour Module X Flotte d'Agents
-- =====================================================================

drop view if exists public.agent_health cascade;
drop view if exists public.incidents_open cascade;
drop view if exists public.agents_runs_recent cascade;

-- =====================================================================
-- agent_health : 1 ligne par agent avec son état courant
-- =====================================================================
create view public.agent_health as
select
  a.id,
  a.nom,
  a.autonomie,
  a.actif,
  a.killed_at,
  a.killed_reason,
  array_length(a.scope_read,  1) as n_scope_read,
  array_length(a.scope_write, 1) as n_scope_write,

  -- dernier run
  (select max(started_at) from public.agents_runs r where r.agent_id = a.id) as dernier_run_at,
  (select status         from public.agents_runs r where r.agent_id = a.id order by started_at desc limit 1) as dernier_status,
  (select output_summary from public.agents_runs r where r.agent_id = a.id order by started_at desc limit 1) as dernier_resume,

  -- compteurs 24h
  (select count(*) from public.agents_runs r where r.agent_id = a.id and r.started_at > now() - interval '24 hours') as n_runs_24h,
  (select count(*) from public.agents_runs r where r.agent_id = a.id and r.status = 'success' and r.started_at > now() - interval '24 hours') as n_success_24h,
  (select count(*) from public.agents_runs r where r.agent_id = a.id and r.status = 'error'   and r.started_at > now() - interval '24 hours') as n_errors_24h,

  -- incidents
  (select count(*) from public.incidents i where i.agent_id = a.id and i.resolu = false) as n_incidents_open,
  (select max(created_at) from public.incidents i where i.agent_id = a.id) as dernier_incident_at,

  -- budgets
  (select tokens_used_jour          from public.agent_budget b where b.agent_id = a.id) as tokens_used_jour,
  (select tokens_max_jour           from public.agent_budget b where b.agent_id = a.id) as tokens_max_jour,
  (select envois_externes_used_jour from public.agent_budget b where b.agent_id = a.id) as envois_externes_used_jour,
  (select envois_externes_max_jour  from public.agent_budget b where b.agent_id = a.id) as envois_externes_max_jour
from public.agents a
order by a.id;

-- =====================================================================
-- incidents_open : incidents non résolus, joints à l'agent
-- =====================================================================
create view public.incidents_open as
select
  i.id,
  i.agent_id,
  a.nom as agent_nom,
  i.severite,
  i.type,
  i.description,
  i.payload,
  i.created_at,
  extract(epoch from (now() - i.created_at))/3600 as heures_ouvert
from public.incidents i
left join public.agents a on a.id = i.agent_id
where i.resolu = false
order by
  case i.severite when 'P0' then 0 when 'P1' then 1 when 'P2' then 2 else 3 end,
  i.created_at desc;

-- =====================================================================
-- agents_runs_recent : 100 derniers runs tous agents confondus
-- =====================================================================
create view public.agents_runs_recent as
select
  r.id,
  r.agent_id,
  a.nom as agent_nom,
  r.started_at,
  r.ended_at,
  r.status,
  r.output_summary,
  r.next_action,
  r.tokens_used,
  r.envois_externes,
  extract(epoch from (coalesce(r.ended_at, now()) - r.started_at)) as duree_sec
from public.agents_runs r
left join public.agents a on a.id = r.agent_id
order by r.started_at desc
limit 100;
