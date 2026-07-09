'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import Link from 'next/link'
import { useAccount } from '@/lib/useAccount'
import { ArrowLeft, Upload, Loader2, Check, ImageIcon } from 'lucide-react'

export default function BrandingPage() {
  const router = useRouter()
  const { account, isAdmin, loading } = useAccount()

  const [name, setName] = useState('')
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [primary, setPrimary] = useState('#6B1E2E')
  const [secondary, setSecondary] = useState('#C4A35A')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!loading && !isAdmin) { router.push('/dashboard'); return }
    if (account) {
      setName(account.name)
      setLogoUrl(account.logo_url ?? null)
      setPrimary(account.primary_color)
      setSecondary(account.secondary_color)
    }
  }, [account, loading, isAdmin, router])

  async function uploadLogo(file: File) {
    if (!account) return
    setError('')
    if (!file.type.startsWith('image/')) { setError('Envie um arquivo de imagem (PNG ou JPG).'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Imagem muito grande. Máximo 2MB.'); return }

    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${account.id}/logo-${Date.now()}.${ext}`
    const { error: upErr } = await supabase.storage.from('branding').upload(path, file, { upsert: true })
    if (upErr) {
      setError('Erro ao enviar imagem: ' + upErr.message)
      setUploading(false)
      return
    }
    const { data } = supabase.storage.from('branding').getPublicUrl(path)
    setLogoUrl(data.publicUrl)
    setUploading(false)
  }

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    const { error: rpcErr } = await supabase.rpc('update_account_branding', {
      p_name: name.trim(),
      p_logo_url: logoUrl,
      p_primary_color: primary,
      p_secondary_color: secondary,
    })
    setSaving(false)
    if (rpcErr) { setError('Erro ao salvar: ' + rpcErr.message); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading || !account) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#F9F5F6' }}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: '#6B1E2E', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F9F5F6' }}>
      <div className="header-bg px-5 pt-12 pb-6">
        <Link href="/admin" className="flex items-center gap-2 mb-4">
          <ArrowLeft size={16} color="#E8CFA0" />
          <span className="text-xs tracking-wide" style={{ color: '#E8CFA0' }}>Painel Admin</span>
        </Link>
        <p className="text-[11px] tracking-[0.2em] uppercase mb-1" style={{ color: '#E8CFA0' }}>Configurações</p>
        <h1 className="text-xl font-semibold" style={{ color: '#fff' }}>Identidade Visual</h1>
        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Usado nos PDFs do Manual POP e do Checklist
        </p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Preview ao vivo */}
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid #EDD8DE' }}>
          <div className="px-4 pt-4 pb-5 flex items-center gap-3"
            style={{ background: `linear-gradient(135deg, ${primary} 0%, ${primary} 60%, ${secondary}55 140%)` }}>
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-11 h-11 rounded-lg object-contain bg-white/10 p-1" />
            ) : (
              <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }}>
                <ImageIcon size={18} color="rgba(255,255,255,0.6)" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[10px] tracking-[0.2em] uppercase font-medium truncate" style={{ color: secondary }}>
                {name || 'Nome da conta'}
              </p>
              <p className="text-sm font-semibold" style={{ color: '#fff' }}>Manual de Procedimentos</p>
            </div>
          </div>
          <div className="bg-white px-4 py-2.5">
            <p className="text-[11px]" style={{ color: '#8A8178' }}>Pré-visualização · como aparece no cabeçalho dos PDFs</p>
          </div>
        </div>

        {/* Nome */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-1.5" style={{ color: '#6B1E2E' }}>
            Nome da conta / clínica
          </label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-xl focus:outline-none"
            style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#1C1A17' }} />
        </div>

        {/* Logo */}
        <div className="rounded-2xl bg-white p-4" style={{ border: '1px solid #EDD8DE' }}>
          <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase mb-2" style={{ color: '#6B1E2E' }}>
            Logo
          </label>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: '#F9F5F6', border: '1px solid #EDD8DE' }}>
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon size={20} color="#C4A8B0" />
              )}
            </div>
            <label className="flex-1">
              <input type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              <div className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
                style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#6B1E2E' }}>
                {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {uploading ? 'Enviando...' : 'Enviar imagem (PNG/JPG, até 2MB)'}
              </div>
            </label>
          </div>
        </div>

        {/* Cores */}
        <div className="rounded-2xl bg-white p-4 space-y-3" style={{ border: '1px solid #EDD8DE' }}>
          <label className="block text-[11px] font-semibold tracking-[0.12em] uppercase" style={{ color: '#6B1E2E' }}>
            Cores da marca
          </label>
          {[
            { label: 'Cor principal', value: primary, set: setPrimary },
            { label: 'Cor de destaque', value: secondary, set: setSecondary },
          ].map(({ label, value, set }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: '1px solid #EDD8DE' }}>
                <input type="color" value={value} onChange={e => set(e.target.value)}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: '#1C1A17' }}>{label}</p>
                <input value={value} onChange={e => set(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 mt-1 rounded-lg focus:outline-none font-mono"
                  style={{ background: '#F9F5F6', border: '1px solid #EDD8DE', color: '#6B6458' }} />
              </div>
            </div>
          ))}
        </div>

        {error && (
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: '#FEF2F2', color: '#B91C1C' }}>{error}</p>
        )}

        <button onClick={save} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl btn-bordo font-semibold text-sm tracking-wide">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : null}
          {saving ? 'Salvando...' : saved ? 'Salvo!' : 'Salvar identidade visual'}
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
