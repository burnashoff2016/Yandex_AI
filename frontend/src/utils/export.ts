import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import { saveAs } from 'file-saver'
import { ChannelResult } from '@/types'

interface ExportResult {
  channel: string
  result: ChannelResult
}

function formatResultText(channel: string, result: ChannelResult): string {
  let text = `=== ${channel} ===\n`
  
  if (result.headline) {
    text += `Заголовок: ${result.headline}\n`
  }
  
  text += `Текст: ${result.body}\n`
  
  if (result.cta) {
    text += `CTA: ${result.cta}\n`
  }
  
  if (result.hashtags && result.hashtags.length > 0) {
    text += `Хештеги: ${result.hashtags.join(' ')}\n`
  }
  
  text += `Оценка: ${result.score.toFixed(1)}/10\n`
  
  if (result.improvements && result.improvements.length > 0) {
    text += `Рекомендации:\n${result.improvements.map(i => `  • ${i}`).join('\n')}\n`
  }
  
  return text + '\n'
}

export function exportToCSV(results: ExportResult[], filename = 'content'): void {
  const headers = ['Канал', 'Заголовок', 'Текст', 'CTA', 'Хештеги', 'Оценка', 'Рекомендации']
  
  const rows = results.map(({ channel, result }) => [
    channel,
    result.headline || '',
    result.body.replace(/\n/g, ' '),
    result.cta || '',
    result.hashtags?.join(', ') || '',
    result.score.toFixed(1),
    result.improvements?.join('; ') || ''
  ])
  
  const csvContent = [
    headers.join('\t'),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join('\t'))
  ].join('\n')
  
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `${filename}.csv`)
}

export function exportToPDF(results: ExportResult[], filename = 'content'): void {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  let y = margin
  
  doc.setFontSize(18)
  doc.text('Marketing Content', margin, y)
  y += 10
  
  doc.setFontSize(10)
  doc.setTextColor(128)
  doc.text(`Generated: ${new Date().toLocaleDateString('ru-RU')}`, margin, y)
  y += 15
  
  results.forEach(({ channel, result }) => {
    if (y > 250) {
      doc.addPage()
      y = margin
    }
    
    doc.setTextColor(0)
    doc.setFontSize(14)
    doc.text(channel, margin, y)
    y += 8
    
    doc.setFontSize(10)
    
    if (result.headline) {
      doc.setFont('helvetica', 'bold')
      doc.text(result.headline, margin, y)
      y += 6
    }
    
    doc.setFont('helvetica', 'normal')
    const bodyLines = doc.splitTextToSize(result.body, maxWidth)
    doc.text(bodyLines, margin, y)
    y += bodyLines.length * 5 + 3
    
    if (result.cta) {
      doc.setTextColor(220, 38, 38)
      doc.text(`CTA: ${result.cta}`, margin, y)
      doc.setTextColor(0)
      y += 6
    }
    
    if (result.hashtags && result.hashtags.length > 0) {
      doc.setTextColor(59, 130, 246)
      doc.text(result.hashtags.join(' '), margin, y)
      doc.setTextColor(0)
      y += 6
    }
    
    doc.setTextColor(100)
    doc.text(`Score: ${result.score.toFixed(1)}/10`, margin, y)
    y += 10
  })
  
  doc.save(`${filename}.pdf`)
}

export async function exportToDOCX(results: ExportResult[], filename = 'content'): Promise<void> {
  const children: Paragraph[] = [
    new Paragraph({
      text: 'Marketing Content',
      heading: HeadingLevel.TITLE,
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleDateString('ru-RU')}`,
      spacing: { after: 400 },
    }),
  ]
  
  results.forEach(({ channel, result }) => {
    children.push(
      new Paragraph({
        text: channel,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 300, after: 100 },
      })
    )
    
    if (result.headline) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: result.headline, bold: true }),
          ],
          spacing: { after: 100 },
        })
      )
    }
    
    children.push(
      new Paragraph({
        text: result.body,
        spacing: { after: 100 },
      })
    )
    
    if (result.cta) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'CTA: ', bold: true }),
            new TextRun({ text: result.cta, color: 'DC2626' }),
          ],
          spacing: { after: 100 },
        })
      )
    }
    
    if (result.hashtags && result.hashtags.length > 0) {
      children.push(
        new Paragraph({
          text: result.hashtags.join(' '),
          spacing: { after: 100 },
        })
      )
    }
    
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Score: ${result.score.toFixed(1)}/10`, italics: true, color: '666666' }),
        ],
        spacing: { after: 300 },
      })
    )
  })
  
  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  })
  
  const blob = await Packer.toBlob(doc)
  saveAs(blob, `${filename}.docx`)
}

export function copyToClipboard(results: ExportResult[]): Promise<void> {
  const text = results
    .map(({ channel, result }) => formatResultText(channel, result))
    .join('\n')
  
  return navigator.clipboard.writeText(text)
}

export function copySingleResult(_channel: string, result: ChannelResult): Promise<void> {
  let text = ''
  
  if (result.headline) {
    text += result.headline + '\n\n'
  }
  
  text += result.body
  
  if (result.hashtags && result.hashtags.length > 0) {
    text += '\n\n' + result.hashtags.join(' ')
  }
  
  return navigator.clipboard.writeText(text)
}
