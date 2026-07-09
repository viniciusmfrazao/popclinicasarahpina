'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { useAccount } from '@/lib/useAccount'
import { JobFunction } from '@/lib/types'
import { ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, Briefcase } from 'lucide-react'

const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }

export default function JobFunctionsPage() {
  const router = useRouter()
  const { account, isAdmin, loading } = useAccount()

  const [functions, setFunctions] = useState<JobFunction[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !isAdmin) { router.push('/dashboard'); return }
    if (account) loadFunctions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, loading, isAdmin])

  async function loadFunctions() {
    if (!account) return
    const { data } = await supabase.from('job_functions').select('*').eq('account_id', account.id).order('sort_order')
    if (data) setFunctions(data)
    setLoadingList(false)
  }

  async function createFunction() {
    if (!account || !newName.trim()) return
    setError('')
    if (functions.some(f => f.name.toLowerCase() === newName.trim().toLowerCase())) {
      setError('Já existe uma função com esse nome.'); return
    }
    setCreating(true)
    const sortOrder = functions.length > 0 ? Math.max(...functions.map(f => f.sort_order)) + 1 : 0
    const { data, error: err } = await supabase.from('job_functions')
      .insert({ account_id: account.id, name: newName.trim(), sort_order: sortOrder }).select().single()
    setCreating(false)
    if (err) { setError('Erro ao criar: ' + err.message); return }
    if (data) setFunctions(p => [...p, data])
    setNewName('')
  }

  function startEdit(f: JobFunction) {
    setEditingId(f.id)
    setEditName(f.name)
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setSaving(true)
    await supabase.from('job_functions').update({ name: editName.trim() }).eq('id', id)
    setFunctions(p => p.map(f => f.id === id ? { ...f, name: editName.trim() } : f))
    setSaving(false)
    setEditingId(null)
  }

  async function deleteFunction(id: string) {
    setFunctions(p => p.filter(f => f.id !== id))
    await supabase.from('job_functions').delete().eq('id', id)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <Link href="/admin" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Painel Admin</span>
        </Link>
        <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#E8CFA0' }}>Configurações</p>
        <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Funções da Equipe</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cada função pode ter seu próprio checklist
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: '#6B1E2E' }}>
            Nova função
          </label>
          <div className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createFunction()}
              placeholder="Ex: Recepção, Esteticista, Biomédica..."
              className="flex-1 text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
            <button onClick={createFunction} disabled={creating}
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 btn-bordo">
              {creating ? <Loader2 size={16} className="animate-spin" color="#fff" /> : <Plus size={16} color="#fff" />}
            </button>
          </div>
          {error && <p className="text-xs mt-2" style={{ color: '#B35A5A' }}>{error}</p>}
        </div>

        {loadingList ? (
          <div className="space-y-2">{[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
          ))}</div>
        ) : functions.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
            <Briefcase size={24} color="#C4A8B0" className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: '#8A8178' }}>Nenhuma função cadastrada ainda.</p>
            <p className="text-xs mt-1" style={{ color: '#B0A898' }}>
              Sem funções, o checklist é o mesmo para toda a equipe.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {functions.map(f => (
              <div key={f.id} className="rounded-2xl bg-white flex items-center gap-3 p-3.5"
                style={{ border: '1px solid #EDD8DE' }}>
                {editingId === f.id ? (
                  <>
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(f.id)} autoFocus
                      className="flex-1 text-sm px-3 py-2 rounded-xl focus:outline-none" style={inputStyle} />
                    <button onClick={() => saveEdit(f.id)} disabled={saving} className="p-1.5" style={{ color: '#6B1E2E' }}>
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => setEditingId(null)} className="p-1.5" style={{ color: '#C4A8B0' }}>
                      <X size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#F5E8EC' }}>
                      <Briefcase size={15} color="#6B1E2E" />
                    </div>
                    <span className="flex-1 text-sm font-medium" style={{ color: '#1C1A17' }}>{f.name}</span>
                    <button onClick={() => startEdit(f)} className="p-1.5" style={{ color: '#C4A35A' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => deleteFunction(f.id)} className="p-1.5" style={{ color: '#B35A5A' }}>
                      <Trash2 size={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
