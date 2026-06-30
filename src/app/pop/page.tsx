'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Section } from '@/lib/types'
import { ChevronRight } from 'lucide-react'

const STATUS = {
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#4A7A3E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F5E8EC', color: '#8B2A3D' },
}
const ICONS: Record<string,string> = {
  cultura:'🌸', jornada:'🗺️', reuniao:'📋', scripts:'💬',
  marketing:'📱', profissionais:'👥', automacoes:'⚡',
  juridico:'📄', financeiro:'💰', cursos:'🎓', nao_fazer:'🚫', comercial:'🤝',
}

export default function POPPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('sections').select('*').order('sort_order')
        .then(({ data }) => { if (data) setSections(data); setLoading(false) })
    })
  }, [router])

  const levantado = sections.filter(s => s.status === 'levantado').length
  const pct = sections.length > 0 ? Math.round((levantado / sections.length) * 100) : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <p className="text-[11px] tracking-[0.25em] uppercase font-medium mb-1" style={{ color: '#E8CFA0' }}>Clínica Sarah Pina</p>
        <h1 className="text-xl font-semibold mb-5" style={{ color: '#fff' }}>Manual de Operações</h1>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>Progresso geral</span>
          <span className="text-xs font-bold" style={{ color: '#C4A35A' }}>{pct}%</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C4A35A, #E8CFA0)' }} />
        </div>
        <div className="flex gap-4 mt-3">
          {(['levantado','parcial','pendente'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[s].color }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {STATUS[s].label} · {sections.filter(x => x.status === s).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sections.map(s => {
              const st = STATUS[s.status]
              return (
                <Link key={s.id} href={`/pop/${s.id}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-white active:scale-98 transition-transform"
                  style={{ border: '1px solid #EDD8DE', boxShadow: '0 1px 4px rgba(107,30,46,0.05)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: '#F5E8EC' }}>
                    {ICONS[s.id] ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate mb-1" style={{ color: '#1C1A17' }}>{s.title}</div>
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ background: st.bg, color: st.color }}>{st.label}</span>
                  </div>
                  <ChevronRight size={15} color="#C4A35A" />
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
