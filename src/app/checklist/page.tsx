'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { CheckCircle, Circle } from 'lucide-react'

interface Item { id: string; title: string; description?: string; section_id: string; sections?: { title: string } }
interface Progress { checklist_item_id: string; completed: boolean }

export default function ChecklistPage() {
  const [items, setItems] = useState<Item[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      const [{ data: its }, { data: prog }] = await Promise.all([
        supabase.from('checklist_items').select('*, sections(title)').order('sort_order'),
        supabase.from('checklist_progress').select('*').eq('user_id', data.user.id),
      ])
      if (its) setItems(its)
      if (prog) setProgress(prog)
      setLoading(false)
    })
  }, [router])

  async function toggle(itemId: string) {
    if (!userId) return
    const done = progress.find(p => p.checklist_item_id === itemId)?.completed
    await supabase.from('checklist_progress').upsert({
      user_id: userId, checklist_item_id: itemId,
      completed: !done, completed_at: !done ? new Date().toISOString() : null
    })
    setProgress(p => {
      const exists = p.find(x => x.checklist_item_id === itemId)
      if (exists) return p.map(x => x.checklist_item_id === itemId ? { ...x, completed: !x.completed } : x)
      return [...p, { checklist_item_id: itemId, completed: true }]
    })
  }

  const completed = progress.filter(p => p.completed).length
  const pct = items.length > 0 ? Math.round((completed / items.length) * 100) : 0

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">Checklist</h1>
        <p className="text-xs text-gray-500">{completed} de {items.length} itens concluídos</p>
      </div>
      <div className="px-4 py-4">
        {items.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progresso</span>
              <span className="text-sm font-semibold" style={{ color: '#BA7517' }}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#BA7517' }} />
            </div>
          </div>
        )}
        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <p className="text-sm text-gray-500">Nenhum item de checklist cadastrado ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map(item => {
              const done = progress.find(p => p.checklist_item_id === item.id)?.completed ?? false
              return (
                <button key={item.id} onClick={() => toggle(item.id)}
                  className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 border border-gray-100 text-left active:scale-98 transition-transform">
                  {done ? <CheckCircle size={22} color="#BA7517" /> : <Circle size={22} color="#D1D5DB" />}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900" style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.5 : 1 }}>{item.title}</div>
                    {item.sections && <div className="text-xs text-gray-400">{item.sections.title}</div>}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
