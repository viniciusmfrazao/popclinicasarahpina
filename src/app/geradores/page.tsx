'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { ArrowLeft, Sparkles, Lock, ChevronRight } from 'lucide-react'
import { GENERATORS } from '@/lib/generators/registry'

export default function GeradoresHub() {
  const router = useRouter()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'student') { router.push('/dashboard'); return }
      setReady(true)
    })
  }, [router])

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F5F6' }}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#6B1E2E', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-4 pt-12 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Início</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(196,163,90,0.15)' }}>
            <Sparkles size={20} color="#E8CFA0" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>Geradores</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Documentos prontos, criados com IA a partir dos padrões da clínica</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-2.5">
        {GENERATORS.map(g => {
          const card = (
            <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-white"
              style={{
                border: '1px solid #EDD8DE',
                boxShadow: '0 1px 4px rgba(107,30,46,0.05)',
                opacity: g.available ? 1 : 0.6,
              }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: `${g.color}1A` }}>
                {g.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold" style={{ color: '#1C1A17' }}>{g.title}</div>
                  {!g.available && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
                      style={{ background: '#F5E8EC', color: '#8B2A3D' }}>
                      <Lock size={9} /> Em breve
                    </span>
                  )}
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#6B6458' }}>{g.description}</p>
              </div>
              {g.available && <ChevronRight size={15} color="#C4A35A" />}
            </div>
          )
          return g.available
            ? <Link key={g.slug} href={`/geradores/${g.slug}`}>{card}</Link>
            : <div key={g.slug}>{card}</div>
        })}
      </div>
      <BottomNav />
    </div>
  )
}
