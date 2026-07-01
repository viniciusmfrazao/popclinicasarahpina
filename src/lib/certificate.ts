import { jsPDF } from 'jspdf'
import { Certificate } from './types'

// Paleta da marca
const BORDEAUX = '#6B1E2E'
const BORDEAUX_DARK = '#4A1020'
const ROSE_BORDER = '#D9A7B0'
const TEXT = '#3A342E'

function formatDate(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]
  return `${date.getDate()} de ${meses[date.getMonth()]} de ${date.getFullYear()}`
}

function formatHours(hours: number) {
  const n = Number(hours)
  const isInt = Number.isInteger(n)
  return `${isInt ? n : n.toFixed(1).replace('.', ',')} hora${n === 1 ? '' : 's'}`
}

/**
 * Gera o PDF do certificado em A4 paisagem, pronto para impressão,
 * seguindo o modelo visual do Instituto Sarah Pina (borda rosé,
 * título serifado bordô, nome em destaque, assinatura da instrutora).
 */
export function generateCertificatePDF(cert: Certificate): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()   // 297
  const pageH = doc.internal.pageSize.getHeight()  // 210
  const cx = pageW / 2

  // Fundo branco (garante base sólida para impressão)
  doc.setFillColor('#FFFFFF')
  doc.rect(0, 0, pageW, pageH, 'F')

  // Moldura única em rosé, igual ao modelo padrão
  const margin = 12
  doc.setDrawColor(ROSE_BORDER)
  doc.setLineWidth(1.1)
  doc.rect(margin, margin, pageW - margin * 2, pageH - margin * 2)

  let y = 50

  // Título
  doc.setFont('times', 'bold')
  doc.setFontSize(46)
  doc.setTextColor(BORDEAUX_DARK)
  doc.text('CERTIFICADO', cx, y, { align: 'center' })

  y += 16
  doc.setFont('times', 'normal')
  doc.setFontSize(13)
  doc.setTextColor(TEXT)
  doc.text('Certifico que:', cx, y, { align: 'center' })

  y += 24
  doc.setFont('times', 'italic')
  doc.setFontSize(29)
  doc.setTextColor(BORDEAUX)
  doc.text(cert.student_name, cx, y, { align: 'center' })

  // Linha sob o nome
  const nameWidth = Math.min(
    doc.getTextWidth(cert.student_name) + 20,
    pageW - margin * 2 - 60
  )
  doc.setDrawColor(BORDEAUX)
  doc.setLineWidth(0.3)
  doc.line(cx - nameWidth / 2, y + 4, cx + nameWidth / 2, y + 4)

  y += 18
  doc.setFont('times', 'normal')
  doc.setFontSize(13.5)
  doc.setTextColor(TEXT)

  const isTrofeu = cert.certificate_type === 'trofeu'
  const paragraph = isTrofeu
    ? `concluiu com destaque o curso de ${cert.course_title}, ministrado por ${cert.instructor_name}, com carga horária de ${formatHours(cert.workload_hours)}, no dia ${formatDate(cert.issue_date)}, sendo reconhecida(o) como Aluna(o) Destaque da turma.`
    : `concluiu o curso de ${cert.course_title}, ministrado por ${cert.instructor_name}, com carga horária de ${formatHours(cert.workload_hours)}, no dia ${formatDate(cert.issue_date)}.`

  const lines = doc.splitTextToSize(paragraph, pageW - margin * 2 - 90)
  doc.text(lines, cx, y, { align: 'center', lineHeightFactor: 1.55 })

  // Assinatura
  const sigY = pageH - 42
  const sigLineWidth = 70
  doc.setDrawColor(TEXT)
  doc.setLineWidth(0.25)
  doc.line(cx - sigLineWidth / 2, sigY, cx + sigLineWidth / 2, sigY)

  doc.setFont('times', 'normal')
  doc.setFontSize(12.5)
  doc.setTextColor(BORDEAUX)
  doc.text(cert.instructor_name, cx, sigY + 6, { align: 'center' })

  doc.setFontSize(10)
  doc.setTextColor('#8A8178')
  doc.text(cert.instructor_title, cx, sigY + 11.5, { align: 'center' })

  return doc
}

export function certificateFileName(cert: Certificate) {
  const safeName = cert.student_name.trim().replace(/\s+/g, '_')
  const safeCourse = cert.course_title.trim().replace(/\s+/g, '_').slice(0, 40)
  return `Certificado_${safeCourse}_-_${safeName}.pdf`
}
