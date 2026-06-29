'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Section, SectionItem, Note } from '@/lib/types'
import { ChevronDown, ChevronUp, Plus, Trash2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const STATUS = {
  levantado: { label: 'Levantado', bg: '#E1F5EE', color: '#0F6E56' },
  parcial: { label: 'Parcial', bg: '#FAEEDA', color: '#BA7517' },
  pendente: { label: 'Pendente', bg: '#FBEAF0', color: '#993556' },
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
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      Promise.all([
        supabase.from('sections').select('*').eq('id', id).single(),
        supabase.from('section_items').select('*').eq('section_id', id).order('sort_order'),
        supabase.from('notes').select('*').eq('section_id', id).eq('user_id', data.user.id).order('created_at'),
      ]).then(([{ data: sec }, { data: its }, { data: nts }]) => {
        if (sec) setSection(sec)
        if (its) setItems(its)
        if (nts) setNotes(nts)
      })
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

  if (!section) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" /></div>

  const st = STATUS[section.status]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/pop"><ArrowLeft size={20} color="#D4537E" /></Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-gray-900 truncate">{section.title}</h1>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: st.bg, color: st.color }}>{st.label}</span>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="text-sm text-gray-600">{section.summary}</p>
        </div>

        {/* Items */}
        {items.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1">Conteúdo</h2>
            {items.map(item => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left">
                  <span className="text-sm font-medium text-gray-900">{item.title}</span>
                  {expanded === item.id ? <ChevronUp size={16} color="#9CA3AF" /> : <ChevronDown size={16} color="#9CA3AF" />}
                </button>
                {expanded === item.id && (
                  <div className="px-4 pb-4 border-t border-gray-50">
                    <p className="text-sm text-gray-600 leading-relaxed mt-3 whitespace-pre-line">{item.content}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">Minhas Anotações</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            {notes.map(note => (
              <div key={note.id} className="flex gap-3 py-2.5 border-b border-gray-50 last:border-0">
                <p className="flex-1 text-sm text-gray-700 leading-relaxed">{note.content}</p>
                <button onClick={() => deleteNote(note.id)} className="shrink-0 p-1 text-gray-300 hover:text-red-400">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {notes.length === 0 && <p className="text-sm text-gray-400 mb-3">Nenhuma anotação ainda.</p>}
            <div className="flex gap-2 mt-3">
              <input value={noteText} onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addNote()}
                placeholder="Adicionar anotação..."
                className="flex-1 text-sm px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 focus:outline-none text-gray-900" />
              <button onClick={addNote}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: '#D4537E' }}>
                <Plus size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
