import { jsPDF } from 'jspdf'
import { Account } from './types'

const TEXT = '#3A342E'
const MUTED = '#8A8178'
const LINE = '#E8DCDF'

interface ChecklistPDFItem {
  title: string
  description?: string
  section_title: string
  job_function_name?: string | null
}

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

function drawHeaderBand(doc: jsPDF, account: Account, logo: string | null, pageW: number, subtitle: string) {
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
  doc.text(subtitle, logo ? 32 : 14, 18)
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
 * Gera um PDF elaborado (A4 retrato) do Checklist, agrupado por seção do POP,
 * com caixas de verificação para preenchimento manual e a marca da conta.
 */
export async function generateChecklistPDF(
  items: ChecklistPDFItem[],
  account: Account,
  scopeLabel: string
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 14
  const contentW = pageW - margin * 2

  const logo = account.logo_url ? await loadImageAsDataURL(account.logo_url) : null
  const subtitle = `Checklist Operacional · ${scopeLabel}`

  drawHeaderBand(doc, account, logo, pageW, subtitle)

  let y = 42
  doc.setFont('times', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(account.primary_color)
  doc.text('Checklist', margin, y)
  y += 8

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(MUTED)
  doc.text(`${items.length} itens · marque conforme for concluindo`, margin, y)
  y += 10

  const grouped = items.reduce<Record<string, ChecklistPDFItem[]>>((acc, item) => {
    (acc[item.section_title] ??= []).push(item)
    return acc
  }, {})

  Object.entries(grouped).forEach(([sectionTitle, sectionItems]) => {
    if (y + 14 > pageH - 20) {
      doc.addPage()
      drawHeaderBand(doc, account, logo, pageW, subtitle)
      y = 42
    }

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(account.primary_color)
    doc.text(sectionTitle.toUpperCase(), margin, y, { charSpace: 0.3 })
    y += 3
    doc.setDrawColor(account.secondary_color)
    doc.setLineWidth(0.5)
    doc.line(margin, y, pageW - margin, y)
    y += 7

    sectionItems.forEach(item => {
      const titleLines = doc.splitTextToSize(item.title, contentW - 12)
      const descLines = item.description ? doc.splitTextToSize(item.description, contentW - 12) : []
      const blockHeight = titleLines.length * 5.2 + descLines.length * 4.4 + 6

      if (y + blockHeight > pageH - 20) {
        doc.addPage()
        drawHeaderBand(doc, account, logo, pageW, subtitle)
        y = 42
      }

      doc.setDrawColor(TEXT)
      doc.setLineWidth(0.35)
      doc.rect(margin, y - 3.2, 4, 4)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10.5)
      doc.setTextColor(TEXT)
      doc.text(titleLines, margin + 8, y)
      y += titleLines.length * 5.2

      if (descLines.length) {
        doc.setFontSize(8.8)
        doc.setTextColor(MUTED)
        doc.text(descLines, margin + 8, y)
        y += descLines.length * 4.4
      }
      y += 4.5
    })
    y += 4
  })

  const total = doc.getNumberOfPages()
  for (let p = 1; p <= total; p++) {
    doc.setPage(p)
    drawFooter(doc, account, pageW, pageH, p, total)
  }

  return doc
}

export function checklistFileName(account: Account, scopeLabel: string) {
  const safe = (s: string) => s.trim().replace(/\s+/g, '_')
  return `Checklist_${safe(account.name)}_-_${safe(scopeLabel)}.pdf`
}
