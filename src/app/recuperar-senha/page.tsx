'use client'
export const dynamic = 'force-dynamic'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { ArrowLeft, Mail, Loader2, CheckCircle2 } from 'lucide-react'

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    setLoading(false)
    if (error) { setError('Não foi possível enviar o e-mail. Tente novamente.'); return }
    setSent(true)
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
            <Link href="/login" className="flex items-center gap-1.5 mb-2">
              <ArrowLeft size={14} color="#E8CFA0" />
              <span className="text-xs" style={{ color: '#E8CFA0' }}>Voltar ao login</span>
            </Link>
            <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>Recuperar senha</h1>
          </div>

          <div className="bg-white px-6 py-6">
            {sent ? (
              <div className="text-center py-4">
                <CheckCircle2 size={36} color="#6B1E2E" className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: '#1C1A17' }}>E-mail enviado</p>
                <p className="text-xs mt-1.5" style={{ color: '#8A8178' }}>
                  Confira sua caixa de entrada (e o spam) e clique no link pra criar uma nova senha.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs" style={{ color: '#8A8178' }}>
                  Digite o e-mail da sua conta. Vamos te enviar um link pra criar uma nova senha.
                </p>
                <div>
                  <label className="block text-[11px] font-semibold tracking-[0.15em] uppercase mb-2" style={{ color: '#6B1E2E' }}>
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2" color="#C4A8B0" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="seu@email.com"
                      className="w-full pl-9 pr-4 py-3 rounded-xl text-sm focus:outline-none"
                      style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                  </div>
                </div>
                {error && (
                  <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>
                )}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl text-sm font-semibold btn-bordo disabled:opacity-60">
                  {loading ? <Loader2 size={15} className="animate-spin mx-auto" /> : 'Enviar link de recuperação'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
