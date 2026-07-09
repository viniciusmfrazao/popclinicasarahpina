import { jsPDF } from 'jspdf'
import { Account, Section, SectionItem } from './types'

const TEXT = '#3A342E'
const MUTED = '#8A8178'
const LINE = '#E8DCDF'

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    return await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function drawHeaderBand(doc: jsPDF, account: Account, logo: string | null, pageW: number) {
  doc.setFillColor(account.primary_color)
  doc.rect(0, 0, pageW, 26, 'F')
  doc.setFillColor(account.secondary_color)
  doc.rect(0, 26, pageW, 1.4, 'F')

  if (logo) {
    try { doc.addImage(logo, 'PNG', 14, 6, 14, 14, undefined, 'FAST') } catch { /* segue sem logo */ }
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor('#FFFFFF')
  doc.text(account.name.toUpperCase(), logo ? 32 : 14, 12, { charSpace: 0.6 })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(account.secondary_color)
  doc.text('Manual de Procedimentos Operacionais', logo ? 32 : 14, 18)
}

function drawFooter(doc: jsPDF, account: Account, pageW: number, pageH: number, page: number, total: number) {
  doc.setDrawColor(LINE)
  doc.setLineWidth(0.2)
  doc.line(14, pageH - 14, pageW - 14, pageH - 14)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7.5)
  doc.setTextColor(MUTED)
  doc.text(account.name, 14, pageH - 9)
  doc.text(`${page} / ${total}`, pageW - 14, pageH - 9, { align: 'right' })
}

/**
 * Gera um PDF elaborado (A4 retrato) de uma seção do Manual POP,
 * com a identidade visual (cores e logo) da conta.
 */
export async function generatePOPSectionPDF(
  section: Section,
  items: SectionItem[],
  account: Account
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  const logo = account.logo_url ? await loadImageAsDataURL(account.logo_url) : null

  drawHeaderBand(doc, account, logo, pageW)

  let y = 42
  doc.setFont('times', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(account.primary_color)
  const titleLines = doc.splitTextToSize(section.title, contentW)
  doc.text(titleLines, margin, y)
  y += titleLines.length * 9 + 2

  if (section.summary) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10.5)
    doc.setTextColor(MUTED)
    const summaryLines = doc.splitTextToSize(section.summary, contentW)
    doc.text(summaryLines, margin, y)
    y += summaryLines.length * 5 + 4
  }

  doc.setDrawColor(account.secondary_color)
  doc.setLineWidth(0.6)
  doc.line(margin, y, margin + 26, y)
  y += 10

  items.forEach((item, i) => {
    const titleLines = doc.splitTextToSize(item.title, contentW - 12)
    const bodyLines = doc.splitTextToSize(item.content || '', contentW - 12)
    const blockHeight = titleLines.length * 6 + bodyLines.length * 5 + 12

    if (y + blockHeight > pageH - 20) {
      doc.addPage()
      drawHeaderBand(doc, account, logo, pageW)
      y = 42
    }

    // Badge numerado
    doc.setFillColor(account.secondary_color)
    doc.circle(margin + 3.2, y - 1.3, 3.6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    doc.setTextColor(account.primary_color)
    doc.text(String(i + 1), margin + 3.2, y, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11.5)
    doc.setTextColor(TEXT)
    doc.text(titleLines, margin + 10, y)
    y += titleLines.length * 6 + 2

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.setTextColor(TEXT)
    doc.text(bodyLines, margin + 10, y, { lineHeightFactor: 1.45 })
    y += bodyLines.length * 5 + 9
  })

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    drawFooter(doc, account, pageW, pageH, p, total)
  }

  return doc
}

export function popSectionFileName(section: Section, account: Account) {
  const safe = (s: string) => s.trim().replace(/\s+/g, '_')
  return `POP_${safe(account.name)}_-_${safe(section.title)}.pdf`
}

/**
 * Gera o Manual POP completo: capa com índice + uma seção por página(s),
 * na mesma identidade visual da conta.
 */
export async function generatePOPManualPDF(
  sections: Section[],
  itemsBySectionId: Record<string, SectionItem[]>,
  account: Account
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  const logo = account.logo_url ? await loadImageAsDataURL(account.logo_url) : null

  // Capa
  doc.setFillColor(account.primary_color)
  doc.rect(0, 0, pageW, pageH, 'F')
  if (logo) {
    try { doc.addImage(logo, 'PNG', pageW / 2 - 12, 46, 24, 24, undefined, 'FAST') } catch { /* segue sem logo */ }
  }
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(account.secondary_color)
  doc.text(account.name.toUpperCase(), pageW / 2, logo ? 82 : 60, { align: 'center', charSpace: 1 })
  doc.setFont('times', 'bold')
  doc.setFontSize(30)
  doc.setTextColor('#FFFFFF')
  doc.text('Manual de', pageW / 2, logo ? 96 : 74, { align: 'center' })
  doc.text('Procedimentos Operacionais', pageW / 2, logo ? 106 : 84, { align: 'center' })
  doc.setDrawColor(account.secondary_color)
  doc.setLineWidth(0.6)
  doc.line(pageW / 2 - 18, (logo ? 114 : 92), pageW / 2 + 18, (logo ? 114 : 92))

  let y = (logo ? 130 : 108)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(account.secondary_color)
  doc.text('ÍNDICE', margin, y, { charSpace: 0.6 })
  y += 8
  sections.forEach((s, i) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10.5)
    doc.setTextColor('#FFFFFF')
    doc.text(`${String(i + 1).padStart(2, '0')}   ${s.title}`, margin, y)
    y += 7
  })

  // Seções
  sections.forEach(section => {
    doc.addPage()
    drawHeaderBand(doc, account, logo, pageW)
    let sy = 42
    doc.setFont('times', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(account.primary_color)
    const titleLines = doc.splitTextToSize(section.title, contentW)
    doc.text(titleLines, margin, sy)
    sy += titleLines.length * 9 + 2

    if (section.summary) {
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(10.5)
      doc.setTextColor(MUTED)
      const summaryLines = doc.splitTextToSize(section.summary, contentW)
      doc.text(summaryLines, margin, sy)
      sy += summaryLines.length * 5 + 4
    }

    doc.setDrawColor(account.secondary_color)
    doc.setLineWidth(0.6)
    doc.line(margin, sy, margin + 26, sy)
    sy += 10

    const items = itemsBySectionId[section.id] ?? []
    items.forEach((item, i) => {
      const titleLines2 = doc.splitTextToSize(item.title, contentW - 12)
      const bodyLines = doc.splitTextToSize(item.content || '', contentW - 12)
      const blockHeight = titleLines2.length * 6 + bodyLines.length * 5 + 12

      if (sy + blockHeight > pageH - 20) {
        doc.addPage()
        drawHeaderBand(doc, account, logo, pageW)
        sy = 42
      }

      doc.setFillColor(account.secondary_color)
      doc.circle(margin + 3.2, sy - 1.3, 3.6, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(account.primary_color)
      doc.text(String(i + 1), margin + 3.2, sy, { align: 'center' })

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      doc.setTextColor(TEXT)
      doc.text(titleLines2, margin + 10, sy)
      sy += titleLines2.length * 6 + 2

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(TEXT)
      doc.text(bodyLines, margin + 10, sy, { lineHeightFactor: 1.45 })
      sy += bodyLines.length * 5 + 9
    })
  })

  const total = doc.getNumberOfPages()
  for (let p = 2; p <= total; p++) {
    doc.setPage(p)
    drawFooter(doc, account, pageW, pageH, p - 1, total - 1)
  }

  return doc
}

export function popManualFileName(account: Account) {
  const safe = (s: string) => s.trim().replace(/\s+/g, '_')
  return `Manual_POP_${safe(account.name)}.pdf`
}
