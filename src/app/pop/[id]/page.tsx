'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { useAccount } from '@/lib/useAccount'
import { Section, SectionItem, Note } from '@/lib/types'
import { generatePOPSectionPDF, popSectionFileName } from '@/lib/pop-pdf'
import {
  ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft, Pencil,
  Download, Check, X, Loader2,
} from 'lucide-react'
import Link from 'next/link'

const STATUS = {
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#4A7A3E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F5E8EC', color: '#8B2A3D' },
}

const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }

export default function SectionPage() {
  const { id } = useParams()
  const { userId, account, isAdmin } = useAccount()

  const [section, setSection] = useState<Section | null>(null)
  const [items, setItems] = useState<SectionItem[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')

  const [editMode, setEditMode] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [metaDraft, setMetaDraft] = useState({ title: '', summary: '', status: 'pendente' as Section['status'] })

  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [itemDraft, setItemDraft] = useState({ title: '', content: '' })
  const [addingItem, setAddingItem] = useState(false)
  const [newItem, setNewItem] = useState({ title: '', content: '' })
  const [savingItem, setSavingItem] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!userId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, userId])

  async function load() {
    const [{ data: sec }, { data: its }, { data: nts }] = await Promise.all([
      supabase.from('sections').select('*').eq('id', id).single(),
      supabase.from('section_items').select('*').eq('section_id', id).order('sort_order'),
      supabase.from('notes').select('*').eq('section_id', id).eq('user_id', userId).order('created_at'),
    ])
    if (sec) { setSection(sec); setMetaDraft({ title: sec.title, summary: sec.summary ?? '', status: sec.status }) }
    if (its) setItems(its)
    if (nts) setNotes(nts)
  }

  async function addNote() {
    if (!noteText.trim() || !userId) return
    const { data } = await supabase.from('notes')
      .insert({ section_id: id, user_id: userId, content: noteText.trim() }).select().single()
    if (data) { setNotes(p => [...p, data]); setNoteText('') }
  }

  async function saveMeta() {
    if (!section) return
    setSavingMeta(true)
    await supabase.from('sections').update({
      title: metaDraft.title.trim(), summary: metaDraft.summary.trim(), status: metaDraft.status,
    }).eq('id', section.id).eq('account_id', section.account_id)
    setSection(s => s ? { ...s, title: metaDraft.title.trim(), summary: metaDraft.summary.trim(), status: metaDraft.status } : s)
    setSavingMeta(false)
  }

  function startEditItem(item: SectionItem) {
    setEditingItem(item.id)
    setItemDraft({ title: item.title, content: item.content ?? '' })
  }

  async function saveItem(itemId: string) {
    if (!itemDraft.title.trim()) return
    setSavingItem(true)
    await supabase.from('section_items').update({
      title: itemDraft.title.trim(), content: itemDraft.content.trim(),
    }).eq('id', itemId)
    setItems(p => p.map(i => i.id === itemId ? { ...i, title: itemDraft.title.trim(), content: itemDraft.content.trim() } : i))
    setEditingItem(null)
    setSavingItem(false)
  }

  async function deleteItem(itemId: string) {
    setItems(p => p.filter(i => i.id !== itemId))
    await supabase.from('section_items').delete().eq('id', itemId)
  }

  async function createItem() {
    if (!newItem.title.trim() || !section) return
    setSavingItem(true)
    const sortOrder = items.length > 0 ? Math.max(...items.map(i => i.sort_order)) + 1 : 0
    const { data } = await supabase.from('section_items').insert({
      section_id: section.id, account_id: section.account_id,
      title: newItem.title.trim(), content: newItem.content.trim(), sort_order: sortOrder,
    }).select().single()
    if (data) setItems(p => [...p, data])
    setNewItem({ title: '', content: '' })
    setAddingItem(false)
    setSavingItem(false)
  }

  async function moveItem(itemId: string, dir: -1 | 1) {
    const idx = items.findIndex(i => i.id === itemId)
    const swapIdx = idx + dir
    if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return
    const a = items[idx], b = items[swapIdx]
    const reordered = [...items]
    reordered[idx] = b; reordered[swapIdx] = a
    setItems(reordered)
    await Promise.all([
      supabase.from('section_items').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('section_items').update({ sort_order: a.sort_order }).eq('id', b.id),
    ])
  }

  async function exportPDF() {
    if (!section || !account) return
    setExporting(true)
    try {
      const doc = await generatePOPSectionPDF(section, items, account)
      doc.save(popSectionFileName(section, account))
    } finally {
      setExporting(false)
    }
  }

  if (!section) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F5F6' }}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#6B1E2E', borderTopColor: 'transparent' }} />
    </div>
  )

  const st = STATUS[section.status]

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      {/* Header */}
      <div className="header-bg px-4 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <Link href="/pop" className="flex items-center gap-2">
            <ArrowLeft size={16} color="#E8CFA0" />
            <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Manual POP</span>
          </Link>
          {isAdmin && (
            <button onClick={() => setEditMode(e => !e)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ background: editMode ? '#C4A35A' : 'rgba(255,255,255,0.12)', color: editMode ? '#4A1020' : '#E8CFA0' }}>
              <Pencil size={12} />
              {editMode ? 'Editando' : 'Editar'}
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-2">
            <input value={metaDraft.title} onChange={e => setMetaDraft(m => ({ ...m, title: e.target.value }))}
              className="w-full text-lg font-semibold px-3 py-2 rounded-xl focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} />
            <div className="flex items-center gap-2 flex-wrap">
              {(['levantado', 'parcial', 'pendente'] as const).map(s => (
                <button key={s} onClick={() => setMetaDraft(m => ({ ...m, status: s }))}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-full"
                  style={{
                    background: metaDraft.status === s ? STATUS[s].bg : 'rgba(255,255,255,0.1)',
                    color: metaDraft.status === s ? STATUS[s].color : 'rgba(255,255,255,0.6)',
                  }}>{STATUS[s].label}</button>
              ))}
              <button onClick={saveMeta} disabled={savingMeta}
                className="ml-auto flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-full"
                style={{ background: '#C4A35A', color: '#4A1020' }}>
                {savingMeta ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                Salvar
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-lg font-semibold mb-2" style={{ color: '#fff' }}>{section.title}</h1>
            <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ background: st.bg, color: st.color }}>{st.label}</span>
          </>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Summary */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          {editMode ? (
            <textarea value={metaDraft.summary} onChange={e => setMetaDraft(m => ({ ...m, summary: e.target.value }))}
              rows={3} placeholder="Resumo da seção..."
              className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: '#6B6458' }}>{section.summary}</p>
          )}
        </div>

        {/* Export */}
        <button onClick={exportPDF} disabled={exporting}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
          style={{ background: '#fff', border: '1px solid #EDD8DE', color: '#6B1E2E' }}>
          {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          Baixar PDF desta seção
        </button>

        {/* Items */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
              Conteúdo · {items.length} itens
            </p>
            {editMode && !addingItem && (
              <button onClick={() => setAddingItem(true)}
                className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: '#6B1E2E' }}>
                <Plus size={13} /> Novo item
              </button>
            )}
          </div>

          {addingItem && (
            <div className="rounded-2xl bg-white p-4 space-y-2" style={{ border: '1px solid #6B1E2E' }}>
              <input value={newItem.title} onChange={e => setNewItem(n => ({ ...n, title: e.target.value }))}
                placeholder="Título do item" autoFocus
                className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              <textarea value={newItem.content} onChange={e => setNewItem(n => ({ ...n, content: e.target.value }))}
                placeholder="Conteúdo / instruções..." rows={4}
                className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setAddingItem(false); setNewItem({ title: '', content: '' }) }}
                  className="text-xs font-medium px-3 py-2 rounded-xl" style={{ color: '#6B6458' }}>Cancelar</button>
                <button onClick={createItem} disabled={savingItem}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl btn-bordo">
                  {savingItem ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Adicionar
                </button>
              </div>
            </div>
          )}

          {items.map((item, i) => (
            <div key={item.id} className="rounded-2xl bg-white overflow-hidden"
              style={{ border: expanded === item.id || editingItem === item.id ? '1px solid #6B1E2E' : '1px solid #EDD8DE' }}>
              {editingItem === item.id ? (
                <div className="p-4 space-y-2">
                  <input value={itemDraft.title} onChange={e => setItemDraft(d => ({ ...d, title: e.target.value }))}
                    className="w-full text-sm font-medium px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
                  <textarea value={itemDraft.content} onChange={e => setItemDraft(d => ({ ...d, content: e.target.value }))}
                    rows={5} className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingItem(null)} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ color: '#6B6458' }}>
                      <X size={13} className="inline mr-1" />Cancelar
                    </button>
                    <button onClick={() => saveItem(item.id)} disabled={savingItem}
                      className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl btn-bordo">
                      {savingItem ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Salvar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="w-full px-4 py-3.5 flex items-center gap-3">
                    {editMode && (
                      <div className="flex flex-col gap-0.5 shrink-0">
                        <button onClick={() => moveItem(item.id, -1)} disabled={i === 0} style={{ color: '#C4A8B0', opacity: i === 0 ? 0.3 : 1 }}>
                          <ChevronUp size={13} />
                        </button>
                        <button onClick={() => moveItem(item.id, 1)} disabled={i === items.length - 1} style={{ color: '#C4A8B0', opacity: i === items.length - 1 ? 0.3 : 1 }}>
                          <ChevronDown size={13} />
                        </button>
                      </div>
                    )}
                    <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                      className="flex-1 flex items-center gap-3 text-left min-w-0">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                        style={{ background: '#F5E8EC', color: '#6B1E2E' }}>{i + 1}</span>
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: '#1C1A17' }}>{item.title}</span>
                      {expanded === item.id
                        ? <ChevronUp size={15} color="#C4A35A" />
                        : <ChevronDown size={15} color="#C4A35A" />}
                    </button>
                    {editMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => startEditItem(item)} className="p-1.5" style={{ color: '#C4A35A' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-1.5" style={{ color: '#B35A5A' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {expanded === item.id && (
                    <div className="px-4 pb-5" style={{ borderTop: '1px solid #F5E8EC' }}>
                      <p className="text-sm leading-relaxed mt-4 whitespace-pre-line" style={{ color: '#6B6458' }}>
                        {item.content}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Notes */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1 mb-2" style={{ color: '#6B1E2E' }}>
            Minhas Anotações
          </p>
          <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
            {notes.length === 0 && (
              <p className="text-sm mb-3" style={{ color: '#C4A8B0', fontStyle: 'italic' }}>Nenhuma anotação ainda.</p>
            )}
            {notes.map(note => (
              <div key={note.id} className="flex gap-3 py-3" style={{ borderBottom: '1px solid #F9F5F6' }}>
                <p className="flex-1 text-sm leading-relaxed" style={{ color: '#1C1A17' }}>{note.content}</p>
                <button onClick={() => { supabase.from('notes').delete().eq('id', note.id); setNotes(p => p.filter(n => n.id !== note.id)) }}
                  className="shrink-0" style={{ color: '#C4A8B0' }}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-3">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Adicionar anotação..."
                className="flex-1 text-sm px-3 py-2.5 rounded-xl focus:outline-none"
                style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              <button onClick={addNote}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 btn-bordo">
                <Plus size={16} color="#fff" />
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
