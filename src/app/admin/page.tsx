'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Image from 'next/image'
import { ArrowLeft, X, Eye, EyeOff, UserPlus } from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string; name: string; role: string; is_active: boolean
  access_pop: boolean; access_cursos: boolean
  access_checklist: boolean; access_quiz: boolean
  access_lista_compras: boolean
}

const PERMS = [
  { key: 'access_pop',       label: 'Manual POP',  icon: '📋', desc: 'Acesso ao manual completo' },
  { key: 'access_cursos',    label: 'Cursos',       icon: '🎓', desc: 'Assistir aulas e treinamentos' },
  { key: 'access_checklist', label: 'Checklist',    icon: '✅', desc: 'Marcar itens do checklist' },
  { key: 'access_quiz',      label: 'Provas',       icon: '📝', desc: 'Realizar testes e avaliações' },
  { key: 'access_lista_compras', label: 'Lista de Compras', icon: '🛒', desc: 'Ver a lista de compras da clínica' },
]

export default function AdminPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [expandedUser, setExpandedUser] = useState<string | null>(null)
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'team' })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      // Verifica se é admin via perfil próprio
      const { data: p } = await supabase
        .from('profiles').select('role').eq('id', data.user.id).single()
      if (!p || p.role !== 'admin') { router.push('/dashboard'); return }
      loadProfiles()
    })
  }, [router])

  async function loadProfiles() {
    // Usa função segura que bypassa RLS
    const { data } = await supabase.rpc('list_team_profiles')
    if (data) setProfiles(data)
    setLoading(false)
  }

  async function togglePerm(userId: string, key: string, val: boolean) {
    setSaving(userId + key)
    await supabase.rpc('update_member_permission', {
      p_user_id: userId, p_field: key, p_value: val
    })
    setProfiles(p => p.map(u => u.id === userId ? { ...u, [key]: val } : u))
    setSaving(null)
  }

  async function createUser() {
    if (!form.name || !form.email || !form.password) { setFormError('Preencha todos os campos.'); return }
    if (form.password.length < 6) { setFormError('Senha mínimo 6 caracteres.'); return }
    setFormLoading(true); setFormError('')
    const { error } = await supabase.rpc('create_team_member', {
      p_name: form.name, p_email: form.email,
      p_password: form.password, p_role: form.role
    })
    if (error) {
      setFormError('Erro: ' + error.message)
    } else {
      setShowForm(false)
      setForm({ name: '', email: '', password: '', role: 'team' })
      loadProfiles()
    }
    setFormLoading(false)
  }

  const team     = profiles.filter(p => p.role === 'team')
  const students = profiles.filter(p => p.role === 'student')

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
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
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl btn-bordo font-semibold text-sm tracking-wide">
          <UserPlus size={17} color="#fff" />
          Cadastrar Funcionário
        </button>

        {showForm && (
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #6B1E2E' }}>
            <div className="flex items-center justify-between px-4 py-3 header-bg">
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>Novo Funcionário</span>
              <button onClick={() => { setShowForm(false); setFormError('') }}>
                <X size={18} color="#E8CFA0" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Nome', type: 'text', key: 'name', placeholder: 'Nome completo' },
                { label: 'E-mail', type: 'email', key: 'email', placeholder: 'email@exemplo.com' },
              ].map(({ label, type, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5"
                    style={{ color: '#6B1E2E' }}>{label}</label>
                  <input type={type} value={form[key as keyof typeof form]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                </div>
              ))}
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: '#6B1E2E' }}>Senha inicial</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full px-3 py-2.5 pr-10 rounded-xl text-sm focus:outline-none"
                    style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
                  <button type="button" onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: '#C4A35A' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5"
                  style={{ color: '#6B1E2E' }}>Tipo</label>
                <div className="flex gap-2">
                  {[{ v: 'team', l: '👥 Equipe' }, { v: 'student', l: '🎓 Aluno(a)' }].map(({ v, l }) => (
                    <button key={v} onClick={() => setForm(f => ({ ...f, role: v }))}
                      className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                      style={{
                        background: form.role === v ? '#6B1E2E' : '#F9F5F6',
                        color: form.role === v ? '#fff' : '#6B6458',
                        border: `1px solid ${form.role === v ? '#6B1E2E' : '#EDD8DE'}`
                      }}>{l}</button>
                  ))}
                </div>
              </div>
              <div className="rounded-xl p-3" style={{ background: '#F5EDD8', border: '1px solid #E8CFA0' }}>
                <p className="text-[11px] font-semibold mb-1" style={{ color: '#9E7E3A' }}>📋 Permissão inicial</p>
                <p className="text-[11px]" style={{ color: '#9E7E3A' }}>
                  POP liberado por padrão. Libere os demais módulos depois.
                </p>
              </div>
              {formError && (
                <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{formError}</p>
              )}
              <button onClick={createUser} disabled={formLoading}
                className="w-full py-3 rounded-xl text-sm font-semibold btn-bordo disabled:opacity-60">
                {formLoading ? 'Cadastrando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
            ))}
          </div>
        ) : (
          <>
            {[{ label: 'Equipe', list: team }, { label: 'Alunos', list: students }].map(({ label, list }) =>
              list.length > 0 && (
                <div key={label}>
                  <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1 mb-2" style={{ color: '#6B1E2E' }}>
                    {label} · {list.length}
                  </p>
                  <div className="space-y-2">
                    {list.map(u => (
                      <UserCard key={u.id} user={u}
                        expanded={expandedUser === u.id}
                        onToggle={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                        onPerm={togglePerm} saving={saving} />
                    ))}
                  </div>
                </div>
              )
            )}
            {profiles.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center" style={{ border: '1px solid #EDD8DE' }}>
                <p className="text-3xl mb-3">👥</p>
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
      className="relative w-12 h-6 rounded-full transition-all shrink-0 disabled:opacity-50"
      style={{ background: on ? '#6B1E2E' : '#E8D0D8' }}>
      <div className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
        style={{ left: on ? '26px' : '2px' }} />
    </button>
  )
}

function UserCard({ user, expanded, onToggle, onPerm, saving }: {
  user: Profile; expanded: boolean; onToggle: () => void
  onPerm: (id: string, key: string, val: boolean) => void; saving: string | null
}) {
  const activePerms = PERMS.filter(p => user[p.key as keyof Profile])
  return (
    <div className="rounded-2xl bg-white overflow-hidden"
      style={{ border: `1px solid ${expanded ? '#6B1E2E' : '#EDD8DE'}`, opacity: user.is_active ? 1 : 0.55 }}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left">
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 btn-bordo">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: '#1C1A17' }}>{user.name}</div>
          <div className="flex gap-1 mt-1">
            {activePerms.map(p => (
              <span key={p.key} className="text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: '#F5EDD8', color: '#9E7E3A' }}>{p.icon}</span>
            ))}
            {!user.is_active && (
              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: '#F5E8EC', color: '#8B2A3D' }}>Inativo</span>
            )}
          </div>
        </div>
        <span className="text-[11px]" style={{ color: '#C4A35A' }}>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div style={{ borderTop: '1px solid #F9F5F6' }}>
          <div className="px-4 pt-3 pb-4 space-y-3.5">
            <p className="text-[11px] font-semibold tracking-[0.1em] uppercase" style={{ color: '#6B1E2E' }}>
              Permissões
            </p>
            {PERMS.map(perm => (
              <div key={perm.key} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-lg">{perm.icon}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#1C1A17' }}>{perm.label}</div>
                    <div className="text-[11px]" style={{ color: '#B0A898' }}>{perm.desc}</div>
                  </div>
                </div>
                <Toggle on={user[perm.key as keyof Profile] as boolean}
                  onChange={v => onPerm(user.id, perm.key, v)}
                  loading={saving === user.id + perm.key} />
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 mt-1"
              style={{ borderTop: '1px solid #F9F5F6' }}>
              <div>
                <div className="text-sm font-medium" style={{ color: '#1C1A17' }}>Conta ativa</div>
                <div className="text-[11px]" style={{ color: '#B0A898' }}>Desativar bloqueia o acesso</div>
              </div>
              <Toggle on={user.is_active} onChange={v => onPerm(user.id, 'is_active', v)}
                loading={saving === user.id + 'is_active'} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
