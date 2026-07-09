'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Account, Profile } from '@/lib/types'

interface AccountState {
  userId: string | null
  profile: Profile | null
  account: Account | null
  isAdmin: boolean
  loading: boolean
}

/**
 * Carrega o usuário logado, seu perfil e a conta (tenant) à qual pertence.
 * Usado em qualquer tela que precise saber se o usuário é admin da própria
 * conta, ou que precise da marca (logo/cores) para exportar PDFs.
 */
export function useAccount(redirectIfUnauthenticated = true) {
  const router = useRouter()
  const [state, setState] = useState<AccountState>({
    userId: null, profile: null, account: null, isAdmin: false, loading: true,
  })

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        if (redirectIfUnauthenticated) router.push('/login')
        if (active) setState(s => ({ ...s, loading: false }))
        return
      }
      const { data: profile } = await supabase
        .from('profiles').select('*').eq('id', data.user.id).single()

      let account: Account | null = null
      if (profile?.account_id) {
        const { data: acc } = await supabase
          .from('accounts').select('*').eq('id', profile.account_id).single()
        account = acc ?? null
      }

      if (!active) return
      setState({
        userId: data.user.id,
        profile: profile ?? null,
        account,
        isAdmin: profile?.role === 'admin',
        loading: false,
      })
    })
    return () => { active = false }
  }, [router, redirectIfUnauthenticated])

  return state
}
