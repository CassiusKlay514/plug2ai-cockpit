/**
 * Plug2AI · Codeur Scout — Apify Actor
 *
 * Scrape codeur.com :
 *  - projets postés sur /projects/c/ia
 *  - messages dans /users/<id>/messages
 *
 * Écrit dans Supabase :
 *  - codeur_projets, codeur_messages, apify_runs
 *
 * Modes :
 *  - test         : log only, no DB write
 *  - full         : 1er import historique (900+ msgs)
 *  - incremental  : runs courants toutes les 2h
 *
 * Variables d'env requises :
 *  CODEUR_EMAIL, CODEUR_PASSWORD,
 *  SUPABASE_URL, SUPABASE_SECRET_KEY,
 *  MODE (default 'incremental')
 */

import { Actor } from 'apify'
import { chromium } from 'playwright'

const MODE = process.env.MODE || 'incremental'
const HEADFUL = process.env.HEADFUL === '1'

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY

// Mots-clés de pertinence Plug2AI
const KEYWORDS_HOT = [
  'agent ia', 'agent ai',
  'chatbot',
  'automatisation', 'automation',
  'crm ia', 'crm ai',
  'saas audit',
  'rag', 'retrieval augmented',
  'n8n', 'make.com',
  'claude api', 'openai api',
  'cgp', 'conseil patrimoine', 'wealth',
  'cabinet avocat',
]

await Actor.init()

const runStartedAt = new Date()
const runStats = {
  pages_scraped: 0,
  items_extracted: 0,
  errors_count: 0,
  projets_inserted: 0,
  projets_updated: 0,
  messages_inserted: 0,
  messages_updated: 0,
  errors: [],
}

// ============================================================
// 1. SUPABASE CLIENT MINIMAL
// ============================================================
async function supabaseUpsert(table, rows, onConflict) {
  if (!rows.length) return { count: 0 }
  if (MODE === 'test') {
    console.log(`  [TEST mode] would upsert ${rows.length} rows into ${table}`)
    return { count: rows.length }
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?on_conflict=${onConflict}`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(rows),
  })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Supabase upsert ${table} failed: ${res.status} ${txt.slice(0, 200)}`)
  }
  return { count: rows.length }
}

async function supabaseLogRun(status, opts = {}) {
  if (MODE === 'test') return
  const body = {
    apify_run_id: Actor.getEnv().actorRunId || `local-${Date.now()}`,
    actor_id: 'codeur-scout',
    actor_name: 'Codeur Scout',
    started_at: runStartedAt.toISOString(),
    finished_at: new Date().toISOString(),
    status,
    duration_sec: Math.floor((Date.now() - runStartedAt.getTime()) / 1000),
    pages_scraped: runStats.pages_scraped,
    items_extracted: runStats.items_extracted,
    errors_count: runStats.errors_count,
    output_summary: { ...runStats, mode: MODE, ...opts },
  }
  await fetch(`${SUPABASE_URL}/rest/v1/apify_runs`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(body),
  })
}

// ============================================================
// 2. SCORING
// ============================================================
function computeScore(projet) {
  const txt = (projet.titre + ' ' + (projet.description || '')).toLowerCase()
  let score = 0
  let matched = []
  KEYWORDS_HOT.forEach(kw => {
    if (txt.includes(kw)) { score += 20; matched.push(kw) }
  })
  if (projet.budget_max_eur && projet.budget_max_eur >= 2000) score += 10
  if (projet.urgent) score += 10
  if (projet.n_offres !== undefined && projet.n_offres < 3) score += 5
  return {
    score: Math.min(score, 100),
    raison: matched.length ? `Mots-clés : ${matched.join(', ')}` : 'Aucun match keyword',
  }
}

// ============================================================
// 3. SCRAPING
// ============================================================
async function login(page) {
  console.log('→ Login...')
  await page.goto('https://www.codeur.com/users/sign_in', { waitUntil: 'domcontentloaded' })
  await page.fill('input[name="user[email]"]', process.env.CODEUR_EMAIL)
  await page.fill('input[name="user[password]"]', process.env.CODEUR_PASSWORD)
  await page.click('button[type="submit"]')
  await page.waitForLoadState('networkidle')
  const url = page.url()
  if (url.includes('sign_in')) {
    throw new Error('Login failed: still on sign_in page')
  }
  console.log('✓ Logged in')
}

async function scrapeProjets(page) {
  console.log('→ Scraping projets /projects/c/ia...')
  await page.goto('https://www.codeur.com/projects/c/ia', { waitUntil: 'networkidle' })
  runStats.pages_scraped++

  const projets = await page.evaluate(() => {
    const cards = document.querySelectorAll('.project-card, article[data-project-id]')
    return Array.from(cards).slice(0, 30).map(card => {
      const link = card.querySelector('a[href*="/projects/"]')
      const codeur_id = link?.href.match(/\/projects\/(\d+)/)?.[1]
      return {
        codeur_id,
        url: link?.href,
        titre: card.querySelector('h2,h3')?.innerText.trim(),
        description: card.querySelector('.description,.project-description')?.innerText.trim(),
        budget_label: card.querySelector('.budget,.price')?.innerText.trim(),
        n_offres: parseInt(card.querySelector('.offers-count')?.innerText || '0', 10),
        urgent: !!card.querySelector('.urgent,.badge-urgent'),
        date_pub_text: card.querySelector('time')?.dateTime,
      }
    }).filter(p => p.codeur_id)
  })

  console.log(`  ${projets.length} projets détectés`)
  runStats.items_extracted += projets.length

  // enrichissement scoring + parsing budget
  const projetsEnriched = projets.map(p => {
    const { score, raison } = computeScore(p)
    let bmin = null, bmax = null
    if (p.budget_label) {
      const moins = p.budget_label.match(/moins de (\d+)/i)
      const range = p.budget_label.match(/(\d+)\s*-\s*(\d+)/i)
      if (range) { bmin = parseInt(range[1]); bmax = parseInt(range[2]) }
      else if (moins) { bmax = parseInt(moins[1]) }
    }
    return {
      codeur_id: p.codeur_id,
      url: p.url,
      titre: p.titre,
      description: p.description,
      budget_label: p.budget_label,
      budget_min_eur: bmin,
      budget_max_eur: bmax,
      n_offres: p.n_offres,
      urgent: p.urgent,
      date_pub: p.date_pub_text || null,
      categorie: 'IA',
      score_pertinence: score,
      raison_score: raison,
      statut_codeur: 'Ouvert',
      raw_payload: p,
    }
  })

  const { count } = await supabaseUpsert('codeur_projets', projetsEnriched, 'codeur_id')
  runStats.projets_inserted = count
  console.log(`✓ ${count} projets upserted`)
}

async function scrapeMessages(page, full = false) {
  console.log(`→ Scraping messages (full=${full})...`)
  await page.goto('https://www.codeur.com/users/me/messages', { waitUntil: 'networkidle' })
  runStats.pages_scraped++

  // TODO: parser la liste des threads, paginer, extraire chaque message
  // Pour V0 : on log juste l'URL et on retourne 0 messages
  // L'implémentation détaillée du parsing dépend du HTML exact de Codeur
  // qu'on confirmera au premier run en local

  console.log('  [TODO] message parsing à implémenter une fois HTML inspecté en local')
  runStats.messages_inserted = 0
}

// ============================================================
// 4. MAIN
// ============================================================
const browser = await chromium.launch({ headless: !HEADFUL })
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
})
const page = await context.newPage()

try {
  await login(page)
  await scrapeProjets(page)
  if (MODE === 'full' || MODE === 'incremental') {
    await scrapeMessages(page, MODE === 'full')
  }
  await supabaseLogRun('SUCCEEDED')
  console.log('\n✓ Run terminé', runStats)
} catch (e) {
  runStats.errors_count++
  runStats.errors.push(String(e.message || e))
  console.error('✗ Run failed:', e)
  await supabaseLogRun('FAILED')
  process.exitCode = 1
} finally {
  await browser.close()
  await Actor.exit()
}
