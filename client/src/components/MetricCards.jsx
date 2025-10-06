import PropTypes from 'prop-types'
import { formatCurrency, formatMonths, formatPercent } from '../utils/formatters.js'

const metricConfig = [
  {
    key: 'finalBalance',
    label: 'Saldo final',
    formatter: formatCurrency,
    summaryKey: 'baseline',
    subtext: (summary) => summary.baseline.goalAchieved ? 'Meta alcançada no cenário base' : 'Meta ainda não atingida'
  },
  {
    key: 'goalAchievedMonth',
    label: 'Prazo para meta',
    formatter: (value) => formatMonths(value ?? 0),
    summaryKey: 'baseline',
    subtext: (summary) => summary.baseline.goalAchieved ? 'Parabéns! Você chega lá nesse horizonte.' : 'Considere reforçar aportes.'
  },
  {
    key: 'requiredMonthlyContribution',
    label: 'Aporte mensal ideal',
    formatter: formatCurrency,
    summaryKey: 'root',
    subtext: () => 'Valor necessário para garantir a meta.'
  },
  {
    key: 'savingsRate',
    label: 'Taxa de poupança',
    formatter: (value) => formatPercent(Math.max(value, 0)),
    summaryKey: 'root',
    subtext: () => 'Quanto da renda está sendo investido.'
  }
]

export function MetricCards ({ summary }) {
  if (!summary) return null

  return (
    <div className="metrics-grid">
      {metricConfig.map((metric) => {
        const source = metric.summaryKey === 'root' ? summary : summary[metric.summaryKey]
        const value = source?.[metric.key]
        return (
          <article key={metric.key} className="metric-box">
            <div className="metric-label">{metric.label}</div>
            <div className="metric-value">{metric.formatter(value)}</div>
            <p className="metric-subtext">{metric.subtext(summary)}</p>
          </article>
        )
      })}
    </div>
  )
}

MetricCards.propTypes = {
  summary: PropTypes.object
}
