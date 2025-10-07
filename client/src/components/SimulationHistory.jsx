import { Fragment, useMemo, useState } from 'react'
import PropTypes from 'prop-types'

import { formatCurrency, formatPercent } from '../utils/formatters.js'

function formatDate (timestamp) {
  return new Date(timestamp).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  })
}

export function SimulationHistory ({ history, onUpdateComment, onRestore }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  const comparison = useMemo(() => {
    if (selectedIds.length !== 2) return null
    const [firstId, secondId] = selectedIds
    const first = history.find((entry) => entry.id === firstId)
    const second = history.find((entry) => entry.id === secondId)
    if (!first || !second) return null

    const metrics = [
      {
        key: 'finalBalance',
        label: 'Saldo final (base)',
        format: formatCurrency,
        firstValue: first.summary?.baseline?.finalBalance ?? 0,
        secondValue: second.summary?.baseline?.finalBalance ?? 0
      },
      {
        key: 'goals',
        label: 'Metas concluídas',
        format: (value, entry) => {
          const totalGoals = entry.summary?.baseline?.goals?.length ?? 0
          return `${value}/${totalGoals}`
        },
        firstValue: first.summary?.baseline?.goalsAchievedCount ?? 0,
        secondValue: second.summary?.baseline?.goalsAchievedCount ?? 0
      },
      {
        key: 'shortfall',
        label: 'Prob. shortfall',
        format: (value) => formatPercent(value ?? 0),
        firstValue: first.summary?.shortfallProbability ?? 0,
        secondValue: second.summary?.shortfallProbability ?? 0
      },
      {
        key: 'independence',
        label: 'Índice de independência',
        format: (value) => `${(value ?? 0).toFixed(2)}x`,
        firstValue: first.summary?.financialIndependenceIndex ?? 0,
        secondValue: second.summary?.financialIndependenceIndex ?? 0
      },
      {
        key: 'savings',
        label: 'Taxa de poupança',
        format: (value) => formatPercent(value ?? 0),
        firstValue: first.summary?.savingsRate ?? 0,
        secondValue: second.summary?.savingsRate ?? 0
      }
    ]

    return {
      first,
      second,
      metrics
    }
  }, [selectedIds, history])

  if (!history || history.length === 0) {
    return (
      <section className="panel">
        <h3 className="panel-title">Histórico de simulações</h3>
        <p className="panel-subtitle">As simulações que você rodar aparecerão aqui para comparação futura.</p>
      </section>
    )
  }

  return (
    <section className={`panel ${isCollapsed ? 'panel--collapsed' : ''}`}>
      <header className="panel-header">
        <div>
          <h3 className="panel-title">Histórico de simulações</h3>
          <p className="panel-subtitle">
            {isCollapsed
              ? 'Histórico recolhido. Expanda para revisar comparações recentes.'
              : 'Selecione até duas simulações para comparar resultados e registre aprendizados.'}
          </p>
        </div>
        <div className="history-toolbar">
          <span className="history-counter" aria-live="polite">
            {history.length} {history.length === 1 ? 'entrada' : 'entradas'}
          </span>
          <button
            type="button"
            className="button-ghost button-ghost--compact"
            onClick={() => setIsCollapsed((prev) => !prev)}
            aria-expanded={!isCollapsed}
          >
            {isCollapsed ? 'Expandir histórico' : 'Recolher histórico'}
          </button>
        </div>
      </header>

      {!isCollapsed && (
        <>
          <div className="history-list">
            {history.map((entry) => (
              <article key={entry.id} className={`history-card ${selectedIds.includes(entry.id) ? 'history-card--selected' : ''}`}>
                <header className="flex-between">
                  <div>
                    <strong>{entry.label}</strong>
                    <p className="metric-subtext">Rodada em {formatDate(entry.timestamp)}</p>
                  </div>
                  <div className="history-actions">
                    <button type="button" className="button-ghost" onClick={() => toggleSelected(entry.id)}>
                      {selectedIds.includes(entry.id) ? 'Remover comparação' : 'Comparar'}
                    </button>
                    <button type="button" className="button-ghost" onClick={() => onRestore(entry.id, { autoRun: true })}>
                      Recarregar plano
                    </button>
                  </div>
                </header>

                <div className="history-metrics">
                  <span>Saldo final: {formatCurrency(entry.summary?.baseline?.finalBalance ?? 0)}</span>
                  <span>Shortfall: {formatPercent(entry.summary?.shortfallProbability ?? 0)}</span>
                  {entry.recommendations?.persona?.name && (
                    <span>Persona: {entry.recommendations.persona.name}</span>
                  )}
                </div>

                <label className="stack-space" style={{ marginTop: '12px' }}>
                  <span className="metric-subtext">Comentários</span>
                  <textarea
                    className="input-control"
                    rows={2}
                    value={entry.comment || ''}
                    placeholder="Anote percepções ou próximos passos"
                    onChange={(event) => onUpdateComment(entry.id, event.target.value)}
                  />
                </label>
              </article>
            ))}
          </div>

          {comparison && (
            <div className="history-comparison">
              <h4>Comparação lado a lado</h4>
              <div className="comparison-grid">
                <div>
                  <strong>{comparison.first.label}</strong>
                </div>
                <div>
                  <strong>{comparison.second.label}</strong>
                </div>
                {comparison.metrics.map((metric) => (
                  <Fragment key={metric.key}>
                    <div>
                      <span className="metric-label">{metric.label}</span>
                      <div className="metric-value">
                        {metric.format(metric.firstValue, comparison.first)}
                      </div>
                    </div>
                    <div>
                      <span className="metric-label">{metric.label}</span>
                      <div className="metric-value">
                        {metric.format(metric.secondValue, comparison.second)}
                      </div>
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

SimulationHistory.propTypes = {
  history: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string,
    timestamp: PropTypes.number,
    summary: PropTypes.object,
    recommendations: PropTypes.object,
    comment: PropTypes.string
  })),
  onUpdateComment: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired
}

SimulationHistory.defaultProps = {
  history: []
}
