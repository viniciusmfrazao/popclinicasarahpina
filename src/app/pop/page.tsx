'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Section } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

const STATUS = {
  levantado: { label: 'Levantado', bg: '#E1F5EE', color: '#0F6E56' },
  parcial: { label: 'Parcial', bg: '#FAEEDA', color: '#BA7517' },
  pendente: { label: 'Pendente', bg: '#FBEAF0', color: '#993556' },
}

export default function POPPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('sections').select('*').order('sort_order').then(({ data }) => {
        if (data) setSections(data)
        setLoading(false)
      })
    })
  }, [router])

  const levantado = sections.filter(s => s.status === 'levantado').length
  const pct = sections.length > 0 ? Math.round((levantado / sections.length) * 100) : 0

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">Manual POP</h1>
        <p className="text-xs text-gray-500">Clínica Sarah Pina</p>
      </div>

      <div className="px-4 py-4">
        {/* Progress */}
        <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100 shadow-sm">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progresso geral</span>
            <span className="text-sm font-semibold" style={{ color: '#D4537E' }}>{pct}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#D4537E' }} />
          </div>
          <div className="flex gap-4 mt-3">
            {(['levantado','parcial','pendente'] as const).map(s => (
              <div key={s} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: STATUS[s].color }} />
                <span className="text-xs text-gray-500">{STATUS[s].label}: {sections.filter(x => x.status === s).length}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sections list */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sections.map(s => {
              const st = STATUS[s.status]
              return (
                <Link key={s.id} href={`/pop/${s.id}`}
                  className="bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm active:scale-98 transition-transform">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg" style={{ background: s.color + '22' }}>
                    📋
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate">{s.title}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
