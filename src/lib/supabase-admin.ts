import { createClient } from '@supabase/supabase-js'

// ATENÇÃO: usa a service role key — bypassa RLS. Só pode ser importado
// em código server-side (API routes / server actions), NUNCA em código
// que roda no navegador. Não importe este arquivo em componentes 'use client'.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key'

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})
