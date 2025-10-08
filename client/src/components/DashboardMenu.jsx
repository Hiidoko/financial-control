import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import PropTypes from 'prop-types'
import { PdfExportButton } from './PdfExportButton.jsx'
import { exportTimelineCsv, exportExcelWorkbook, createShareLink } from '@/utils/exporters.js'

export function DashboardMenu ({
  theme,
  toggleTheme,
  focusMode,
  toggleFocusMode,
  onStartTour,
  tourDisabled,
  results,
  payload,
  logout
}) {
  const [open, setOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [sharePassword, setSharePassword] = useState('')
  const [shareLink, setShareLink] = useState('')
  const [shareError, setShareError] = useState(null)
  const [isGeneratingLink, setIsGeneratingLink] = useState(false)
  const panelRef = useRef(null)
  const buttonRef = useRef(null)
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 })

  const hasResults = Boolean(results?.simulation)
  const sanitizedPayload = payload ? JSON.parse(JSON.stringify(payload)) : null

  const close = useCallback(() => setOpen(false), [])

  const recalcPosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const gap = 8
    const panelWidth = 380
    let left = rect.left
    if (left + panelWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - panelWidth - 8)
    }
    setCoords({ top: rect.bottom + gap, left, width: Math.min(panelWidth, window.innerWidth - 16) })
  }, [])

  useEffect(() => {
    if (!open) return
    recalcPosition()
    const handler = (e) => {
      if (e.key === 'Escape') close()
      if (panelRef.current && !panelRef.current.contains(e.target) && !buttonRef.current.contains(e.target)) {
        close()
      }
    }
    const onResizeScroll = () => recalcPosition()
    window.addEventListener('resize', onResizeScroll)
    window.addEventListener('scroll', onResizeScroll, true)
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', handler)
    return () => {
      window.removeEventListener('resize', onResizeScroll)
      window.removeEventListener('scroll', onResizeScroll, true)
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', handler)
    }
  }, [open, close, recalcPosition])

  const handleShareLink = useCallback(async () => {
    if (!sanitizedPayload || !hasResults) return
    setIsGeneratingLink(true)
    setShareError(null)
    try {
      const link = await createShareLink(sanitizedPayload, results, sharePassword)
      setShareLink(link)
    } catch (err) {
      setShareError(err.message || 'Falha ao gerar link')
      setShareLink('')
    } finally {
      setIsGeneratingLink(false)
    }
  }, [sanitizedPayload, hasResults, results, sharePassword])

  const handleCopy = useCallback(() => {
    if (!shareLink) return
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(shareLink)
  }, [shareLink])

  return (
    <div className="dash-menu">
      <button
        type="button"
        className="dash-menu__button action-btn"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        ref={buttonRef}
      >Menu</button>
      {open && typeof document !== 'undefined' && createPortal(
        <div
          className="dash-menu__panel dash-menu__panel--floating"
          ref={panelRef}
          role="menu"
          aria-label="Menu principal"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
          <div className="dash-menu__group">
            <button type="button" role="menuitem" className="dash-menu__item" onClick={toggleTheme}>
              {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
            </button>
            <button type="button" role="menuitem" className="dash-menu__item" onClick={toggleFocusMode}>
              {focusMode ? 'Sair do modo foco' : 'Modo foco'}
            </button>
            <button
              type="button"
              role="menuitem"
              className="dash-menu__item"
              onClick={() => { onStartTour(); close() }}
              disabled={tourDisabled}
            >
              Assistente guiado
            </button>
          </div>
          <div className="dash-menu__group">
            <button
              type="button"
              className="dash-menu__item dash-menu__item--expand"
              aria-expanded={exportOpen}
              onClick={() => setExportOpen(o => !o)}
              disabled={!hasResults}
            >
              Exportar & compartilhar {exportOpen ? '−' : '+'}
            </button>
            {exportOpen && (
              <div className="dash-menu__export" role="group" aria-label="Opções de exportação">
                <PdfExportButton targetId="dashboard-content" />
                <button
                  type="button"
                  className="dash-menu__subitem"
                  onClick={() => exportTimelineCsv(results)}
                  disabled={!hasResults}
                >
                  Timeline (CSV)
                </button>
                <button
                  type="button"
                  className="dash-menu__subitem"
                  onClick={() => exportExcelWorkbook(results)}
                  disabled={!hasResults}
                >
                  Planilha (Excel)
                </button>
                <div className="dash-menu__share">
                  <input
                    type="password"
                    className="input-control dash-menu__share-input"
                    placeholder="Senha para link protegido"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="dash-menu__subitem dash-menu__subitem--primary"
                    onClick={handleShareLink}
                    disabled={!sharePassword || isGeneratingLink}
                  >
                    {isGeneratingLink ? 'Gerando...' : 'Gerar link'}
                  </button>
                  {shareError && <p className="text-danger dash-menu__feedback">{shareError}</p>}
                  {shareLink && (
                    <div className="dash-menu__share-result">
                      <input type="text" readOnly className="input-control" value={shareLink} />
                      <button type="button" className="dash-menu__subitem" onClick={handleCopy}>Copiar</button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="dash-menu__group dash-menu__group--danger">
            <button type="button" role="menuitem" className="dash-menu__item dash-menu__item--danger" onClick={logout}>
              Sair
            </button>
          </div>
        </div>, document.body)
      }
    </div>
  )
}

DashboardMenu.propTypes = {
  theme: PropTypes.string.isRequired,
  toggleTheme: PropTypes.func.isRequired,
  focusMode: PropTypes.bool.isRequired,
  toggleFocusMode: PropTypes.func.isRequired,
  onStartTour: PropTypes.func.isRequired,
  tourDisabled: PropTypes.bool,
  results: PropTypes.object,
  payload: PropTypes.object,
  logout: PropTypes.func.isRequired
}
DashboardMenu.defaultProps = { tourDisabled: false, results: null, payload: null }