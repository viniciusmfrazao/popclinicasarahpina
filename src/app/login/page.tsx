'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F9F5F6' }}>
      {/* Top bar */}
      <div className="h-1 gold-bar" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-6">
          <div style={{ position: 'relative', width: '88vw', maxWidth: '360px', height: '260px' }}>
            <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain' }} priority />
          </div>
          <div className="h-px w-32 gold-bar" />
          <p className="mt-3 text-[11px] tracking-[0.3em] uppercase font-medium" style={{ color: '#9E7E3A' }}>
            Sistema de Gestão
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg"
          style={{ border: '1px solid #E8D0D8' }}>

          {/* Card header */}
          <div className="header-bg px-6 py-5">
            <p className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: '#E8CFA0' }}>Bem-vinda</p>
            <h1 className="text-lg font-semibold mt-0.5" style={{ color: '#fff' }}>Acesse sua conta</h1>
          </div>

          {/* Card body */}
          <div className="bg-white px-6 py-6">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>E-mail</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>Senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              {error && (
                <p className="text-xs rounded-xl px-4 py-3" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-[0.12em] uppercase btn-bordo disabled:opacity-60 transition-opacity mt-2">
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Gold bottom bar */}
          <div className="h-1 gold-bar" />
        </div>

        <p className="text-xs mt-8" style={{ color: '#C4A8B0' }}>
          © {new Date().getFullYear()} Clínica Sarah Pina · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
