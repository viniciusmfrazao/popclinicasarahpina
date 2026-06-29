'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-mail ou senha incorretos.'); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #F5EDD8 0%, #FAFAF7 50%, #F0EBE0 100%)' }}>

      {/* Decorative top line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 gold-gradient" />

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative w-36 h-28 mb-2">
            <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain' }} priority />
          </div>
          <div className="h-px w-16 mb-4" style={{ background: 'linear-gradient(90deg, transparent, #C4A35A, transparent)' }} />
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: '#9E7E3A' }}>
            Manual de Operações
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl p-7 shadow-sm" style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase mb-1.5" style={{ color: '#9E7E3A' }}>
                E-mail
              </label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: '#FAFAF7', border: '1px solid #E8DCC8', color: '#1C1A17' }} />
            </div>
            <div>
              <label className="block text-xs font-medium tracking-wide uppercase mb-1.5" style={{ color: '#9E7E3A' }}>
                Senha
              </label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all"
                style={{ background: '#FAFAF7', border: '1px solid #E8DCC8', color: '#1C1A17' }} />
            </div>
            {error && (
              <p className="text-sm rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-opacity disabled:opacity-60 gold-gradient"
              style={{ color: '#fff', letterSpacing: '0.08em' }}>
              {loading ? 'Entrando...' : 'ENTRAR'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#B0A898' }}>
          © {new Date().getFullYear()} Clínica Sarah Pina
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-0.5 gold-gradient" />
    </div>
  )
}
