'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { BookOpen, GraduationCap, CheckSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function Dashboard() {
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null)
  const [stats, setStats] = useState({ sections: 0, levantado: 0 })
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('profiles').select('name,role').eq('id', data.user.id).single()
        .then(({ data: p }) => p && setProfile(p))
      supabase.from('sections').select('status')
        .then(({ data: s }) => {
          if (s) setStats({ sections: s.length, levantado: s.filter(x => x.status === 'levantado').length })
        })
    })
  }, [router])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const pct = stats.sections > 0 ? Math.round((stats.levantado / stats.sections) * 100) : 0

  const cards = [
    { icon: BookOpen, label: 'Seções do POP', value: stats.sections, sub: `${stats.levantado} levantadas`, href: '/pop', color: '#C4A35A', bg: '#F5EDD8' },
    { icon: GraduationCap, label: 'Cursos', value: 3, sub: 'disponíveis', href: '/cursos', color: '#7A8C6E', bg: '#EEF2EB' },
    { icon: CheckSquare, label: 'Checklists', value: '—', sub: 'por seção', href: '/checklist', color: '#8A7A6E', bg: '#F0ECE8' },
    { icon: TrendingUp, label: 'Progresso', value: `${pct}%`, sub: 'do POP levantado', href: '/pop', color: '#9E7E3A', bg: '#F5EDD8' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F5F0' }}>
      {/* Header */}
      <div className="px-5 pt-10 pb-8 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1C1A17 0%, #2D2A24 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #C4A35A 0%, transparent 50%)' }} />
        <div className="relative flex items-center justify-between mb-4">
          <div className="relative w-24 h-14">
            <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain', objectPosition: 'left' }} />
          </div>
          <div className="text-xs tracking-[0.15em] uppercase px-3 py-1 rounded-full"
            style={{ color: '#C4A35A', border: '1px solid #C4A35A33', background: '#C4A35A11' }}>
            {profile?.role === 'admin' ? 'Admin' : profile?.role === 'student' ? 'Aluna' : 'Equipe'}
          </div>
        </div>
        <p className="text-sm mb-0.5" style={{ color: '#B0A898' }}>{greeting},</p>
        <h1 className="text-xl font-semibold" style={{ color: '#F5EDD8' }}>
          {profile?.name?.split(' ')[0] ?? '...'} ✨
        </h1>
        {/* Gold divider */}
        <div className="mt-4 h-px" style={{ background: 'linear-gradient(90deg, #C4A35A, transparent)' }} />
      </div>

      <div className="px-4 py-5">
        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {cards.map(({ icon: Icon, label, value, sub, href, color, bg }) => (
            <Link key={label} href={href}
              className="rounded-2xl p-4 active:scale-95 transition-transform"
              style={{ background: '#fff', border: '1px solid #E8DCC8', boxShadow: '0 1px 4px rgba(196,163,90,0.08)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={18} color={color} strokeWidth={1.5} />
              </div>
              <div className="text-xl font-bold" style={{ color: '#1C1A17' }}>{value}</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: '#1C1A17' }}>{label}</div>
              <div className="text-xs mt-0.5" style={{ color: '#B0A898' }}>{sub}</div>
            </Link>
          ))}
        </div>

        {/* Progress */}
        <div className="rounded-2xl p-4 mb-4"
          style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium tracking-wide uppercase" style={{ color: '#9E7E3A' }}>Progresso do POP</span>
            <span className="text-sm font-semibold" style={{ color: '#C4A35A' }}>{pct}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F5EDD8' }}>
            <div className="h-full rounded-full transition-all gold-gradient" style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* Quick access */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: '1px solid #E8DCC8' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#F0EBE0' }}>
            <span className="text-xs font-medium tracking-[0.1em] uppercase" style={{ color: '#9E7E3A' }}>Acesso Rápido</span>
          </div>
          {[
            { label: 'Manual POP completo', href: '/pop' },
            { label: 'Cursos da clínica', href: '/cursos' },
            { label: 'Meus checklists', href: '/checklist' },
            { label: 'Meu perfil', href: '/perfil' },
          ].map(({ label, href }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between px-4 py-3.5 border-b last:border-0 active:opacity-70"
              style={{ borderColor: '#F0EBE0' }}>
              <span className="text-sm" style={{ color: '#1C1A17' }}>{label}</span>
              <span className="text-xs" style={{ color: '#C4A35A' }}>→</span>
            </Link>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
