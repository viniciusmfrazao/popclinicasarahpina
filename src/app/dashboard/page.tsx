'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { BookOpen, GraduationCap, CheckSquare, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const [profile, setProfile] = useState<{ name: string; role: string } | null>(null)
  const [stats, setStats] = useState({ sections: 0, levantado: 0, courses: 0 })
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('profiles').select('name,role').eq('id', data.user.id).single()
        .then(({ data: p }) => p && setProfile(p))
      supabase.from('sections').select('status').then(({ data: s }) => {
        if (s) setStats({ sections: s.length, levantado: s.filter(x => x.status === 'levantado').length, courses: 3 })
      })
    })
  }, [router])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'

  const cards = [
    { icon: BookOpen, label: 'Seções do POP', value: stats.sections, sub: `${stats.levantado} levantadas`, href: '/pop', color: '#D4537E', bg: '#FBEAF0' },
    { icon: GraduationCap, label: 'Cursos', value: stats.courses, sub: 'disponíveis', href: '/cursos', color: '#1D9E75', bg: '#E1F5EE' },
    { icon: CheckSquare, label: 'Checklists', value: '—', sub: 'por seção', href: '/checklist', color: '#BA7517', bg: '#FAEEDA' },
    { icon: TrendingUp, label: 'Progresso', value: `${stats.sections > 0 ? Math.round((stats.levantado / stats.sections) * 100) : 0}%`, sub: 'do POP levantado', href: '/pop', color: '#534AB7', bg: '#EEEDFE' },
  ]

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      {/* Header */}
      <div className="px-4 pt-12 pb-6" style={{ background: 'linear-gradient(160deg, #D4537E 0%, #A83060 100%)' }}>
        <p className="text-pink-100 text-sm">{greeting},</p>
        <h1 className="text-white text-xl font-semibold mt-0.5">{profile?.name?.split(' ')[0] ?? '...'} 👋</h1>
        <p className="text-pink-200 text-xs mt-1">Clínica Sarah Pina · {profile?.role === 'admin' ? 'Administradora' : profile?.role === 'student' ? 'Aluna' : 'Equipe'}</p>
      </div>

      <div className="px-4 -mt-4">
        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {cards.map(({ icon: Icon, label, value, sub, href, color, bg }) => (
            <Link key={label} href={href}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 active:scale-95 transition-transform">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                <Icon size={18} color={color} />
              </div>
              <div className="text-xl font-bold text-gray-900">{value}</div>
              <div className="text-xs font-medium text-gray-700 mt-0.5">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{sub}</div>
            </Link>
          ))}
        </div>

        {/* Quick access */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Acesso rápido</h2>
          <div className="space-y-2">
            {[
              { label: 'Ver Manual POP completo', href: '/pop', color: '#D4537E' },
              { label: 'Cursos disponíveis', href: '/cursos', color: '#1D9E75' },
              { label: 'Meus checklists', href: '/checklist', color: '#BA7517' },
              { label: 'Meu perfil', href: '/perfil', color: '#534AB7' },
            ].map(({ label, href, color }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 active:opacity-70">
                <span className="text-sm text-gray-700">{label}</span>
                <span className="text-xs font-medium" style={{ color }}>Ver →</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
