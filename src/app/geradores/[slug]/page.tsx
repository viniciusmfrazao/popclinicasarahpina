'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { ArrowLeft, Wand2, Copy, Check, History, X } from 'lucide-react'
import { getGenerator } from '@/lib/generators/registry'

const inputStyle = { background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }

interface HistoryItem {
  id: string
  title: string
  output: string
  created_at: string
}

export default function GeneratorPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const generator = getGenerator(slug)

  const [userId, setUserId] = useState<string | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [viewing, setViewing] = useState<HistoryItem | null>(null)

  useEffect(() => {
    if (!generator) { router.push('/geradores'); return }
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
      if (profile?.role === 'student') { router.push('/dashboard'); return }
      setUserId(data.user.id)
      loadHistory()
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  async function loadHistory() {
    const { data } = await supabase.from('generated_documents')
      .select('id,title,output,created_at')
      .eq('module', slug)
      .order('created_at', { ascending: false })
      .limit(20)
    if (data) setHistory(data)
  }

  if (!generator) return null

  function update(key: string, value: string) {
    setValues(v => ({ ...v, [key]: value }))
  }

  async function handleGenerate() {
    setError('')
    setOutput('')
    setLoading(true)
    try {
      const res = await fetch(`/api/geradores/${slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Não foi possível gerar o documento.')
        setLoading(false)
        return
      }
      setOutput(data.output)
      const tipoLabel = generator!.fields.find(f => f.key === 'tipo_reuniao')
        ?.options?.find(o => o.value === values.tipo_reuniao)?.label
      const title = tipoLabel && tipoLabel !== 'Não sei — me ajude a identificar'
        ? `${generator!.title} — ${tipoLabel}`
        : generator!.title
      const { data: saved } = await supabase.from('generated_documents').insert({
        module: slug,
        title,
        input: values,
        output: data.output,
        created_by: userId,
      }).select('id,title,output,created_at').single()
      if (saved) setHistory(h => [saved, ...h])
    } catch {
      setError('Erro de conexão. Tente novamente.')
    }
    setLoading(false)
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-4 pt-12 pb-6">
        <Link href="/geradores" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Geradores</span>
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(196,163,90,0.15)' }}>
              {generator.icon}
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: '#fff' }}>{generator.title}</h1>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{generator.description}</p>
            </div>
          </div>
          <button onClick={() => setShowHistory(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.1)' }}>
            <History size={16} color="#E8CFA0" />
          </button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Formulário */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <div className="space-y-2.5">
            {generator.fields.map(field => (
              <div key={field.key}>
                <label className="text-[11px] font-medium block mb-1" style={{ color: '#6B6458' }}>
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select value={values[field.key] ?? ''} onChange={e => update(field.key, e.target.value)}
                    className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle}>
                    <option value="">Selecione...</option>
                    {field.options?.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea value={values[field.key] ?? ''} onChange={e => update(field.key, e.target.value)}
                    placeholder={field.placeholder} rows={4}
                    className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none resize-none" style={inputStyle} />
                ) : (
                  <input value={values[field.key] ?? ''} onChange={e => update(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none" style={inputStyle} />
                )}
              </div>
            ))}

            {error && <p className="text-xs" style={{ color: '#8B2A3D' }}>{error}</p>}

            <button onClick={handleGenerate} disabled={loading}
              className="w-full mt-1 py-3 rounded-xl flex items-center justify-center gap-2 btn-bordo disabled:opacity-60">
              <Wand2 size={16} color="#fff" />
              <span className="text-sm font-semibold" style={{ color: '#fff' }}>
                {loading ? 'Gerando...' : 'Gerar'}
              </span>
            </button>
          </div>
        </div>

        {/* Resultado */}
        {loading && (
          <div className="rounded-2xl bg-white p-6 flex flex-col items-center gap-2" style={{ border: '1px solid #EDD8DE' }}>
            <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: '#6B1E2E', borderTopColor: 'transparent' }} />
            <p className="text-xs" style={{ color: '#C4A8B0' }}>Montando o documento...</p>
          </div>
        )}

        {output && !loading && (
          <div className="rounded-2xl bg-white overflow-hidden" style={{ border: '1px solid #EDD8DE' }}>
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #F5E8EC' }}>
              <span className="text-[11px] font-semibold tracking-[0.15em] uppercase" style={{ color: '#6B1E2E' }}>
                Resultado
              </span>
              <button onClick={() => copyToClipboard(output)}
                className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg"
                style={{ background: '#F5E8EC', color: '#6B1E2E' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
            <div className="px-4 py-4">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: '#1C1A17' }}>
                {output}
              </pre>
            </div>
          </div>
        )}
      </div>

      {/* Painel de histórico */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: '#F9F5F6' }}>
          <div className="header-bg px-4 pt-12 pb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold" style={{ color: '#fff' }}>Histórico</h2>
            <button onClick={() => setShowHistory(false)}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.1)' }}>
              <X size={16} color="#fff" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
            {history.length === 0 ? (
              <p className="text-sm text-center mt-8" style={{ color: '#C4A8B0', fontStyle: 'italic' }}>
                Nenhum documento gerado ainda.
              </p>
            ) : history.map(h => (
              <button key={h.id} onClick={() => setViewing(h)}
                className="w-full text-left rounded-2xl bg-white p-4"
                style={{ border: '1px solid #EDD8DE' }}>
                <div className="text-sm font-semibold" style={{ color: '#1C1A17' }}>{h.title}</div>
                <div className="text-[11px] mt-1" style={{ color: '#B0A898' }}>
                  {new Date(h.created_at).toLocaleString('pt-BR')}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Visualizar item do histórico */}
      {viewing && (
        <div className="fixed inset-0 z-[70] flex flex-col" style={{ background: '#F9F5F6' }}>
          <div className="header-bg px-4 pt-12 pb-4 flex items-center justify-between">
            <button onClick={() => setViewing(null)} className="flex items-center gap-2">
              <ArrowLeft size={16} color="#E8CFA0" />
              <span className="text-xs" style={{ color: '#E8CFA0' }}>Histórico</span>
            </button>
            <button onClick={() => copyToClipboard(viewing.output)}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.12)', color: '#fff' }}>
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed" style={{ color: '#1C1A17' }}>
                {viewing.output}
              </pre>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
