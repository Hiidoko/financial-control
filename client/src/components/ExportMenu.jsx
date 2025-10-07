import { useCallback, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { exportTimelineCsv, exportExcelWorkbook, createShareLink } from '../utils/exporters.js'
import { PdfExportButton } from './PdfExportButton.jsx'

export function ExportMenu ({ targetId, results, payload }) {
  const [isOpen, setIsOpen] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [shareError, setShareError] = useState(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)

  const hasResults = Boolean(results?.simulation)

  const sanitizedPayload = useMemo(() => {
    if (!payload) return null
    return JSON.parse(JSON.stringify(payload))
  }, [payload])

  const toggleOpen = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleShareLink = useCallback(async () => {
    if (!sanitizedPayload || !hasResults) return
    setIsGeneratingLink(true)
    setShareError(null)
    try {
      const link = await createShareLink(sanitizedPayload, results, sharePassword)
      setShareLink(link)
    } catch (error) {
      setShareError(error.message || 'Não foi possível gerar o link')
      setShareLink('')
    } finally {
      setIsGeneratingLink(false)
    }
  }, [sanitizedPayload, hasResults, results, sharePassword])

  const handleCopy = useCallback(() => {
    if (!shareLink) return
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(shareLink)
    } else {
      const tempInput = document.createElement('input')
      tempInput.value = shareLink
      document.body.appendChild(tempInput)
      tempInput.select()
      document.execCommand('copy')
      document.body.removeChild(tempInput)
    }
  }, [shareLink])

  return (
    <div className="export-menu">
      <button type="button" className="toggle-button" onClick={toggleOpen} disabled={!hasResults}>
        Exportar & compartilhar
      </button>

      {isOpen && (
        <div className="export-menu__panel">
          <div className="stack-space">
            <PdfExportButton targetId={targetId} />
            <button type="button" className="button-ghost" onClick={() => exportTimelineCsv(results)} disabled={!hasResults}>
              Exportar timeline (CSV)
            </button>
            <button type="button" className="button-ghost" onClick={() => exportExcelWorkbook(results)} disabled={!hasResults}>
              Exportar planilha (Excel)
            </button>
          </div>

          <div className="share-block">
            <h4>Compartilhar plano protegido</h4>
            <p className="metric-subtext">Crie um link seguro para enviar seu plano a outra pessoa.</p>
            <input
              type="password"
              className="input-control"
              placeholder="Senha para criptografar"
              value={sharePassword}
              onChange={(event) => setSharePassword(event.target.value)}
            />
            <button type="button" className="button-primary" onClick={handleShareLink} disabled={!sharePassword || isGeneratingLink}>
              {isGeneratingLink ? 'Gerando link...' : 'Gerar link protegido'}
            </button>
            {shareError && <p className="text-danger" style={{ marginTop: '8px' }}>{shareError}</p>}
            {shareLink && (
              <div className="share-link-preview">
                <input type="text" className="input-control" value={shareLink} readOnly />
                <button type="button" className="button-ghost" onClick={handleCopy}>Copiar link</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

ExportMenu.propTypes = {
  targetId: PropTypes.string.isRequired,
  results: PropTypes.object,
  payload: PropTypes.object
}
