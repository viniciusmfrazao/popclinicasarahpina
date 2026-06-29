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
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 pb-safe">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = path.startsWith(href)
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors">
            <Icon size={22} color={active ? '#D4537E' : '#9CA3AF'} strokeWidth={active ? 2.2 : 1.8} />
            <span className="text-[10px]" style={{ color: active ? '#D4537E' : '#9CA3AF', fontWeight: active ? 600 : 400 }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
