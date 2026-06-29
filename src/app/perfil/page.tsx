'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { LogOut, User, Shield, BookOpen, GraduationCap } from 'lucide-react'

export default function PerfilPage() {
  const [profile, setProfile] = useState<{ name: string; role: string; created_at: string } | null>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setEmail(data.user.email ?? '')
      supabase.from('profiles').select('name,role,created_at').eq('id', data.user.id).single()
        .then(({ data: p }) => p && setProfile(p))
    })
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel = { admin: 'Administradora', team: 'Equipe', student: 'Aluna' }[profile?.role ?? 'team']

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">Meu Perfil</h1>
      </div>
      <div className="px-4 py-6 space-y-4">
        {/* Avatar + name */}
        <div className="bg-white rounded-2xl p-6 flex flex-col items-center border border-gray-100">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3"
            style={{ background: '#D4537E' }}>
            {profile?.name?.charAt(0).toUpperCase() ?? <User size={24} />}
          </div>
          <h2 className="text-base font-semibold text-gray-900">{profile?.name ?? '...'}</h2>
          <p className="text-sm text-gray-500">{email}</p>
          <span className="mt-2 text-xs font-medium px-3 py-1 rounded-full" style={{ background: '#FBEAF0', color: '#D4537E' }}>
            {roleLabel}
          </span>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {[
            { icon: BookOpen, label: 'Manual POP', href: '/pop', color: '#D4537E' },
            { icon: GraduationCap, label: 'Cursos', href: '/cursos', color: '#1D9E75' },
            { icon: Shield, label: 'Privacidade', href: '#', color: '#534AB7' },
          ].map(({ icon: Icon, label, href, color }) => (
            <a key={label} href={href}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0">
              <Icon size={18} color={color} />
              <span className="text-sm text-gray-700 flex-1">{label}</span>
              <span className="text-gray-300 text-xs">→</span>
            </a>
          ))}
        </div>

        <button onClick={logout}
          className="w-full bg-white rounded-2xl p-4 flex items-center justify-center gap-2 border border-gray-100 text-red-500">
          <LogOut size={16} />
          <span className="text-sm font-medium">Sair da conta</span>
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
