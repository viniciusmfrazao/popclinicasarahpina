'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { Certificate } from '@/lib/types'
import { generateCertificatePDF, certificateFileName } from '@/lib/certificate'
import { ArrowLeft, Award, Download, Trophy, FileText } from 'lucide-react'

const inputStyle = {
  background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17',
}

export default function CertificadosPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<Certificate[]>([])
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    student_name: '',
    course_title: '',
    instructor_name: 'Dra. Amanda Cunha',
    instructor_title: 'Biomédica Esteta',
    workload_hours: '',
    issue_date: new Date().toISOString().slice(0, 10),
    certificate_type: 'padrao' as 'padrao' | 'trofeu',
  })

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'student') { router.push('/dashboard'); return }
      setUserId(data.user.id)
      loadHistory()
    })
  }, [router])

  async function loadHistory() {
    setLoadingHistory(true)
    const { data } = await supabase.from('certificates').select('*').order('created_at', { ascending: false })
    if (data) setHistory(data)
    setLoadingHistory(false)
  }

  function update<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  function downloadCert(cert: Certificate) {
    const doc = generateCertificatePDF(cert)
    doc.save(certificateFileName(cert))
  }

  async function handleGenerate() {
    setError('')
    if (!form.student_name.trim() || !form.course_title.trim() || !form.workload_hours || !form.issue_date) {
      setError('Preencha nome da aluna, curso, carga horária e data.')
      return
    }
    setGenerating(true)
    const payload = {
      student_name: form.student_name.trim(),
      course_title: form.course_title.trim(),
      instructor_name: form.instructor_name.trim() || 'Dra. Amanda Cunha',
      instructor_title: form.instructor_title.trim() || 'Biomédica Esteta',
      workload_hours: Number(form.workload_hours.replace(',', '.')),
      issue_date: form.issue_date,
      certificate_type: form.certificate_type,
      created_by: userId,
    }
    const { data, error: insertError } = await supabase.from('certificates').insert(payload).select().single()
    setGenerating(false)
    if (insertError || !data) {
      setError('Não foi possível salvar o certificado. Tente novamente.')
      return
    }
    setHistory(h => [data, ...h])
    downloadCert(data)
    setForm(f => ({ ...f, student_name: '' }))
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-4 pt-12 pb-6">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Início</span>
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(196,163,90,0.15)' }}>
            <Award size={20} color="#E8CFA0" />
          </div>
          <div>
            <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>Gerador de Certificados</h1>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Pronto para impressão · A4</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Formulário */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase mb-3" style={{ color: '#6B1E2E' }}>
            Novo Certificado
          </p>

          <div className="space-y-2.5">
            <div>
              <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Nome da aluna / aluno</label>
              <input value={form.student_name} onChange={e => update('student_name', e.target.value)}
                placeholder="Ex: Altair Ferreira Junior"
                className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
            </div>

            <div>
              <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Curso</label>
              <input value={form.course_title} onChange={e => update('course_title', e.target.value)}
                placeholder="Ex: aplicação de Bioestimulador de colágeno"
                className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Carga horária (h)</label>
                <input value={form.workload_hours} onChange={e => update('workload_hours', e.target.value)}
                  placeholder="12" inputMode="decimal"
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Data de conclusão</label>
                <input type="date" value={form.issue_date} onChange={e => update('issue_date', e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Instrutora</label>
                <input value={form.instructor_name} onChange={e => update('instructor_name', e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>Título / cargo</label>
                <input value={form.instructor_title} onChange={e => update('instructor_title', e.target.value)}
                  className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium block mb-2" style={{ color: '#6B6458' }}>Tipo de certificado</label>
              <div className="grid grid-cols-2 gap-2.5">
                <button type="button" onClick={() => update('certificate_type', 'padrao')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.certificate_type === 'padrao' ? '#6B1E2E' : '#F9F5F6',
                    color: form.certificate_type === 'padrao' ? '#fff' : '#6B6458',
                    border: '1px solid #EDD8DE',
                  }}>
                  <FileText size={14} /> Padrão
                </button>
                <button type="button" onClick={() => update('certificate_type', 'trofeu')}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: form.certificate_type === 'trofeu' ? '#9E7E3A' : '#F9F5F6',
                    color: form.certificate_type === 'trofeu' ? '#fff' : '#6B6458',
                    border: '1px solid #EDD8DE',
                  }}>
                  <Trophy size={14} /> Troféu
                </button>
              </div>
            </div>

            {error && <p className="text-xs" style={{ color: '#8B2A3D' }}>{error}</p>}

            <button onClick={handleGenerate} disabled={generating}
              className="w-full mt-1 py-3 rounded-xl flex items-center justify-center gap-2 btn-bordo disabled:opacity-60">
              <Download size={16} color="#fff" />
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>
                {generating ? 'Gerando...' : 'Gerar e baixar PDF'}
              </span>
            </button>
          </div>
        </div>

        {/* Histórico */}
        <div>
          <p className="text-[11px] font-semibold tracking-[0.15em] uppercase px-1 mb-2" style={{ color: '#6B1E2E' }}>
            Histórico · {history.length} emitidos
          </p>
          {loadingHistory ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: '#EDD8DE' }} />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 text-center" style={{ border: '1px solid #EDD8DE' }}>
              <p className="text-sm" style={{ color: '#C4A8B0', fontStyle: 'italic' }}>Nenhum certificado emitido ainda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {history.map(cert => (
                <div key={cert.id} className="rounded-2xl bg-white p-4 flex items-center gap-3"
                  style={{ border: '1px solid #EDD8DE' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: cert.certificate_type === 'trofeu' ? '#F5EDD8' : '#F5E8EC' }}>
                    {cert.certificate_type === 'trofeu'
                      ? <Trophy size={16} color="#9E7E3A" />
                      : <FileText size={16} color="#6B1E2E" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#1C1A17' }}>{cert.student_name}</div>
                    <div className="text-xs truncate" style={{ color: '#6B6458' }}>{cert.course_title}</div>
                    <div className="text-[11px] mt-0.5" style={{ color: '#B0A898' }}>
                      {new Date(cert.issue_date + 'T00:00:00').toLocaleDateString('pt-BR')} · {cert.workload_hours}h
                    </div>
                  </div>
                  <button onClick={() => downloadCert(cert)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                    style={{ background: '#F5E8EC' }}>
                    <Download size={15} color="#6B1E2E" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
