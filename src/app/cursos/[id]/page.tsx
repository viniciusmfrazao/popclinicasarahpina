'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { Course, Lesson } from '@/lib/types'
import { ArrowLeft, CheckCircle, Circle, PlayCircle } from 'lucide-react'
import Link from 'next/link'

export default function CoursePage() {
  const { id } = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [completed, setCompleted] = useState<string[]>([])
  const [userId, setUserId] = useState<string | null>(null)
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null)
  const [enrolled, setEnrolled] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUserId(data.user.id)
      const [{ data: c }, { data: l }, { data: p }, { data: e }] = await Promise.all([
        supabase.from('courses').select('*').eq('id', id).single(),
        supabase.from('lessons').select('*').eq('course_id', id).order('sort_order'),
        supabase.from('lesson_progress').select('lesson_id').eq('user_id', data.user.id).eq('completed', true),
        supabase.from('enrollments').select('id').eq('user_id', data.user.id).eq('course_id', id).single(),
      ])
      if (c) setCourse(c)
      if (l) { setLessons(l); if (l.length > 0) setActiveLesson(l[0]) }
      if (p) setCompleted(p.map((x: { lesson_id: string }) => x.lesson_id))
      setEnrolled(!!e)
    })
  }, [id, router])

  async function enroll() {
    if (!userId) return
    await supabase.from('enrollments').insert({ user_id: userId, course_id: id })
    setEnrolled(true)
  }

  async function markComplete(lessonId: string) {
    if (!userId) return
    await supabase.from('lesson_progress').upsert({ user_id: userId, lesson_id: lessonId, completed: true, completed_at: new Date().toISOString() })
    setCompleted(p => [...p, lessonId])
  }

  const pct = lessons.length > 0 ? Math.round((completed.length / lessons.length) * 100) : 0

  if (!course) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F7F6F3' }}>
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link href="/cursos"><ArrowLeft size={20} color="#1D9E75" /></Link>
        <h1 className="text-sm font-semibold text-gray-900 flex-1 truncate">{course.title}</h1>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Video player */}
        {activeLesson?.youtube_url && (
          <div className="rounded-2xl overflow-hidden bg-black aspect-video">
            <iframe src={activeLesson.youtube_url} className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        )}

        {/* Active lesson info */}
        {activeLesson && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <h2 className="text-sm font-semibold text-gray-900">{activeLesson.title}</h2>
            {activeLesson.description && <p className="text-xs text-gray-500 mt-1">{activeLesson.description}</p>}
            {enrolled && !completed.includes(activeLesson.id) && (
              <button onClick={() => markComplete(activeLesson.id)}
                className="mt-3 w-full py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: '#1D9E75' }}>
                ✓ Marcar como concluída
              </button>
            )}
          </div>
        )}

        {/* Progress */}
        {enrolled && (
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-gray-700">Progresso do curso</span>
              <span className="text-xs font-semibold" style={{ color: '#1D9E75' }}>{pct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: '#1D9E75' }} />
            </div>
          </div>
        )}

        {/* Lessons list */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
            Aulas · {lessons.length} no total
          </h2>
          <div className="space-y-2">
            {lessons.map((lesson, i) => {
              const done = completed.includes(lesson.id)
              const active = activeLesson?.id === lesson.id
              return (
                <button key={lesson.id} onClick={() => setActiveLesson(lesson)}
                  className="w-full bg-white rounded-2xl p-3.5 flex items-center gap-3 border text-left transition-all"
                  style={{ borderColor: active ? '#1D9E75' : '#F3F4F6', borderWidth: active ? 1.5 : 1 }}>
                  {done ? <CheckCircle size={20} color="#1D9E75" /> :
                   active ? <PlayCircle size={20} color="#1D9E75" /> :
                   <Circle size={20} color="#D1D5DB" />}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-400">Aula {i + 1}</span>
                    <div className="text-sm font-medium text-gray-900 truncate">{lesson.title}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {!enrolled && (
          <button onClick={enroll}
            className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold"
            style={{ background: '#1D9E75' }}>
            Inscrever-se no curso
          </button>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
