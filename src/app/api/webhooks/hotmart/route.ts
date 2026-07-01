import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

// Eventos que liberam/renovam acesso
const GRANT_EVENTS = new Set([
  'PURCHASE_APPROVED',
  'PURCHASE_COMPLETE',
  'SUBSCRIPTION_REACTIVATED',
])

// Eventos que revogam acesso
const REVOKE_EVENTS = new Set([
  'PURCHASE_CANCELED',
  'PURCHASE_CANCELLED',
  'PURCHASE_REFUNDED',
  'PURCHASE_CHARGEBACK',
  'PURCHASE_EXPIRED',
  'SUBSCRIPTION_CANCELLATION',
  'PURCHASE_PROTEST',
])

interface HotmartPayload {
  event: string
  data?: {
    buyer?: { email?: string; name?: string }
    purchase?: { transaction?: string; status?: string }
    subscription?: { status?: string }
  }
}

export async function POST(req: NextRequest) {
  // 1. Autenticação via Hottok (cabeçalho enviado pela Hotmart)
  const expectedHottok = process.env.HOTMART_HOTTOK
  const receivedHottok = req.headers.get('x-hotmart-hottok')

  if (!expectedHottok) {
    console.error('HOTMART_HOTTOK não configurado no servidor.')
    return NextResponse.json({ error: 'Servidor não configurado.' }, { status: 500 })
  }
  if (receivedHottok !== expectedHottok) {
    return NextResponse.json({ error: 'Hottok inválido.' }, { status: 401 })
  }

  let payload: HotmartPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const event = payload.event
  const email = payload.data?.buyer?.email?.trim().toLowerCase()
  const name = payload.data?.buyer?.name?.trim()
  const transactionId = payload.data?.purchase?.transaction

  if (!event) {
    return NextResponse.json({ error: 'Evento ausente no payload.' }, { status: 400 })
  }

  // Eventos que não envolvem liberar/revogar acesso (ex: PURCHASE_DELAYED, cart abandonment)
  // apenas confirmamos o recebimento sem tomar ação.
  if (!GRANT_EVENTS.has(event) && !REVOKE_EVENTS.has(event)) {
    return NextResponse.json({ received: true, action: 'ignored', event })
  }

  if (!email) {
    return NextResponse.json({ error: 'E-mail do comprador ausente no payload.' }, { status: 400 })
  }

  try {
    const userId = await findOrCreateUser(email, name)

    if (GRANT_EVENTS.has(event)) {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 35) // 35 dias de folga sobre o ciclo mensal de 30

      await supabaseAdmin.from('profiles').update({
        subscription_status: 'active',
        subscription_expires_at: expiresAt.toISOString(),
        hotmart_transaction_id: transactionId ?? null,
        hotmart_email: email,
        is_active: true,
      }).eq('id', userId)
    }

    if (REVOKE_EVENTS.has(event)) {
      await supabaseAdmin.from('profiles').update({
        subscription_status: 'inactive',
      }).eq('id', userId)
    }

    return NextResponse.json({ received: true, action: GRANT_EVENTS.has(event) ? 'granted' : 'revoked', event })
  } catch (err) {
    console.error('Erro no webhook Hotmart:', err)
    return NextResponse.json({ error: 'Erro ao processar evento.' }, { status: 500 })
  }
}

/**
 * Encontra o usuário pelo e-mail ou cria um novo (enviando convite por e-mail
 * via Supabase Auth, que já leva o link de definição de senha).
 */
async function findOrCreateUser(email: string, name?: string): Promise<string> {
  // Tenta localizar usuário já existente (ex: renovação de assinatura)
  const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listError) throw listError

  const existing = list.users.find(u => u.email?.toLowerCase() === email)
  if (existing) return existing.id

  // Cria novo usuário + envia e-mail de convite com link pra definir senha
  const { data: created, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    data: { role: 'cliente', name: name || email.split('@')[0] },
  })
  if (inviteError) throw inviteError
  if (!created.user) throw new Error('Falha ao criar usuário via convite.')

  return created.user.id
}
