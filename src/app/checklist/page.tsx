'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import { useAccount } from '@/lib/useAccount'
import { ChecklistItem, JobFunction, Section } from '@/lib/types'
import { generateChecklistPDF, checklistFileName } from '@/lib/checklist-pdf'
import {
  CheckCircle2, Circle, Plus, Pencil, Trash2, X, Check,
  Download, Loader2, ListFilter,
} from 'lucide-react'

interface Progress { checklist_item_id: string; completed: boolean }
type ItemWithSection = ChecklistItem & { sections?: { title: string } }

const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }
const selectStyle = { ...inputStyle, appearance: 'none' as const }

export default function ChecklistPage() {
  const { userId, profile, account, isAdmin } = useAccount()

  const [items, setItems] = useState<ItemWithSection[]>([])
  const [progress, setProgress] = useState<Progress[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [jobFunctions, setJobFunctions] = useState<JobFunction[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [editMode, setEditMode] = useState(false)
  const [filterFunction, setFilterFunction] = useState<string>('all')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: '', description: '', section_id: '', job_function_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!account || !userId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, userId])

  async function load() {
    if (!account || !userId) return
    const [{ data: its }, { data: prog }, { data: secs }, { data: funcs }] = await Promise.all([
      supabase.from('checklist_items').select('*, sections(title)').eq('account_id', account.id).order('sort_order'),
      supabase.from('checklist_progress').select('*').eq('user_id', userId),
      supabase.from('sections').select('*').eq('account_id', account.id).order('sort_order'),
      supabase.from('job_functions').select('*').eq('account_id', account.id).order('sort_order'),
    ])
    if (its) setItems(its)
    if (prog) setProgress(prog)
    if (secs) { setSections(secs); setForm(f => ({ ...f, section_id: f.section_id || secs[0]?.id || '' })) }
    if (funcs) setJobFunctions(funcs)
    setLoading(false)
  }

  async function toggle(itemId: string) {
    if (!userId) return
    const done = progress.find(p => p.checklist_item_id === itemId)?.completed
    await supabase.from('checklist_progress').upsert({
      user_id: userId, checklist_item_id: itemId,
      completed: !done, completed_at: !done ? new Date().toISOString() : null,
    })
    setProgress(p => {
      const exists = p.find(x => x.checklist_item_id === itemId)
      if (exists) return p.map(x => x.checklist_item_id === itemId ? { ...x, completed: !x.completed } : x)
      return [...p, { checklist_item_id: itemId, completed: true }]
    })
  }

  function resetForm() {
    setForm({ title: '', description: '', section_id: sections[0]?.id ?? '', job_function_id: '' })
    setEditingId(null)
    setShowForm(false)
  }

  function startEdit(item: ItemWithSection) {
    setForm({
      title: item.title, description: item.description ?? '',
      section_id: item.section_id, job_function_id: item.job_function_id ?? '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  async function saveItem() {
    if (!account || !form.title.trim() || !form.section_id) return
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      section_id: form.section_id,
      job_function_id: form.job_function_id || null,
    }
    if (editingId) {
      await supabase.from('checklist_items').update(payload).eq('id', editingId)
    } else {
      const sortOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0
      await supabase.from('checklist_items').insert({ ...payload, account_id: account.id, sort_order: sortOrder })
    }
    setSaving(false)
    resetForm()
    load()
  }

  async function deleteItem(itemId: string) {
    setItems(p => p.filter(i => i.id !== itemId))
    await supabase.from('checklist_items').delete().eq('id', itemId)
  }

  async function exportPDF() {
    if (!account) return
    setExporting(true)
    try {
      const scopeFunc = jobFunctions.find(f => f.id === filterFunction)
      const scopeLabel = scopeFunc ? scopeFunc.name : 'Todas as funções'
      const filtered = filterFunction === 'all' ? items : items.filter(i => !i.job_function_id || i.job_function_id === filterFunction)
      const doc = await generateChecklistPDF(
        filtered.map(i => ({
          title: i.title, description: i.description,
          section_title: i.sections?.title ?? 'Geral',
          job_function_name: jobFunctions.find(f => f.id === i.job_function_id)?.name,
        })),
        account, scopeLabel
      )
      doc.save(checklistFileName(account, scopeLabel))
    } finally {
      setExporting(false)
    }
  }

  // Não-admins só veem itens da própria função (ou gerais, sem função definida)
  const visibleItems = isAdmin
    ? items
    : items.filter(i => !i.job_function_id || i.job_function_id === profile?.job_function_id)

  const completed = progress.filter(p => p.completed).length
  const pct = visibleItems.length > 0
    ? Math.round((visibleItems.filter(i => progress.find(p => p.checklist_item_id === i.id)?.completed).length / visibleItems.length) * 100)
    : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <p className="text-[11px] tracking-[0.25em] uppercase font-medium mb-1" style={{ color: '#E8CFA0' }}>
          {account?.name ?? 'Sistema POP'}
        </p>
        <h1 className="text-xl font-semibold mb-1" style={{ color: '#fff' }}>Checklist</h1>
        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {completed} de {visibleItems.length} itens concluídos
        </p>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
          <div className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #C4A35A, #E8CFA0)' }} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={exportPDF} disabled={exporting || visibleItems.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: '#fff', border: '1px solid #EDD8DE', color: '#6B1E2E' }}>
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Baixar checklist (PDF)
          </button>
          {isAdmin && (
            <button onClick={() => setEditMode(e => !e)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: editMode ? '#C4A35A' : '#fff', border: '1px solid #EDD8DE' }}>
              <Pencil size={16} color={editMode ? '#4A1020' : '#6B1E2E'} />
            </button>
          )}
        </div>

        {isAdmin && jobFunctions.length > 0 && (
          <div className="flex items-center gap-2">
            <ListFilter size={13} color="#8A8178" />
            <div className="relative flex-1">
              <select value={filterFunction} onChange={e => setFilterFunction(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none" style={selectStyle}>
                <option value="all">Todas as funções (visão admin)</option>
                {jobFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        )}

        {editMode && (
          <div className="rounded-2xl bg-white p-4 space-y-2.5" style={{ border: '1px solid #6B1E2E' }}>
            {!showForm ? (
              <button onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl btn-bordo">
                <Plus size={13} /> Novo item de checklist
              </button>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
                    {editingId ? 'Editar item' : 'Novo item'}
                  </p>
                  <button onClick={resetForm} style={{ color: '#C4A8B0' }}><X size={16} /></button>
                </div>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Título do item" autoFocus
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Descrição (opcional)" rows={2}
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.section_id} onChange={e => setForm(f => ({ ...f, section_id: e.target.value }))}
                    className="text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={selectStyle}>
                    {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                  </select>
                  <select value={form.job_function_id} onChange={e => setForm(f => ({ ...f, job_function_id: e.target.value }))}
                    className="text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={selectStyle}>
                    <option value="">Todas as funções</option>
                    {jobFunctions.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetForm} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ color: '#6B6458' }}>
                    Cancelar
                  </button>
                  <button onClick={saveItem} disabled={saving}
                    className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl btn-bordo">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">{[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
          ))}</div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
            <p className="text-sm" style={{ color: '#8A8178' }}>Nenhum item de checklist para você ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleItems.map(item => {
              const done = progress.find(p => p.checklist_item_id === item.id)?.completed ?? false
              const funcName = jobFunctions.find(f => f.id === item.job_function_id)?.name
              return (
                <div key={item.id} className="rounded-2xl bg-white flex items-center gap-3 p-4"
                  style={{ border: '1px solid #EDD8DE' }}>
                  <button onClick={() => toggle(item.id)} className="shrink-0">
                    {done ? <CheckCircle2 size={22} color="#6B1E2E" /> : <Circle size={22} color="#EDD8DE" />}
                  </button>
                  <button onClick={() => toggle(item.id)} className="flex-1 min-w-0 text-left">
                    <div className="text-sm font-medium truncate"
                      style={{ color: done ? '#C4A8B0' : '#1C1A17', textDecoration: done ? 'line-through' : 'none' }}>
                      {item.title}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {item.sections?.title && (
                        <span className="text-[11px]" style={{ color: '#C4A35A' }}>{item.sections.title}</span>
                      )}
                      {funcName && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: '#F5E8EC', color: '#6B1E2E' }}>
                          {funcName}
                        </span>
                      )}
                    </div>
                  </button>
                  {editMode && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => startEdit(item)} className="p-1.5" style={{ color: '#C4A35A' }}><Pencil size={14} /></button>
                      <button onClick={() => deleteItem(item.id)} className="p-1.5" style={{ color: '#B35A5A' }}><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
