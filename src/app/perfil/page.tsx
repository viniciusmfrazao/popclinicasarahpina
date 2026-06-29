'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { LogOut, BookOpen, GraduationCap, CheckSquare } from 'lucide-react'
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

  const roleLabel = { admin: 'Administradora', team: 'Equipe', student: 'Aluna' }[profile?.role ?? 'team']

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-8">
        <div className="relative w-24 h-14 mb-4">
          <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
        </div>
        <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Meu Perfil</h1>
      </div>

      <div className="px-4 py-5 space-y-3">
        {/* Profile card */}
        <div className="rounded-2xl bg-white p-6 flex flex-col items-center"
          style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 12px rgba(107,30,46,0.07)' }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3 btn-bordo">
            {profile?.name?.charAt(0).toUpperCase() ?? '?'}
          </div>
          <h2 className="text-base font-semibold" style={{ color: '#1C1A17' }}>{profile?.name ?? '...'}</h2>
          <p className="text-sm mt-0.5" style={{ color: '#B0A898' }}>{email}</p>
          <div className="mt-3 h-px w-12 gold-bar" />
          <span className="mt-3 text-[11px] font-semibold tracking-[0.15em] uppercase px-4 py-1.5 rounded-full"
            style={{ background: '#F5E8EC', color: '#6B1E2E', border: '1px solid #EDD8DE' }}>
            {roleLabel}
          </span>
        </div>

        {/* Menu */}
        <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EDD8DE' }}>
          {[
            { icon: BookOpen,      label: 'Manual POP',     href: '/pop'       },
            { icon: GraduationCap, label: 'Cursos',          href: '/cursos'    },
            { icon: CheckSquare,   label: 'Checklists',      href: '/checklist' },
          ].map(({ icon: Icon, label, href }) => (
            <a key={label} href={href}
              className="flex items-center gap-3.5 px-4 py-4 active:opacity-70"
              style={{ borderBottom: '1px solid #F9F5F6' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#F5E8EC' }}>
                <Icon size={15} color="#6B1E2E" strokeWidth={1.5} />
              </div>
              <span className="text-sm flex-1" style={{ color: '#1C1A17' }}>{label}</span>
              <span className="text-xs font-semibold" style={{ color: '#C4A35A' }}>→</span>
            </a>
          ))}
        </div>

        <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
          className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 bg-white"
          style={{ border: '1px solid #EDD8DE', color: '#8B2A3D' }}>
          <LogOut size={16} />
          <span className="text-sm font-medium">Sair da conta</span>
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
