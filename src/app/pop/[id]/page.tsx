'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Section, SectionItem, Note } from '@/lib/types'
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const STATUS = {
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#4A7A3E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F5E8EC', color: '#8B2A3D' },
}

export default function SectionPage() {
  const { id } = useParams()
  const router = useRouter()
  const [section, setSection] = useState<Section | null>(null)
  const [items, setItems] = useState<SectionItem[]>([])
  const [notes, setNotes] = useState<Note[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [noteText, setNoteText] = useState('')
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      const [{ data: sec }, { data: its }, { data: nts }] = await Promise.all([
        supabase.from('sections').select('*').eq('id', id).single(),
        supabase.from('section_items').select('*').eq('section_id', id).order('sort_order'),
        supabase.from('notes').select('*').eq('section_id', id).eq('user_id', data.user.id).order('created_at'),
      ])
      if (sec) setSection(sec)
      if (its) setItems(its)
      if (nts) setNotes(nts)
    })
  }, [id, router])

  async function addNote() {
    if (!noteText.trim() || !userId) return
    const { data } = await supabase.from('notes')
      .insert({ section_id: id, user_id: userId, content: noteText.trim() }).select().single()
    if (data) { setNotes(p => [...p, data]); setNoteText('') }
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
        <Link href="/pop" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Manual POP</span>
        </Link>
        <h1 className="text-lg font-semibold mb-2" style={{ color: '#fff' }}>{section.title}</h1>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{ background: st.bg, color: st.color }}>{st.label}</span>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Summary */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#6B6458' }}>{section.summary}</p>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1" style={{ color: '#6B1E2E' }}>
              Conteúdo · {items.length} itens
            </p>
            {items.map((item, i) => (
              <div key={item.id} className="rounded-2xl bg-white overflow-hidden"
                style={{ border: expanded === item.id ? '1px solid #6B1E2E' : '1px solid #EDD8DE' }}>
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full px-4 py-3.5 flex items-center gap-3 text-left">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                    style={{ background: '#F5E8EC', color: '#6B1E2E' }}>{i + 1}</span>
                  <span className="flex-1 text-sm font-medium" style={{ color: '#1C1A17' }}>{item.title}</span>
                  {expanded === item.id
                    ? <ChevronUp size={15} color="#C4A35A" />
                    : <ChevronDown size={15} color="#C4A35A" />}
                </button>
                {expanded === item.id && (
                  <div className="px-4 pb-5" style={{ borderTop: '1px solid #F5E8EC' }}>
                    <p className="text-sm leading-relaxed mt-4 whitespace-pre-line" style={{ color: '#6B6458' }}>
                      {item.content}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

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
