/**
 * Render a DOM element to an A4 PDF and trigger a download.
 * Splits across pages if the content is taller than one page.
 */
export default async function downloadElementAsPdf(element, filename) {
  // Loaded on demand so the PDF libraries are not part of the main bundle
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const pdf        = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const margin     = 10
  const pageWidth  = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth   = pageWidth - margin * 2
  const imgHeight  = (canvas.height * imgWidth) / canvas.width
  const imgData    = canvas.toDataURL('image/png')

  let remaining = imgHeight
  let offsetY   = margin
  pdf.addImage(imgData, 'PNG', margin, offsetY, imgWidth, imgHeight)
  remaining -= pageHeight - margin * 2

  while (remaining > 0) {
    offsetY -= pageHeight - margin * 2
    pdf.addPage()
    pdf.addImage(imgData, 'PNG', margin, offsetY, imgWidth, imgHeight)
    remaining -= pageHeight - margin * 2
  }

  pdf.save(filename)
}
