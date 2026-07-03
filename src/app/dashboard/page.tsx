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
  const [profile, setProfile] = useState<{ name: string; role: string; access_lista_compras?: boolean } | null>(null)
  const [stats, setStats] = useState({ sections: 0, levantado: 0 })
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      supabase.from('profiles')
        .select('name,role,subscription_status,subscription_expires_at,access_lista_compras')
        .eq('id', data.user.id).single()
        .then(({ data: p }) => {
          if (!p) return
          if (p.role === 'cliente') {
            const expired = p.subscription_status !== 'active'
              || !p.subscription_expires_at
              || new Date(p.subscription_expires_at) < new Date()
            if (expired) { router.push('/assinatura-expirada'); return }
          }
          setProfile(p)
        })
      supabase.from('sections').select('status')
        .then(({ data: s }) => s && setStats({
          sections: s.length,
          levantado: s.filter(x => x.status === 'levantado').length
        }))
    })
  }, [router])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const pct = stats.sections > 0 ? Math.round((stats.levantado / stats.sections) * 100) : 0
  const firstName = profile?.name?.split(' ')[0] ?? '...'

  const cards = [
    { icon: BookOpen,      label: 'Seções do POP', value: stats.sections, sub: `${stats.levantado} concluídas`, href: '/pop'       },
    { icon: GraduationCap, label: 'Cursos',         value: 3,              sub: 'disponíveis',                  href: '/cursos'    },
    { icon: CheckSquare,   label: 'Checklists',     value: '—',            sub: 'por seção',                    href: '/checklist' },
    { icon: TrendingUp,    label: 'Progresso',      value: `${pct}%`,      sub: 'do POP levantado',             href: '/pop'       },
  ]

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>

      {/* Header */}
      <div className="header-bg px-5 pt-12 pb-8 relative overflow-hidden">
        {/* Subtle gold glow */}
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #C4A35A, transparent)', transform: 'translate(30%,-30%)' }} />

        {/* Logo centralizada */}
        <div className="flex justify-center mb-6">
          <div className="relative w-36 h-20">
            <Image src="/logo.png" alt="Clínica Sarah Pina" fill style={{ objectFit: 'contain' }} />
          </div>
        </div>

        <p className="text-sm font-light mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{greeting},</p>
        <h1 className="text-2xl font-semibold" style={{ color: '#fff' }}>{firstName}</h1>
        <span className="inline-block mt-1.5 text-[10px] tracking-[0.18em] uppercase font-medium px-2.5 py-0.5 rounded-full"
          style={{ color: '#E8CFA0', border: '1px solid rgba(196,163,90,0.35)', background: 'rgba(196,163,90,0.1)' }}>
          {profile?.role === 'admin' ? 'Admin' : profile?.role === 'student' ? 'Aluna' : 'Equipe'}
        </span>

        {/* Gold divider */}
        <div className="mt-5 h-px gold-bar opacity-70" />
      </div>

      <div className="px-4 -mt-3">
        {/* Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {cards.map(({ icon: Icon, label, value, sub, href }, i) => (
            <Link key={label} href={href}
              className="rounded-2xl p-4 bg-white active:scale-95 transition-transform"
              style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.06)' }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: i % 2 === 0 ? '#F5E8EC' : '#F5EDD8' }}>
                <Icon size={17} color={i % 2 === 0 ? '#6B1E2E' : '#9E7E3A'} strokeWidth={1.5} />
              </div>
              <div className="text-2xl font-bold" style={{ color: '#1C1A17' }}>{value}</div>
              <div className="text-xs font-semibold mt-0.5 leading-tight" style={{ color: '#4A1020' }}>{label}</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#B0A898' }}>{sub}</div>
            </Link>
          ))}
        </div>

        {/* Progress bar */}
        <div className="rounded-2xl bg-white p-4 mb-4"
          style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.04)' }}>
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#6B1E2E' }}>
              Progresso Geral
            </span>
            <span className="text-sm font-bold" style={{ color: '#C4A35A' }}>{pct}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F5E8EC' }}>
            <div className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #6B1E2E, #C4A35A)' }} />
          </div>
        </div>

        {/* Quick access */}
        <div className="rounded-2xl bg-white overflow-hidden"
          style={{ border: '1px solid #EDD8DE', boxShadow: '0 2px 8px rgba(107,30,46,0.04)' }}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #F5E8EC' }}>
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
              Acesso Rápido
            </span>
          </div>
          {[
            { label: 'Manual POP completo',  href: '/pop'       },
            { label: 'Cursos da clínica',    href: '/cursos'    },
            { label: 'Meus checklists',      href: '/checklist' },
            { label: 'Meu perfil',           href: '/perfil'    },
            ...(profile?.role === 'admin' || profile?.access_lista_compras
              ? [{ label: '🛒 Lista de Compras', href: '/lista-compras' }]
              : []),
            { label: '🏆 Gerar Certificados',   href: '/certificados' },
            { label: '✨ Geradores (IA)',       href: '/geradores' },
            { label: '⚙️ Painel Admin',         href: '/admin'     },
          ].map(({ label, href }) => (
            <Link key={href} href={href}
              className="flex items-center justify-between px-4 py-3.5 active:opacity-70"
              style={{ borderBottom: '1px solid #F9F5F6' }}>
              <span className="text-sm" style={{ color: '#1C1A17' }}>{label}</span>
              <span className="text-xs font-semibold" style={{ color: '#C4A35A' }}>→</span>
            </Link>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
