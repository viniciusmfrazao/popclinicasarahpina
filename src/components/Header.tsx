'use client'
interface HeaderProps {
  title: string
  subtitle?: string
  back?: boolean
}
export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
          style={{ background: '#D4537E' }}>SP</div>
        <div>
          <div className="text-sm font-semibold text-gray-900 leading-tight">{title}</div>
          {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
        </div>
      </div>
    </div>
  )
}
