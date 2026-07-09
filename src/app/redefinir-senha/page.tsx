'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Loader2, Eye, EyeOff, CheckCircle2 } from 'lucide-react'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // O link do e-mail (recuperação ou convite) já deixa uma sessão temporária
    // estabelecida pelo supabase-js ao carregar a página com o token na URL.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true)
    })
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const timeout = setTimeout(() => {
      supabase.auth.getSession().then(({ data }) => {
        if (!data.session) setInvalid(true)
      })
    }, 2500)
    return () => { sub.subscription.unsubscribe(); clearTimeout(timeout) }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('A senha precisa ter no mínimo 6 caracteres.'); return }
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) { setError('Não foi possível salvar a senha. Tente pedir um novo link.'); return }
    setDone(true)
    setTimeout(() => router.push('/dashboard'), 1500)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F9F5F6' }}>
      <div className="h-1 gold-bar" />
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div style={{ position: 'relative', width: '80vw', maxWidth: '280px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/sistema-pop-logo.svg" alt="Sistema POP" style={{ width: '100%', height: 'auto' }} />
        </div>

        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg mt-6" style={{ border: '1px solid #E8D0D8' }}>
          <div className="header-bg px-6 py-5">
            <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>Criar nova senha</h1>
          </div>

          <div className="bg-white px-6 py-6">
            {invalid ? (
              <div className="text-center py-4">
                <p className="text-sm font-medium" style={{ color: '#1C1A17' }}>Link inválido ou expirado</p>
                <p className="text-xs mt-1.5" style={{ color: '#8A8178' }}>
                  Peça um novo link na tela de recuperação de senha.
                </p>
                <a href="/recuperar-senha" className="inline-block mt-4 text-xs font-semibold" style={{ color: '#6B1E2E' }}>
                  Pedir novo link
                </a>
              </div>
            ) : done ? (
              <div className="text-center py-4">
                <CheckCircle2 size={36} color="#6B1E2E" className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: '#1C1A17' }}>Senha definida!</p>
                <p className="text-xs mt-1.5" style={{ color: '#8A8178' }}>Te levando pro sistema...</p>
              </div>
            ) : !ready ? (
              <div className="flex justify-center py-8">
                <Loader2 size={22} className="animate-spin" color="#6B1E2E" />
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: '#6B1E2E' }}>
                    Nova senha
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#C4A8B0" />
                    <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-10 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C4A35A' }}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: '#6B1E2E' }}>
                    Confirmar senha
                  </label>
                  <input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)}
                    placeholder="Repita a senha"
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                </div>
                {error && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold btn-bordo disabled:opacity-60">
                  {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Salvar senha e entrar'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
