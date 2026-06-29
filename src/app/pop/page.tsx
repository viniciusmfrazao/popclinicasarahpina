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
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#5A7A4E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F0ECE8', color: '#8A7A6E' },
}

const ICONS: Record<string, string> = {
  cultura: '🌸', jornada: '🗺️', reuniao: '📋', scripts: '💬',
  marketing: '📱', profissionais: '👥', automacoes: '⚡',
  juridico: '📄', financeiro: '💰', cursos: '🎓', nao_fazer: '🚫',
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
    <div className="min-h-screen pb-24" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-5" style={{ background: 'linear-gradient(135deg, #1C1A17 0%, #2D2A24 100%)' }}>
        <p className="text-xs tracking-[0.2em] uppercase mb-1" style={{ color: '#C4A35A' }}>Clínica Sarah Pina</p>
        <h1 className="text-xl font-semibold mb-4" style={{ color: '#F5EDD8' }}>Manual POP</h1>
        <div className="flex justify-between mb-2">
          <span className="text-xs" style={{ color: '#B0A898' }}>Progresso geral</span>
          <span className="text-xs font-semibold" style={{ color: '#C4A35A' }}>{pct}%</span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: '#2D2A24' }}>
          <div className="h-full rounded-full gold-gradient transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex gap-4 mt-3">
          {(['levantado','parcial','pendente'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[s].color }} />
              <span className="text-xs" style={{ color: '#6B6458' }}>
                {STATUS[s].label}: {sections.filter(x => x.status === s).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#E8DCC8' }} />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {sections.map(s => {
              const st = STATUS[s.status]
              return (
                <Link key={s.id} href={`/pop/${s.id}`}
                  className="flex items-center gap-3.5 p-4 rounded-2xl active:scale-98 transition-transform"
                  style={{ background: '#fff', border: '1px solid #E8DCC8', boxShadow: '0 1px 3px rgba(196,163,90,0.06)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ background: '#F5EDD8' }}>
                    {ICONS[s.id] ?? '📌'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate" style={{ color: '#1C1A17' }}>{s.title}</div>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-0.5"
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
