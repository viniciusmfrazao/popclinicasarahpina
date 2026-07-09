'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { useAccount } from '@/lib/useAccount'
import { Section, SectionItem } from '@/lib/types'
import { generatePOPManualPDF, popManualFileName } from '@/lib/pop-pdf'
import { ChevronRight, Plus, Download, Loader2, X } from 'lucide-react'

const STATUS = {
  levantado: { label: 'Concluído', bg: '#EEF2EB', color: '#4A7A3E' },
  parcial:   { label: 'Parcial',   bg: '#F5EDD8', color: '#9E7E3A' },
  pendente:  { label: 'Pendente',  bg: '#F5E8EC', color: '#8B2A3D' },
}
const ICONS: Record<string, string> = {
  cultura: '🌸', jornada: '🗺️', pop_fotos: '📸', reuniao: '📋', scripts: '💬',
  marketing: '📱', profissionais: '👥', automacoes: '⚡',
  juridico: '📄', financeiro: '💰', cursos: '🎓', nao_fazer: '🚫', comercial: '🤝',
}
const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
}

export default function POPPage() {
  const { account, isAdmin, loading: accountLoading } = useAccount()
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', icon: '📌', summary: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (!account) return
    supabase.from('sections').select('*').eq('account_id', account.id).order('sort_order')
      .then(({ data }) => { if (data) setSections(data); setLoading(false) })
  }, [account])

  async function createSection() {
    if (!account || !form.title.trim()) { setFormError('Dê um título para a seção.'); return }
    const id = slugify(form.title)
    if (!id) { setFormError('Título inválido.'); return }
    if (sections.some(s => s.id === id)) { setFormError('Já existe uma seção com esse nome.'); return }
    setSaving(true); setFormError('')
    const sortOrder = sections.length > 0 ? Math.max(...sections.map(s => s.sort_order)) + 1 : 0
    const { data, error } = await supabase.from('sections').insert({
      id, account_id: account.id, title: form.title.trim(), summary: form.summary.trim(),
      icon: form.icon || '📌', color: account.primary_color, status: 'pendente', sort_order: sortOrder,
    }).select().single()
    setSaving(false)
    if (error) { setFormError('Erro ao criar seção: ' + error.message); return }
    if (data) setSections(p => [...p, data])
    setShowForm(false)
    setForm({ title: '', icon: '📌', summary: '' })
  }

  async function exportManual() {
    if (!account) return
    setExporting(true)
    try {
      const { data: allItems } = await supabase.from('section_items').select('*').eq('account_id', account.id).order('sort_order')
      const itemsBySectionId: Record<string, SectionItem[]> = {}
      ;(allItems ?? []).forEach(item => {
        (itemsBySectionId[item.section_id] ??= []).push(item)
      })
      const doc = await generatePOPManualPDF(sections, itemsBySectionId, account)
      doc.save(popManualFileName(account))
    } finally {
      setExporting(false)
    }
  }

  const levantado = sections.filter(s => s.status === 'levantado').length
  const pct = sections.length > 0 ? Math.round((levantado / sections.length) * 100) : 0

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <p className="text-[11px] tracking-[0.25em] uppercase font-medium mb-1" style={{ color: '#E8CFA0' }}>
          {account?.name ?? 'Sistema POP'}
        </p>
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
          {(['levantado', 'parcial', 'pendente'] as const).map(s => (
            <div key={s} className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS[s].color }} />
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
                {STATUS[s].label} · {sections.filter(x => x.status === s).length}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="flex gap-2">
          <button onClick={exportManual} disabled={exporting || sections.length === 0}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-semibold"
            style={{ background: '#fff', border: '1px solid #EDD8DE', color: '#6B1E2E' }}>
            {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            Baixar manual completo (PDF)
          </button>
          {isAdmin && (
            <button onClick={() => setShowForm(true)}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 btn-bordo">
              <Plus size={18} color="#fff" />
            </button>
          )}
        </div>

        {showForm && (
          <div className="rounded-2xl bg-white p-4 space-y-2.5" style={{ border: '1px solid #6B1E2E' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>Nova seção</p>
              <button onClick={() => setShowForm(false)} style={{ color: '#C4A8B0' }}><X size={16} /></button>
            </div>
            <div className="flex gap-2">
              <input value={form.icon} onChange={e => setForm(f => ({ ...f, icon: e.target.value.slice(0, 2) }))}
                placeholder="📌" maxLength={2}
                className="w-14 text-center text-lg px-2 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Título da seção" autoFocus
                className="flex-1 text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
            </div>
            <textarea value={form.summary} onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
              placeholder="Resumo (opcional)" rows={2}
              className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
            {formError && <p className="text-xs" style={{ color: '#B35A5A' }}>{formError}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="text-xs font-medium px-3 py-2 rounded-xl" style={{ color: '#6B6458' }}>
                Cancelar
              </button>
              <button onClick={createSection} disabled={saving}
                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-xl btn-bordo">
                {saving ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Criar seção
              </button>
            </div>
          </div>
        )}

        {(loading || accountLoading) ? (
          <div className="space-y-2.5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
            ))}
          </div>
        ) : sections.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
            <p className="text-sm" style={{ color: '#8A8178' }}>
              {isAdmin ? 'Nenhuma seção ainda. Crie a primeira acima.' : 'Nenhuma seção cadastrada ainda.'}
            </p>
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
                    {s.icon || ICONS[s.id] || '📌'}
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
