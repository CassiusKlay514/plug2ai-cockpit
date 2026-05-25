"""
Sync Fathom → Supabase + traduction FR automatique (si Anthropic key dispo).

Usage : python3 scripts/sync_fathom.py
Variables d'environnement requises :
  FATHOM_API_KEY      - clé Fathom (https://app.fathom.ai/settings/api)
  SUPABASE_DB_URL     - DSN PostgreSQL Supabase (Settings > Database)
  ANTHROPIC_API_KEY   - (optionnel) pour traduction FR automatique

Comportement :
  1. Pull toutes les réunions Fathom avec summary + action items
  2. Ne ré-importe pas les réunions déjà en base (par fathom_id)
  3. Détecte huis_clos = INTERNE + participants {Jonathan, Espoir}
  4. Si ANTHROPIC_API_KEY présent, traduit le résumé + action items en FR
"""
import os, json, sys
import urllib.request
from datetime import datetime

try:
    import psycopg2
except ImportError:
    sys.exit("Installer psycopg2-binary : pip install psycopg2-binary")

FATHOM_KEY  = os.environ.get("FATHOM_API_KEY", "")
DSN         = os.environ.get("SUPABASE_DB_URL", "")
ANTHROPIC   = os.environ.get("ANTHROPIC_API_KEY", "")

if not FATHOM_KEY: sys.exit("FATHOM_API_KEY manquant.")
if not DSN:        sys.exit("SUPABASE_DB_URL manquant.")

FATHOM_BASE = "https://api.fathom.ai/external/v1"


def fathom_get(path, **params):
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    url = f"{FATHOM_BASE}{path}?{qs}" if qs else f"{FATHOM_BASE}{path}"
    req = urllib.request.Request(url, headers={"X-Api-Key": FATHOM_KEY})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def translate_to_fr(text):
    """Utilise Claude API pour traduire en FR. Retourne text si pas de clé."""
    if not ANTHROPIC or not text:
        return None
    try:
        data = json.dumps({
            "model": "claude-haiku-4-5-20251001",
            "max_tokens": 4096,
            "messages": [{
                "role": "user",
                "content": (
                    "Traduis ce texte de l'anglais vers le français professionnel. "
                    "Conserve la structure markdown, les liens, les noms propres (Jonathan, Cyril, Alexis, etc.), "
                    "les termes techniques (HubSpot, n8n, etc.) et les montants. "
                    "Ne fournis que la traduction, sans commentaire :\n\n" + text
                ),
            }],
        }).encode()
        req = urllib.request.Request(
            "https://api.anthropic.com/v1/messages",
            data=data,
            headers={
                "x-api-key": ANTHROPIC,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
        )
        with urllib.request.urlopen(req, timeout=60) as r:
            resp = json.loads(r.read())
        return resp["content"][0]["text"]
    except Exception as e:
        print(f"  ! traduction échouée : {e}")
        return None


def detect_type_reunion(m):
    dom = m.get("calendar_invitees_domains_type")
    if dom == "only_internal":
        return "INTERNE"
    invitees = m.get("calendar_invitees") or []
    if any(i.get("is_external") for i in invitees):
        return "CLIENT"
    return "AUTRE"


def detect_huis_clos(participants_text):
    p = (participants_text or "").lower()
    return ("doseitpro" in p) and ("jonathan gomez" in p or "jonathnan.gomez" in p)


def fetch_all_meetings():
    meetings, cursor = [], None
    while True:
        params = {"include_summary": "true", "include_action_items": "true", "limit": 50}
        if cursor: params["cursor"] = cursor
        data = fathom_get("/meetings", **params)
        meetings.extend(data.get("items", []))
        cursor = data.get("next_cursor")
        if not cursor or len(meetings) > 500: break
    return meetings


def main():
    print("→ pull Fathom…")
    meetings = fetch_all_meetings()
    print(f"  {len(meetings)} réunions reçues")

    conn = psycopg2.connect(DSN, connect_timeout=15)
    conn.autocommit = False
    cur = conn.cursor()

    cur.execute("select id, email from public.contacts where email is not null")
    by_email = {r[1].lower(): r[0] for r in cur.fetchall()}

    n_new_meetings, n_new_taches, n_translated = 0, 0, 0

    for m in meetings:
        fathom_id = str(m.get("recording_id") or "")
        if not fathom_id: continue
        cur.execute("select 1 from public.reunions where fathom_id = %s", (fathom_id,))
        if cur.fetchone(): continue  # déjà importée

        titre = m.get("title") or m.get("meeting_title") or "Sans titre"
        start = m.get("recording_start_time") or m.get("scheduled_start_time")
        if not start: continue

        end = m.get("recording_end_time")
        duree = None
        if end:
            try:
                dt1 = datetime.fromisoformat(start.replace("Z", "+00:00"))
                dt2 = datetime.fromisoformat(end.replace("Z", "+00:00"))
                duree = int((dt2 - dt1).total_seconds() / 60)
            except Exception: pass

        invitees = m.get("calendar_invitees") or []
        participants = ", ".join(i.get("name") or i.get("email") for i in invitees if (i.get("name") or i.get("email")))

        contact_id = None
        for i in invitees:
            if not i.get("is_external"): continue
            email = (i.get("email") or "").lower()
            if email in by_email: contact_id = by_email[email]; break

        type_r = detect_type_reunion(m)
        huis_clos = (type_r == "INTERNE") and detect_huis_clos(participants)

        s = m.get("default_summary") or {}
        resume_en = s.get("markdown_formatted") if isinstance(s, dict) else None
        resume_fr = translate_to_fr(resume_en) if resume_en else None
        if resume_fr: n_translated += 1
        resume_final = resume_fr or resume_en

        cur.execute("""
          insert into public.reunions
            (fathom_id, titre, date_event, duree_minutes, type_reunion,
             participants, participants_json, contact_id,
             resume, resume_en, recording_url, meeting_url, huis_clos, source)
          values (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'fathom')
          returning id
        """, (fathom_id, titre, start, duree, type_r,
              participants, json.dumps(invitees), contact_id,
              resume_final, resume_en, m.get("share_url"), m.get("url"), huis_clos))
        reunion_id = cur.fetchone()[0]
        n_new_meetings += 1

        for ai in (m.get("action_items") or []):
            if not isinstance(ai, dict): continue
            desc_en = ai.get("description")
            if not desc_en: continue
            desc_fr = translate_to_fr(desc_en) if ANTHROPIC else None
            if desc_fr: n_translated += 1
            desc = desc_fr or desc_en

            assignee = ai.get("assignee") or {}
            assignee_name = assignee.get("name") or "Non assigné"
            assignee_email = (assignee.get("email") or "").lower()
            assignee_cid = by_email.get(assignee_email)

            statut = "TERMINE" if ai.get("completed") else "A_FAIRE"
            notes = None
            if ai.get("recording_playback_url"):
                ts = ai.get("recording_timestamp")
                notes = f"À {ts} dans la réunion. " if ts else ""
                notes += f"Lien Fathom : {ai['recording_playback_url']}"

            cur.execute("""
              insert into public.taches
                (description, description_en, notes, assignee_nom, assignee_contact_id,
                 reunion_id, contact_id, statut, huis_clos, source)
              values (%s, %s, %s, %s, %s, %s, %s, %s, %s, 'fathom')
            """, (desc, desc_en, notes, assignee_name, assignee_cid,
                  reunion_id, contact_id, statut, huis_clos))
            n_new_taches += 1

    conn.commit()
    print(f"\n✓ {n_new_meetings} nouvelles réunions")
    print(f"✓ {n_new_taches} nouvelles tâches")
    if n_translated:
        print(f"✓ {n_translated} traductions FR via Claude API")
    elif not ANTHROPIC:
        print("ℹ ANTHROPIC_API_KEY absent : import en anglais, pas de traduction")

    cur.close(); conn.close()


if __name__ == "__main__":
    main()
