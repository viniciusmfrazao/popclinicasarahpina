import { createClient } from '@supabase/supabase-js'

// Fallbacks vazios para o build não quebrar — valores reais vêm das env vars do Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseKey)
