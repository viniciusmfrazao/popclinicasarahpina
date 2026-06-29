'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, GraduationCap, CheckSquare, User } from 'lucide-react'

const tabs = [
  { href: '/dashboard', label: 'Início', icon: Home },
  { href: '/pop', label: 'POP', icon: BookOpen },
  { href: '/cursos', label: 'Cursos', icon: GraduationCap },
  { href: '/checklist', label: 'Checklist', icon: CheckSquare },
  { href: '/perfil', label: 'Perfil', icon: User },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 left-0 right-0 flex z-50"
      style={{ background: '#FAFAF7', borderTop: '1px solid #E8DCC8' }}>
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-all">
            <Icon size={21} color={active ? '#C4A35A' : '#B0A898'} strokeWidth={active ? 2 : 1.5} />
            <span className="text-[10px] tracking-wide"
              style={{ color: active ? '#C4A35A' : '#B0A898', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
