'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CriarContaPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [phone, setPhone]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')

    try {
      const res = await fetch('/api/auth/self-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, phone }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Não foi possível criar sua conta.')
        setLoading(false)
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        setError('Conta criada! Faça login para continuar.')
        setLoading(false)
        router.push('/login')
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F9F5F6' }}>
      {/* Top bar */}
      <div className="h-1 gold-bar" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-6">
          <div style={{ position: 'relative', width: '88vw', maxWidth: '340px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/sistema-pop-logo.svg" alt="Sistema POP" style={{ width: '100%', height: 'auto' }} />
          </div>
          <div className="h-px w-32 gold-bar mt-2" />
          <p className="mt-3 text-[11px] tracking-[0.3em] uppercase font-medium" style={{ color: '#9E7E3A' }}>
            Sistema de Gestão
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm rounded-3xl overflow-hidden shadow-lg"
          style={{ border: '1px solid #E8D0D8' }}>

          {/* Card header */}
          <div className="header-bg px-6 py-5">
            <p className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: '#E8CFA0' }}>Comprou o Sistema POP?</p>
            <h1 className="text-lg font-semibold mt-0.5" style={{ color: '#fff' }}>Crie sua conta</h1>
          </div>

          {/* Card body */}
          <div className="bg-white px-6 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>Nome completo</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} required
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>E-mail da compra</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                <p className="text-[11px] mt-1.5" style={{ color: '#B08A94' }}>
                  Use o mesmo e-mail informado na hora da compra.
                </p>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>Telefone</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required
                  placeholder="(00) 00000-0000"
                  className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2"
                  style={{ color: '#6B1E2E' }}>Crie uma senha</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
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
                {loading ? 'Criando conta...' : 'Criar minha conta'}
              </button>
            </form>
          </div>

          {/* Gold bottom bar */}
          <div className="h-1 gold-bar" />
        </div>

        <p className="text-xs mt-8 text-center" style={{ color: '#C4A8B0' }}>
          Já tem conta? <Link href="/login" className="font-medium" style={{ color: '#9E7E3A' }}>Fazer login</Link>
        </p>
      </div>
    </div>
  )
}
