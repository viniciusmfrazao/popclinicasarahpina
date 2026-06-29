'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Image from 'next/image'
import { ArrowLeft, Plus, X, Eye, EyeOff, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  name: string
  role: string
  is_active: boolean
  access_pop: boolean
  access_cursos: boolean
  access_checklist: boolean
  access_quiz: boolean
}

const PERMS = [
  { key: 'access_pop',       label: 'Manual POP',  icon: '📋', desc: 'Acesso ao manual completo' },
  { key: 'access_cursos',    label: 'Cursos',       icon: '🎓', desc: 'Assistir aulas e treinamentos' },
  { key: 'access_checklist', label: 'Checklist',    icon: '✅', desc: 'Marcar itens do checklist' },
  { key: 'access_quiz',      label: 'Provas',       icon: '📝', desc: 'Realizar testes e avaliações' },
]

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const router = useRouter()

  // New user form
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (p?.role !== 'admin') { router.push('/dashboard'); return }
      loadProfiles()
    })
  }, [router])

  async function loadProfiles() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .neq('role', 'admin')
      .order('name')
    if (data) setProfiles(data)
    setLoading(false)
  }

  async function togglePerm(userId: string, key: string, val: boolean) {
    setSaving(userId + key)
    await supabase.from('profiles').update({ [key]: val }).eq('id', userId)
    setProfiles(p => p.map(u => u.id === userId ? { ...u, [key]: val } : u))
    setSaving(null)
  }

  async function toggleActive(userId: string, val: boolean) {
    setSaving(userId + 'active')
    await supabase.from('profiles').update({ is_active: val }).eq('id', userId)
    setProfiles(p => p.map(u => u.id === userId ? { ...u, is_active: val } : u))
    setSaving(null)
  }

  async function createUser() {
    if (!form.name || !form.email || !form.password) { setFormError('Preencha todos os campos.'); return }
    if (form.password.length < 6) { setFormError('Senha mínimo 6 caracteres.'); return }
    setFormLoading(true); setFormError('')
    try {
      // Create via Supabase Auth admin SQL
      const { error } = await supabase.rpc('create_team_member', {
        p_name: form.name, p_email: form.email,
        p_password: form.password, p_role: form.role
      })
      if (error) throw error
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'team' })
      loadProfiles()
    } catch {
      // Fallback: direct SQL insert
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) { setFormError('Erro ao criar usuário. Tente novamente.') }
      else { setShowForm(false); setForm({ name: '', email: '', password: '', role: 'team' }); loadProfiles() }
    }
    setFormLoading(false)
  }

  const team = profiles.filter(p => p.role === 'team')
  const students = profiles.filter(p => p.role === 'student')

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      {/* Header */}
      <div className="header-bg px-5 pt-12 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Dashboard</span>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#E8CFA0' }}>Painel Admin</p>
            <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Gestão de Equipe</h1>
          </div>
          <div className="relative w-20 h-12">
            <Image src="/logo.png" alt="SP" fill style={{ objectFit: 'contain', objectPosition: 'right' }} />
          </div>
        </div>
        <div className="mt-4 h-px gold-bar opacity-60" />
      </div>

      <div className="px-4 py-4 space-y-4">

        {/* Add new user button */}
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl btn-bordo font-semibold text-sm tracking-wide">
          <UserPlus size={17} color="#fff" />
          Cadastrar Funcionário
        </button>

        {/* New user form */}
        {showForm && (
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #6B1E2E' }}>
            <div className="flex items-center justify-between px-4 py-3 header-bg">
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>Novo Funcionário</span>
              <button onClick={() => { setShowForm(false); setFormError('') }}>
                <X size={18} color="#E8CFA0" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B1E2E' }}>Nome</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Nome completo"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B1E2E' }}>E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B1E2E' }}>Senha inicial</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none pr-10"
                    style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C4A35A' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B1E2E' }}>Tipo</label>
                <div className="flex gap-2">
                  {[{ v: 'team', l: 'Equipe' }, { v: 'student', l: 'Aluno(a)' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, role: v }))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: form.role === v ? '#6B1E2E' : '#F9F5F6',
                        color: form.role === v ? '#fff' : '#6B6458',
                        border: `1px solid ${form.role === v ? '#6B1E2E' : '#EDD8DE'}`
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Default permissions notice */}
              <div className="rounded-xl p-3" style={{ background: '#F5EDD8', border: '1px solid #E8CFA0' }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: '#9E7E3A' }}>📋 Permissões iniciais</p>
                <p className="text-[11px]" style={{ color: '#9E7E3A' }}>
                  Acesso ao POP liberado por padrão. Você pode liberar Cursos, Checklist e Provas depois.
                </p>
              </div>

              {formError && <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{formError}</p>}

              <button onClick={createUser} disabled={formLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold btn-bordo disabled:opacity-60">
                {formLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        )}

        {/* Team members */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />)}
          </div>
        ) : (
          <>
            {team.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1 mb-2" style={{ color: '#6B1E2E' }}>
                  Equipe · {team.length} {team.length === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <div className="space-y-2">
                  {team.map(u => <UserCard key={u.id} user={u} expanded={expandedUser === u.id}
                    onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    onPerm={togglePerm} onActive={toggleActive} saving={saving} />)}
                </div>
              </div>
            )}

            {students.length > 0 && (
              <div>
                <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1 mb-2" style={{ color: '#6B1E2E' }}>
                  Alunos · {students.length} {students.length === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <div className="space-y-2">
                  {students.map(u => <UserCard key={u.id} user={u} expanded={expandedUser === u.id}
                    onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                    onPerm={togglePerm} onActive={toggleActive} saving={saving} />)}
                </div>
              </div>
            )}

            {profiles.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
                <p className="text-2xl mb-2">👥</p>
                <p className="text-sm font-medium" style={{ color: '#1C1A17' }}>Nenhum funcionário cadastrado</p>
                <p className="text-xs mt-1" style={{ color: '#B0A898' }}>Clique em "Cadastrar Funcionário" para começar</p>
              </div>
            )}
          </>
        )}
      </div>
      <BottomNav />
    </div>
  )
}

function Toggle({ on, onChange, loading }: { on: boolean; onChange: (v: boolean) => void; loading?: boolean }) {
  return (
    <button onClick={() => !loading && onChange(!on)} disabled={loading}
      className="relative w-11 h-6 rounded-full transition-all shrink-0 disabled:opacity-50"
      style={{ background: on ? '#6B1E2E' : '#E8D0D8' }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all"
        style={{ left: on ? '22px' : '2px' }} />
      {loading && <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
      </div>}
    </button>
  )
}

function UserCard({ user, expanded, onToggle, onPerm, onActive, saving }: {
  user: Profile; expanded: boolean;
  onToggle: () => void;
  onPerm: (id: string, key: string, val: boolean) => void;
  onActive: (id: string, val: boolean) => void;
  saving: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white overflow-hidden"
      style={{ border: `1px solid ${expanded ? '#6B1E2E' : '#EDD8DE'}`, opacity: user.is_active ? 1 : 0.6 }}>
      {/* User row */}
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 btn-bordo">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: '#1C1A17' }}>{user.name}</div>
          <div className="flex gap-1.5 mt-0.5 flex-wrap">
            {PERMS.map(p => user[p.key as keyof Profile] && (
              <span key={p.key} className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: '#F5EDD8', color: '#9E7E3A' }}>{p.icon}</span>
            ))}
            {!user.is_active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: '#F5E8EC', color: '#8B2A3D' }}>
                Inativo
              </span>
            )}
          </div>
        </div>
        <div className="text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0"
          style={{ background: '#F5E8EC', color: '#6B1E2E' }}>
          {expanded ? '▲' : '▼'}
        </div>
      </button>

      {/* Permissions panel */}
      {expanded && (
        <div style={{ borderTop: '1px solid #F9F5F6' }}>
          <div className="px-4 py-3 space-y-3">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#6B1E2E' }}>
              Permissões de Acesso
            </p>
            {PERMS.map(perm => (
              <div key={perm.key} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-base">{perm.icon}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1C1A17' }}>{perm.label}</div>
                    <div className="text-[11px]" style={{ color: '#B0A898' }}>{perm.desc}</div>
                  </div>
                </div>
                <Toggle
                  on={user[perm.key as keyof Profile] as boolean}
                  onChange={v => onPerm(user.id, perm.key, v)}
                  loading={saving === user.id + perm.key} />
              </div>
            ))}
          </div>

          {/* Active toggle */}
          <div className="mx-4 mb-4 mt-1 rounded-xl p-3 flex items-center justify-between"
            style={{ background: '#F9F5F6', border: '1px solid #EDD8DE' }}>
            <div>
              <div className="text-sm font-medium" style={{ color: '#1C1A17' }}>Conta ativa</div>
              <div className="text-[11px]" style={{ color: '#B0A898' }}>Desativar bloqueia o acesso</div>
            </div>
            <Toggle on={user.is_active} onChange={v => onActive(user.id, v)}
              loading={saving === user.id + 'active'} />
          </div>
        </div>
      )}
    </div>
  )
}
