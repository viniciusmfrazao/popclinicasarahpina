'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, GraduationCap, CheckSquare, User } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Início',    icon: Home },
  { href: '/pop',       label: 'POP',       icon: BookOpen },
  { href: '/cursos',    label: 'Cursos',    icon: GraduationCap },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/perfil',    label: 'Perfil',    icon: User },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50"
      style={{ background: '#fff', borderTop: '1px solid #EDD8DE' }}>
      <div className="h-px gold-bar opacity-60" />
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link key={href} href={href}
              className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-all">
              <Icon size={20} color={active ? '#6B1E2E' : '#C4A8B0'} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] tracking-wide"
                style={{ color: active ? '#6B1E2E' : '#C4A8B0', fontWeight: active ? 700 : 400 }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
