'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Course } from '@/lib/types'
import { ChevronRight, PlayCircle, Lock } from 'lucide-react'

export default function CursosPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const [{ data: c }, { data: e }] = await Promise.all([
        supabase.from('courses').select('*').eq('is_published', true).order('sort_order'),
        supabase.from('enrollments').select('course_id').eq('user_id', data.user.id),
      ])
      if (c) setCourses(c)
      if (e) setEnrollments(e.map(x => x.course_id))
      setLoading(false)
    })
  }, [router])

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <h1 className="text-base font-semibold text-gray-900">Cursos</h1>
        <p className="text-xs text-gray-500">Treinamentos da clínica</p>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : courses.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <PlayCircle size={40} color="#D4537E" className="mx-auto mb-3 opacity-40" />
            <p className="text-sm text-gray-500">Nenhum curso publicado ainda.</p>
            <p className="text-xs text-gray-400 mt-1">Os cursos aparecerão aqui quando forem disponibilizados.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map(course => {
              const enrolled = enrollments.includes(course.id)
              const pct = progress[course.id] ?? 0
              return (
                <Link key={course.id} href={`/cursos/${course.id}`}
                  className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100 shadow-sm active:scale-98 transition-transform">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: '#E1F5EE' }}>
                    <PlayCircle size={24} color="#1D9E75" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">{course.title}</div>
                    {course.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{course.description}</p>}
                    {enrolled ? (
                      <div className="mt-2">
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-500">Progresso</span>
                          <span className="text-xs font-medium" style={{ color: '#1D9E75' }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#1D9E75' }} />
                        </div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs mt-1.5" style={{ color: '#D4537E' }}>
                        <Lock size={10} /> Clique para acessar
                      </span>
                    )}
                  </div>
                  <ChevronRight size={16} color="#D1D5DB" className="shrink-0 self-center" />
                </Link>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
