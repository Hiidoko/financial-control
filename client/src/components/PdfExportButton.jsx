import PropTypes from 'prop-types'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export function PdfExportButton ({ targetId }) {
  const handleExport = async () => {
    const section = document.getElementById(targetId)
    if (!section) return

    const canvas = await html2canvas(section, {
      backgroundColor: '#0b1120',
      scale: 1.5
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const imgWidth = pageWidth
    const imgHeight = canvas.height * imgWidth / canvas.width

    let position = 0
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)

    if (imgHeight > pageHeight) {
      let heightLeft = imgHeight - pageHeight
      while (heightLeft > 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }
    }

    pdf.save('plano-financeiro.pdf')
  }

  return (
    <button type="button" className="pdf-button" onClick={handleExport}>
      Exportar plano em PDF
    </button>
  )
}

PdfExportButton.propTypes = {
  targetId: PropTypes.string.isRequired
}
