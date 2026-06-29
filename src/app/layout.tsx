import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Clínica Sarah Pina — POP',
  description: 'Manual de Operações e Cursos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  )
}
