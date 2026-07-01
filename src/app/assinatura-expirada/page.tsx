'use client'
export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AssinaturaExpirada() {
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center" style={{ background: '#F9F5F6' }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: '#F5E8EC' }}>
        <Lock size={26} color="#6B1E2E" />
      </div>
      <h1 className="text-lg font-semibold mb-2" style={{ color: '#1C1A17' }}>Assinatura inativa</h1>
      <p className="text-sm max-w-xs leading-relaxed mb-6" style={{ color: '#6B6458' }}>
        Não encontramos uma assinatura ativa vinculada à sua conta. Se você já pagou e ainda vê esta
        tela, aguarde alguns minutos ou entre em contato com o suporte.
      </p>
      <button onClick={handleLogout}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-bordo" style={{ color: '#fff' }}>
        Sair
      </button>
    </div>
  )
}
