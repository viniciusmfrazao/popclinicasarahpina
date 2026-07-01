export type Role = 'admin' | 'team' | 'student'
export type SectionStatus = 'levantado' | 'parcial' | 'pendente'

export interface Profile {
  id: string
  name: string
  role: Role
  avatar_url?: string
  created_at: string
}

export interface Section {
  id: string
  title: string
  summary: string
  icon: string
  color: string
  status: SectionStatus
  sort_order: number
}

export interface SectionItem {
  id: string
  section_id: string
  title: string
  content: string
  sort_order: number
}

export interface Note {
  id: string
  user_id: string
  section_id: string
  content: string
  created_at: string
}

export interface Course {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  is_published: boolean
  sort_order: number
}

export interface Lesson {
  id: string
  course_id: string
  title: string
  description?: string
  youtube_url?: string
  duration_seconds?: number
  sort_order: number
}

export interface LessonProgress {
  user_id: string
  lesson_id: string
  completed: boolean
  completed_at?: string
}

export interface ChecklistItem {
  id: string
  section_id: string
  title: string
  description?: string
  sort_order: number
}

export interface ChecklistProgress {
  user_id: string
  checklist_item_id: string
  completed: boolean
  completed_at?: string
}

export interface Certificate {
  id: string
  student_name: string
  course_title: string
  instructor_name: string
  instructor_title: string
  workload_hours: number
  issue_date: string
  certificate_type: 'padrao' | 'trofeu'
  created_by?: string
  created_at: string
}
