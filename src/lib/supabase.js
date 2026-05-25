import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  // ne casse pas l'app, juste un warning visible
  console.warn('⚠️  VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant. Voir .env.local')
}

export const supabase = createClient(url ?? '', key ?? '')
