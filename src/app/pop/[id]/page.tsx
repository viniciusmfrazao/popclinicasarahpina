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
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#5A7A4E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F0ECE8', color: '#8A7A6E' },
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
    const { data } = await supabase.from('notes').insert({ section_id: id, user_id: userId, content: noteText.trim() }).select().single()
    if (data) { setNotes(p => [...p, data]); setNoteText('') }
  }

  async function deleteNote(noteId: string) {
    await supabase.from('notes').delete().eq('id', noteId)
    setNotes(p => p.filter(n => n.id !== noteId))
  }

  if (!section) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F7F5F0' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C4A35A', borderTopColor: 'transparent' }} />
    </div>
  )

  const st = STATUS[section.status]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 py-3.5 flex items-center gap-3"
        style={{ background: '#1C1A17', borderBottom: '1px solid #2D2A24' }}>
        <Link href="/pop">
          <ArrowLeft size={20} color="#C4A35A" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold truncate" style={{ color: '#F5EDD8' }}>{section.title}</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Summary */}
        <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#6B6458' }}>{section.summary}</p>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.1em] uppercase px-1" style={{ color: '#9E7E3A' }}>Conteúdo</p>
            {items.map((item, i) => (
              <div key={item.id} className="rounded-2xl overflow-hidden"
                style={{ background: '#fff', border: expanded === item.id ? '1px solid #C4A35A' : '1px solid #E8DCC8' }}>
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: '#F5EDD8', color: '#9E7E3A' }}>{i + 1}</span>
                    <span className="text-sm font-medium" style={{ color: '#1C1A17' }}>{item.title}</span>
                  </div>
                  {expanded === item.id
                    ? <ChevronUp size={15} color="#C4A35A" />
                    : <ChevronDown size={15} color="#C4A35A" />}
                </button>
                {expanded === item.id && (
                  <div className="px-4 pb-4" style={{ borderTop: '1px solid #F5EDD8' }}>
                    <p className="text-sm leading-relaxed mt-3 whitespace-pre-line" style={{ color: '#6B6458' }}>{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="text-xs font-medium tracking-[0.1em] uppercase px-1 mb-2" style={{ color: '#9E7E3A' }}>Minhas Anotações</p>
          <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
            {notes.map(note => (
              <div key={note.id} className="flex gap-3 py-2.5" style={{ borderBottom: '1px solid #F5EDD8' }}>
                <p className="flex-1 text-sm leading-relaxed" style={{ color: '#1C1A17' }}>{note.content}</p>
                <button onClick={() => deleteNote(note.id)} className="shrink-0 p-1" style={{ color: '#C4A35A' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            {notes.length === 0 && (
              <p className="text-sm mb-3" style={{ color: '#B0A898', fontStyle: 'italic' }}>Nenhuma anotação ainda.</p>
            )}
            <div className="flex gap-2 mt-3">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Adicionar anotação..."
                className="flex-1 text-sm px-3 py-2.5 rounded-xl focus:outline-none"
                style={{ background: '#F7F5F0', border: '1px solid #E8DCC8', color: '#1C1A17' }} />
              <button onClick={addNote}
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 gold-gradient">
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
