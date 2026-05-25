import { useEffect, useState } from 'react'
import { supabase } from './supabase.js'

// Hook unifié qui charge toutes les données utiles à TOUS les modules CxO.
// Évite les requêtes en doublon et donne un état partagé.
export default function useExecutiveData() {
  const [data, setData]     = useState({})
  const [loading, setLoad]  = useState(true)
  const [error, setErr]     = useState(null)

  useEffect(() => {
    let alive = true
    async function load() {
      setLoad(true); setErr(null)
      try {
        const [s, contacts, fact, fournisseurs, charges, ca, tx, interactions, deals] = await Promise.all([
          supabase.from('synthese_globale').select('*').single(),
          supabase.from('contacts').select('*').limit(2000),
          supabase.from('factures').select('*'),
          supabase.from('fournisseurs').select('*').limit(50),
          supabase.from('charges_par_categorie').select('*'),
          supabase.from('ca_par_client').select('*').order('total_ht', { ascending: false, nullsFirst: false }),
          supabase.from('transactions').select('id,date_op,intitule,montant_ttc,categorie,impact_compta')
            .order('date_op', { ascending: false }).limit(200),
          supabase.from('interactions').select('*').limit(500),
          supabase.from('deals').select('*'),
        ])
        if (!alive) return
        const errors = [s, contacts, fact, fournisseurs, charges, ca, tx, interactions, deals]
          .map(r => r.error).filter(Boolean)
        if (errors.length) throw errors[0]

        // dérivations
        const contactsList = contacts.data ?? []
        const txList       = tx.data ?? []
        const chargesList  = charges.data ?? []

        // Vagues de campagne distinctes
        const vagues = {}
        contactsList.forEach(c => {
          if (!c.vague_campagne) return
          if (!vagues[c.vague_campagne]) vagues[c.vague_campagne] = { code: c.vague_campagne, total: 0, signes: 0, chauds: 0 }
          vagues[c.vague_campagne].total++
          if (c.statut === 'CLIENT_SIGNE') vagues[c.vague_campagne].signes++
          if (c.statut === 'PROSPECT_CHAUD') vagues[c.vague_campagne].chauds++
        })
        const vaguesList = Object.values(vagues).sort((a,b) => b.total - a.total)

        // Catégories de prospect (depuis champ categorie)
        const cats = {}
        contactsList.forEach(c => {
          if (!c.categorie) return
          cats[c.categorie] = (cats[c.categorie] ?? 0) + 1
        })
        const catsList = Object.entries(cats).map(([k,n]) => ({ categorie: k, n })).sort((a,b) => b.n - a.n)

        // Outils SaaS récurrents : transactions avec intitulé répété en charges
        const tools = {}
        txList.forEach(t => {
          if (t.impact_compta !== 'Charges' && !(Number(t.montant_ttc) < 0 && t.categorie)) return
          if (!t.intitule) return
          const key = normalizeToolName(t.intitule)
          if (!key) return
          if (!tools[key]) tools[key] = { nom: key, n: 0, total: 0, categorie: t.categorie }
          tools[key].n++
          tools[key].total += Math.abs(Number(t.montant_ttc) || 0)
        })
        const toolsList = Object.values(tools)
          .filter(t => t.n >= 2)
          .sort((a,b) => b.total - a.total)

        // Coût SaaS mensuel estimé (basé sur les 3 derniers mois de tools récurrents)
        const now = new Date()
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        let saasTotal3m = 0
        let saasMonthlySum = 0; let saasMonthlyCount = 0
        txList.forEach(t => {
          if (!(t.categorie === 'Logiciels sur abonnement' && Number(t.montant_ttc) < 0)) return
          const d = new Date(t.date_op)
          if (d >= threeMonthsAgo) {
            saasTotal3m += Math.abs(Number(t.montant_ttc) || 0)
          }
        })
        const saasMonthly = saasTotal3m / 3  // estimation mensuelle moyenne

        // Clients signés avec leur CA
        const clientsCA = (ca.data ?? []).filter(c => c.contact_id !== null || c.client !== 'Inconnu')

        // Projets actifs (clients signés)
        const clientsSignes = contactsList.filter(c => c.statut === 'CLIENT_SIGNE')

        setData({
          synth: s.data,
          contacts: contactsList,
          factures: fact.data ?? [],
          fournisseurs: fournisseurs.data ?? [],
          chargesParCategorie: chargesList,
          caParClient: ca.data ?? [],
          transactions: txList,
          interactions: interactions.data ?? [],
          deals: deals.data ?? [],
          vagues: vaguesList,
          categoriesContact: catsList,
          tools: toolsList,
          saasMonthly,
          saasTotal3m,
          clientsCA,
          clientsSignes,
        })
      } catch (e) {
        if (alive) setErr(e.message ?? String(e))
      } finally {
        if (alive) setLoad(false)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  return { data, loading, error }
}

// Normalise un intitulé de transaction en nom d'outil
function normalizeToolName(s) {
  if (!s) return null
  const up = s.toUpperCase()
  // patterns connus
  if (up.includes('OPENAI') || up.includes('CHATGPT')) return 'ChatGPT (OpenAI)'
  if (up.includes('CLAUDE'))   return 'Claude (Anthropic)'
  if (up.includes('LOVABLE'))  return 'Lovable'
  if (up.includes('REPLIT'))   return 'Replit'
  if (up.includes('FRAMER'))   return 'Framer'
  if (up.includes('N8N') || up.includes('PADDLE')) return 'n8n cloud'
  if (up.includes('SUPABASE')) return 'Supabase'
  if (up.includes('CODEUR'))   return 'Codeur.com'
  if (up.includes('FATHOM'))   return 'Fathom'
  if (up.includes('GOOGLE') && up.includes('WORKSPACE')) return 'Google Workspace'
  if (up.includes('GOOGLE ONE')) return 'Google One'
  if (up.includes('MICROSOFT'))  return 'Microsoft 365'
  if (up.includes('COMPTAPLACE')) return 'Comptaplace'
  if (up.includes('LEGALPLACE')) return 'LegalPlace'
  if (up.includes('ARTLIST'))  return 'Artlist'
  if (up.includes('GAMMA'))    return 'Gamma'
  if (up.includes('HOSTINGER'))return 'Hostinger'
  if (up.includes('LA POSTE')) return null
  if (up.includes('AMAZON') || up.includes('AMZN') || up.includes('APPLE.COM')) return null
  if (up.includes('CARD TRANSACTION')) return null
  if (up.includes('DIRECT DEBIT')) return null
  if (up.includes('ASSURANCE')) return null
  if (up.includes('REMBOURSEMENT') || up.includes('NDF')) return null
  if (up.includes('SFR') || up.includes('ORANGE')) return null
  return null
}
