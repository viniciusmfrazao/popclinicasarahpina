'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { LogOut, BookOpen, GraduationCap } from 'lucide-react'
import Image from 'next/image'

export default function PerfilPage() {
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null)
  const [email, setEmail] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setEmail(data.user.email ?? '')
      supabase.from('profiles').select('name,role').eq('id', data.user.id).single()
        .then(({ data: p }) => p && setProfile(p))
    })
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const roleLabel = { admin: 'Administradora', team: 'Equipe', student: 'Aluna' }[profile?.role ?? 'team']
  const initial = profile?.name?.charAt(0).toUpperCase() ?? '?'

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-6" style={{ background: 'linear-gradient(135deg, #1C1A17 0%, #2D2A24 100%)' }}>
        <div className="relative w-20 h-12 mb-4">
          <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: '#F5EDD8' }}>Meu Perfil</h1>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* Profile card */}
        <div className="rounded-2xl p-6 flex flex-col items-center"
          style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-semibold mb-3 gold-gradient">
            {initial}
          </div>
          <h2 className="text-base font-semibold" style={{ color: '#1C1A17' }}>{profile?.name ?? '...'}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#B0A898' }}>{email}</p>
          <span className="mt-2.5 text-xs font-medium px-3 py-1 rounded-full tracking-wide"
            style={{ background: '#F5EDD8', color: '#9E7E3A', border: '1px solid #E8DCC8' }}>
            {roleLabel}
          </span>
        </div>

        {/* Menu */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          {[
            { icon: BookOpen, label: 'Manual POP', href: '/pop' },
            { icon: GraduationCap, label: 'Cursos', href: '/cursos' },
          ].map(({ icon: Icon, label, href }) => (
            <a key={label} href={href}
              className="flex items-center gap-3 px-4 py-4 border-b last:border-0 active:opacity-70"
              style={{ borderColor: '#F5EDD8' }}>
              <Icon size={17} color="#C4A35A" strokeWidth={1.5} />
              <span className="text-sm flex-1" style={{ color: '#1C1A17' }}>{label}</span>
              <span style={{ color: '#C4A35A', fontSize: 12 }}>→</span>
            </a>
          ))}
        </div>

        <button onClick={logout}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2"
          style={{ background: '#fff', border: '1px solid #E8DCC8', color: '#8A7A6E' }}>
          <LogOut size={16} />
          <span className="text-sm font-medium">Sair da conta</span>
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
