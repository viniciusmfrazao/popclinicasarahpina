'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { useAccount } from '@/lib/useAccount'
import { TeamActivity, ActivityFrequency, Section, SectionItem } from '@/lib/types'
import {
  ArrowLeft, Plus, Pencil, Trash2, Check, X, Loader2, ListChecks,
  Link2, User, ChevronDown,
} from 'lucide-react'

const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }

const FREQ_OPTIONS: { value: ActivityFrequency; label: string }[] = [
  { value: 'diaria', label: 'Diária' },
  { value: 'semanal', label: 'Semanal' },
  { value: 'mensal', label: 'Mensal' },
]

const FREQ_STYLE: Record<ActivityFrequency, { bg: string; color: string }> = {
  diaria: { bg: '#F5E8EC', color: '#6B1E2E' },
  semanal: { bg: '#FBF1DC', color: '#8A6A1E' },
  mensal: { bg: '#EAF1EC', color: '#3C6B4A' },
}

interface ProfileOption { id: string; name: string }

export default function TeamActivitiesPage() {
  const router = useRouter()
  const { account, isAdmin, loading } = useAccount()

  const [activities, setActivities] = useState<TeamActivity[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [sectionItems, setSectionItems] = useState<SectionItem[]>([])
  const [profiles, setProfiles] = useState<ProfileOption[]>([])
  const [loadingList, setLoadingList] = useState(true)

  // filtro
  const [profileFilter, setProfileFilter] = useState<string>('all')

  // novo item
  const [newTitle, setNewTitle] = useState('')
  const [newFreq, setNewFreq] = useState<ActivityFrequency>('diaria')
  const [newSectionItemId, setNewSectionItemId] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // edição
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editFreq, setEditFreq] = useState<ActivityFrequency>('diaria')
  const [editSectionItemId, setEditSectionItemId] = useState('')
  const [saving, setSaving] = useState(false)

  // qual card tem o seletor de processo/colaboradora aberto
  const [openLinker, setOpenLinker] = useState<string | null>(null)
  const [openAssigner, setOpenAssigner] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !isAdmin) { router.push('/dashboard'); return }
    if (account) loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account, loading, isAdmin])

  async function loadAll() {
    if (!account) return
    const [{ data: acts }, { data: secs }, { data: items }, { data: profs }] = await Promise.all([
      supabase.from('team_activities').select('*').eq('account_id', account.id).order('sort_order'),
      supabase.from('sections').select('*').eq('account_id', account.id).order('sort_order'),
      supabase.from('section_items').select('*').eq('account_id', account.id).order('sort_order'),
      supabase.rpc('list_team_profiles'),
    ])
    if (acts) setActivities(acts)
    if (secs) setSections(secs)
    if (items) setSectionItems(items)
    if (profs) setProfiles(profs.map((p: { id: string; name: string }) => ({ id: p.id, name: p.name })))
    setLoadingList(false)
  }

  const sectionTitleById = useMemo(() => {
    const m: Record<string, string> = {}
    sections.forEach(s => { m[s.id] = s.title })
    return m
  }, [sections])

  const itemById = useMemo(() => {
    const m: Record<string, SectionItem> = {}
    sectionItems.forEach(i => { m[i.id] = i })
    return m
  }, [sectionItems])

  const profileById = useMemo(() => {
    const m: Record<string, string> = {}
    profiles.forEach(p => { m[p.id] = p.name })
    return m
  }, [profiles])

  const visibleActivities = useMemo(() => {
    if (profileFilter === 'all') return activities
    if (profileFilter === 'unassigned') return activities.filter(a => !a.profile_id)
    return activities.filter(a => a.profile_id === profileFilter)
  }, [activities, profileFilter])

  async function createActivity() {
    if (!account || !newTitle.trim()) return
    setError('')
    setCreating(true)
    const sortOrder = activities.length > 0 ? Math.max(...activities.map(a => a.sort_order)) + 1 : 0
    const { data, error: err } = await supabase.from('team_activities')
      .insert({
        account_id: account.id,
        title: newTitle.trim(),
        frequency: newFreq,
        section_item_id: newSectionItemId || null,
        sort_order: sortOrder,
      }).select().single()
    setCreating(false)
    if (err) { setError('Erro ao criar: ' + err.message); return }
    if (data) setActivities(p => [...p, data])
    setNewTitle('')
    setNewFreq('diaria')
    setNewSectionItemId('')
  }

  function startEdit(a: TeamActivity) {
    setEditingId(a.id)
    setEditTitle(a.title)
    setEditFreq(a.frequency)
    setEditSectionItemId(a.section_item_id || '')
    setOpenLinker(null)
    setOpenAssigner(null)
  }

  async function saveEdit(id: string) {
    if (!editTitle.trim()) return
    setSaving(true)
    const { error: err } = await supabase.from('team_activities')
      .update({ title: editTitle.trim(), frequency: editFreq, section_item_id: editSectionItemId || null, updated_at: new Date().toISOString() })
      .eq('id', id)
    setSaving(false)
    if (err) return
    setActivities(p => p.map(a => a.id === id
      ? { ...a, title: editTitle.trim(), frequency: editFreq, section_item_id: editSectionItemId || null }
      : a))
    setEditingId(null)
  }

  async function deleteActivity(id: string) {
    setActivities(p => p.filter(a => a.id !== id))
    await supabase.from('team_activities').delete().eq('id', id)
  }

  async function assignProfile(activityId: string, profileId: string) {
    setAssigning(activityId)
    const { error: err } = await supabase.from('team_activities')
      .update({ profile_id: profileId || null, updated_at: new Date().toISOString() })
      .eq('id', activityId)
    setAssigning(null)
    if (err) return
    setActivities(p => p.map(a => a.id === activityId ? { ...a, profile_id: profileId || null } : a))
    setOpenAssigner(null)
  }

  async function linkSectionItem(activityId: string, sectionItemId: string) {
    setAssigning(activityId)
    const { error: err } = await supabase.from('team_activities')
      .update({ section_item_id: sectionItemId || null, updated_at: new Date().toISOString() })
      .eq('id', activityId)
    setAssigning(null)
    if (err) return
    setActivities(p => p.map(a => a.id === activityId ? { ...a, section_item_id: sectionItemId || null } : a))
    setOpenLinker(null)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <Link href="/admin" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Painel Admin</span>
        </Link>
        <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#E8CFA0' }}>Equipe</p>
        <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Atividades por Colaboradora</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Cadastre as atividades e vincule à colaboradora e ao processo do POP quando quiser
        </p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {/* Novo item */}
        <div className="rounded-2xl bg-white p-4 space-y-3" style={{ border: '1px solid #EDD8DE' }}>
          <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#6B1E2E' }}>
            Nova atividade
          </label>

          <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createActivity()}
            placeholder="Ex: Higienizar sala de procedimentos"
            className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />

          <div className="flex gap-2">
            {FREQ_OPTIONS.map(f => (
              <button key={f.value} onClick={() => setNewFreq(f.value)}
                className="flex-1 text-xs font-semibold py-2 rounded-xl transition"
                style={newFreq === f.value
                  ? { background: FREQ_STYLE[f.value].bg, color: FREQ_STYLE[f.value].color, border: `1px solid ${FREQ_STYLE[f.value].color}33` }
                  : { background: '#F9F5F6', color: '#B0A898', border: '1px solid #EDD8DE' }}>
                {f.label}
              </button>
            ))}
          </div>

          <div>
            <label className="flex items-center gap-1 text-[11px] mb-1.5" style={{ color: '#8A8178' }}>
              <Link2 size={12} /> Vincular a um processo do POP (opcional)
            </label>
            <select value={newSectionItemId} onChange={e => setNewSectionItemId(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none appearance-none" style={inputStyle}>
              <option value="">Sem vínculo — cadastrar solta</option>
              {sections.map(s => {
                const items = sectionItems.filter(i => i.section_id === s.id)
                if (items.length === 0) return null
                return (
                  <optgroup key={s.id} label={s.title}>
                    {items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                  </optgroup>
                )
              })}
            </select>
          </div>

          <button onClick={createActivity} disabled={creating || !newTitle.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl btn-bordo font-semibold text-sm disabled:opacity-50">
            {creating ? <Loader2 size={16} className="animate-spin" color="#fff" /> : <Plus size={16} color="#fff" />}
            Adicionar atividade
          </button>
          {error && <p className="text-xs" style={{ color: '#B35A5A' }}>{error}</p>}
        </div>

        {/* Filtro por colaboradora */}
        {activities.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
            <FilterChip active={profileFilter === 'all'} onClick={() => setProfileFilter('all')} label="Todas" />
            <FilterChip active={profileFilter === 'unassigned'} onClick={() => setProfileFilter('unassigned')} label="Não atribuídas" />
            {profiles.map(p => (
              <FilterChip key={p.id} active={profileFilter === p.id} onClick={() => setProfileFilter(p.id)} label={p.name} />
            ))}
          </div>
        )}

        {/* Lista */}
        {loadingList ? (
          <div className="space-y-2">{[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
          ))}</div>
        ) : visibleActivities.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
            <ListChecks size={24} color="#C4A8B0" className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: '#8A8178' }}>
              {activities.length === 0 ? 'Nenhuma atividade cadastrada ainda.' : 'Nenhuma atividade nesse filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {visibleActivities.map(a => {
              const linkedItem = a.section_item_id ? itemById[a.section_item_id] : null
              const assignedName = a.profile_id ? profileById[a.profile_id] : null
              const isEditing = editingId === a.id

              return (
                <div key={a.id} className="rounded-2xl bg-white p-3.5 space-y-2.5" style={{ border: '1px solid #EDD8DE' }}>
                  {isEditing ? (
                    <>
                      <input value={editTitle} onChange={e => setEditTitle(e.target.value)} autoFocus
                        className="w-full text-sm px-3 py-2 rounded-xl focus:outline-none" style={inputStyle} />
                      <div className="flex gap-2">
                        {FREQ_OPTIONS.map(f => (
                          <button key={f.value} onClick={() => setEditFreq(f.value)}
                            className="flex-1 text-xs font-semibold py-1.5 rounded-lg"
                            style={editFreq === f.value
                              ? { background: FREQ_STYLE[f.value].bg, color: FREQ_STYLE[f.value].color }
                              : { background: '#F9F5F6', color: '#B0A898', border: '1px solid #EDD8DE' }}>
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <select value={editSectionItemId} onChange={e => setEditSectionItemId(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none" style={inputStyle}>
                        <option value="">Sem vínculo com processo</option>
                        {sections.map(s => {
                          const items = sectionItems.filter(i => i.section_id === s.id)
                          if (items.length === 0) return null
                          return (
                            <optgroup key={s.id} label={s.title}>
                              {items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                            </optgroup>
                          )
                        })}
                      </select>
                      <div className="flex gap-2 justify-end pt-1">
                        <button onClick={() => setEditingId(null)} className="p-2 rounded-lg" style={{ color: '#C4A8B0' }}>
                          <X size={16} />
                        </button>
                        <button onClick={() => saveEdit(a.id)} disabled={saving}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg btn-bordo text-xs font-semibold">
                          {saving ? <Loader2 size={14} className="animate-spin" color="#fff" /> : <Check size={14} color="#fff" />}
                          <span style={{ color: '#fff' }}>Salvar</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-2">
                        <span className="flex-1 text-sm font-medium leading-snug" style={{ color: '#1C1A17' }}>{a.title}</span>
                        <button onClick={() => startEdit(a)} className="p-1.5 shrink-0" style={{ color: '#C4A35A' }}>
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => deleteActivity(a.id)} className="p-1.5 shrink-0" style={{ color: '#B35A5A' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-semibold px-2 py-1 rounded-full"
                          style={{ background: FREQ_STYLE[a.frequency].bg, color: FREQ_STYLE[a.frequency].color }}>
                          {FREQ_OPTIONS.find(f => f.value === a.frequency)?.label}
                        </span>

                        {linkedItem ? (
                          <button onClick={() => { setOpenLinker(openLinker === a.id ? null : a.id); setOpenAssigner(null) }}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                            style={{ background: '#EAF1EC', color: '#3C6B4A' }}>
                            <Link2 size={10} />
                            {sectionTitleById[linkedItem.section_id]} · {linkedItem.title}
                          </button>
                        ) : (
                          <button onClick={() => { setOpenLinker(openLinker === a.id ? null : a.id); setOpenAssigner(null) }}
                            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                            style={{ background: '#F9F5F6', color: '#B0A898', border: '1px dashed #EDD8DE' }}>
                            <Link2 size={10} />
                            Vincular processo
                          </button>
                        )}

                        <button onClick={() => { setOpenAssigner(openAssigner === a.id ? null : a.id); setOpenLinker(null) }}
                          className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full"
                          style={assignedName
                            ? { background: '#F5E8EC', color: '#6B1E2E' }
                            : { background: '#F9F5F6', color: '#B0A898', border: '1px dashed #EDD8DE' }}>
                          <User size={10} />
                          {assignedName || 'Sem colaboradora'}
                          <ChevronDown size={10} />
                        </button>
                      </div>

                      {openAssigner === a.id && (
                        <div className="pt-1">
                          <select autoFocus defaultValue={a.profile_id || ''} disabled={assigning === a.id}
                            onChange={e => assignProfile(a.id, e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none" style={inputStyle}>
                            <option value="">Sem colaboradora</option>
                            {profiles.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                      )}

                      {openLinker === a.id && (
                        <div className="pt-1">
                          <select autoFocus defaultValue={a.section_item_id || ''} disabled={assigning === a.id}
                            onChange={e => linkSectionItem(a.id, e.target.value)}
                            className="w-full text-xs px-3 py-2 rounded-xl focus:outline-none" style={inputStyle}>
                            <option value="">Sem vínculo com processo</option>
                            {sections.map(s => {
                              const items = sectionItems.filter(i => i.section_id === s.id)
                              if (items.length === 0) return null
                              return (
                                <optgroup key={s.id} label={s.title}>
                                  {items.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
                                </optgroup>
                              )
                            })}
                          </select>
                        </div>
                      )}
                    </>
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

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick}
      className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full whitespace-nowrap"
      style={active ? { background: '#6B1E2E', color: '#fff' } : { background: '#fff', color: '#8A8178', border: '1px solid #EDD8DE' }}>
      {label}
    </button>
  )
}
