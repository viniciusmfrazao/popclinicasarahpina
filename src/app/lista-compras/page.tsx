'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ShoppingCart, Check } from 'lucide-react'

interface ShoppingItem {
  id: string
  item: string
  quantity: string | null
  notes: string | null
  is_purchased: boolean
  sort_order: number
}

export default function ListaComprasPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const [newItem, setNewItem] = useState('')
  const [newQty, setNewQty] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role, access_lista_compras').eq('id', data.user.id).single()
      if (!profile) { router.push('/dashboard'); return }
      const admin = profile.role === 'admin'
      const canView = admin || profile.access_lista_compras === true
      if (!canView) { router.push('/dashboard'); return }
      setIsAdmin(admin)
      setChecking(false)
      loadItems()
    })
  }, [router])

  async function loadItems() {
    setLoading(true)
    const { data } = await supabase
      .from('shopping_list_items').select('*')
      .order('is_purchased', { ascending: true })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (data) setItems(data)
    setLoading(false)
  }

  async function addItem() {
    if (!newItem.trim()) return
    setAdding(true)
    const { data: userData } = await supabase.auth.getUser()
    const maxSort = items.reduce((m, i) => Math.max(m, i.sort_order), 0)
    const { data, error } = await supabase.from('shopping_list_items')
      .insert({
        item: newItem.trim(),
        quantity: newQty.trim() || null,
        sort_order: maxSort + 1,
        created_by: userData.user?.id,
      })
      .select().single()
    if (!error && data) {
      setItems(prev => [...prev, data])
      setNewItem('')
      setNewQty('')
    }
    setAdding(false)
  }

  async function togglePurchased(it: ShoppingItem) {
    setSavingId(it.id)
    const { error } = await supabase.from('shopping_list_items')
      .update({ is_purchased: !it.is_purchased, updated_at: new Date().toISOString() })
      .eq('id', it.id)
    if (!error) {
      setItems(prev => prev.map(x => x.id === it.id ? { ...x, is_purchased: !x.is_purchased } : x))
    }
    setSavingId(null)
  }

  async function removeItem(id: string) {
    setSavingId(id)
    const { error } = await supabase.from('shopping_list_items').delete().eq('id', id)
    if (!error) setItems(prev => prev.filter(x => x.id !== id))
    setSavingId(null)
  }

  if (checking) {
    return <div className="min-h-screen" style={{ background: '#F9F5F6' }} />
  }

  const pending = items.filter(i => !i.is_purchased)
  const purchased = items.filter(i => i.is_purchased)

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#E8CFA0' }}>
              {isAdmin ? 'Gestão' : 'Consulta'}
            </p>
            <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Lista de Compras</h1>
          </div>
          <div className="relative w-20 h-12">
            <Image src="/logo.png" alt="SP" fill style={{ objectFit: 'contain', objectPosition: 'right' }} />
          </div>
        </div>
        <div className="mt-4 h-px gold-bar opacity-60" />
      </div>

      <div className="px-4 py-4 space-y-4">
        {isAdmin && (
          <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.06)' }}>
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: '#6B1E2E' }}>
              Adicionar Item
            </p>
            <div className="flex gap-2">
              <input
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                placeholder="Ex: Luvas descartáveis"
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="flex-1 min-w-0 px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }}
              />
              <input
                value={newQty}
                onChange={e => setNewQty(e.target.value)}
                placeholder="Qtd"
                onKeyDown={e => e.key === 'Enter' && addItem()}
                className="w-16 shrink-0 px-2 py-2.5 rounded-xl text-sm text-center focus:outline-none"
                style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }}
              />
            </div>
            <button
              onClick={addItem}
              disabled={adding || !newItem.trim()}
              className="w-full mt-2.5 flex items-center justify-center gap-2 py-2.5 rounded-xl btn-bordo font-semibold text-sm disabled:opacity-50"
            >
              <Plus size={16} color="#fff" />
              {adding ? 'Adicionando...' : 'Adicionar'}
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 flex flex-col items-center text-center" style={{ border: '1px solid #EDD8DE' }}>
            <ShoppingCart size={28} color="#C4A8B0" strokeWidth={1.5} />
            <p className="text-sm mt-3" style={{ color: '#6B6458' }}>
              {isAdmin ? 'Nenhum item na lista ainda.' : 'A lista de compras está vazia no momento.'}
            </p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.04)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #F5E8EC' }}>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
                    A Comprar · {pending.length}
                  </span>
                </div>
                {pending.map(it => (
                  <div key={it.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #F9F5F6' }}>
                    <button
                      onClick={() => isAdmin && togglePurchased(it)}
                      disabled={!isAdmin || savingId === it.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-60"
                      style={{ border: '2px solid #C4A35A', background: 'transparent' }}
                    >
                      {' '}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate" style={{ color: '#1C1A17' }}>{it.item}</p>
                    </div>
                    {it.quantity && (
                      <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: '#F5EDD8', color: '#9E7E3A' }}>
                        {it.quantity}
                      </span>
                    )}
                    {isAdmin && (
                      <button onClick={() => removeItem(it.id)} disabled={savingId === it.id} className="shrink-0 disabled:opacity-50">
                        <Trash2 size={16} color="#B0A898" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {purchased.length > 0 && (
              <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.04)' }}>
                <div className="px-4 py-3" style={{ borderBottom: '1px solid #F5E8EC' }}>
                  <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
                    Compradas · {purchased.length}
                  </span>
                </div>
                {purchased.map(it => (
                  <div key={it.id} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid #F9F5F6' }}>
                    <button
                      onClick={() => isAdmin && togglePurchased(it)}
                      disabled={!isAdmin || savingId === it.id}
                      className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 disabled:opacity-60"
                      style={{ background: '#6B1E2E' }}
                    >
                      <Check size={13} color="#fff" strokeWidth={3} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate line-through" style={{ color: '#B0A898' }}>{it.item}</p>
                    </div>
                    {it.quantity && (
                      <span className="text-xs font-semibold shrink-0 px-2 py-0.5 rounded-full"
                        style={{ background: '#F9F5F6', color: '#B0A898' }}>
                        {it.quantity}
                      </span>
                    )}
                    {isAdmin && (
                      <button onClick={() => removeItem(it.id)} disabled={savingId === it.id} className="shrink-0 disabled:opacity-50">
                        <Trash2 size={16} color="#B0A898" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!isAdmin && (
          <p className="text-[11px] text-center" style={{ color: '#B0A898' }}>
            Apenas a gestão pode editar a lista.
          </p>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
