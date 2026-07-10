import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

interface SelfSignupBody {
  email?: string
  password?: string
  name?: string
  phone?: string
}

export async function POST(req: NextRequest) {
  let body: SelfSignupBody
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Payload inválido.' }, { status: 400 })
  }

  const email = body.email?.trim().toLowerCase()
  const password = body.password
  const name = body.name?.trim()
  const phone = body.phone?.trim()

  if (!email || !password || !name || !phone) {
    return NextResponse.json({ error: 'Preencha e-mail, senha, nome e telefone.' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'A senha precisa ter pelo menos 6 caracteres.' }, { status: 400 })
  }

  try {
    // 1. Localiza o usuário criado automaticamente pelo webhook da Hotmart
    //    (convite pendente, ainda sem senha definida).
    const { data: list, error: listError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    })
    if (listError) throw listError

    const existing = list.users.find(u => u.email?.toLowerCase() === email)

    if (!existing) {
      return NextResponse.json({
        error: 'Ainda não localizamos sua compra. Aguarde alguns minutos após a confirmação do pagamento e tente novamente. Se o problema persistir, use o mesmo e-mail informado na compra.',
      }, { status: 404 })
    }

    if (existing.email_confirmed_at) {
      return NextResponse.json({
        error: 'Você já tem uma conta cadastrada. Faça login ou use "Esqueci minha senha".',
      }, { status: 409 })
    }

    // 2. Confere se a assinatura da conta vinculada está ativa.
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles').select('account_id').eq('id', existing.id).single()
    if (profileError) throw profileError

    const { data: account, error: accountError } = await supabaseAdmin
      .from('accounts').select('subscription_status').eq('id', profile.account_id).single()
    if (accountError) throw accountError

    if (account.subscription_status !== 'active') {
      return NextResponse.json({
        error: 'Não encontramos uma assinatura ativa para este e-mail. Entre em contato com o suporte.',
      }, { status: 403 })
    }

    // 3. Define a senha escolhida pelo comprador e confirma o e-mail.
    const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...existing.user_metadata, name },
    })
    if (updateAuthError) throw updateAuthError

    // 4. Atualiza nome e telefone no perfil.
    const { error: updateProfileError } = await supabaseAdmin
      .from('profiles').update({ name, phone }).eq('id', existing.id)
    if (updateProfileError) throw updateProfileError

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Erro no autocadastro:', err)
    return NextResponse.json({ error: 'Erro ao criar a conta. Tente novamente em instantes.' }, { status: 500 })
  }
}
