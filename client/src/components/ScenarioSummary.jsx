import PropTypes from 'prop-types'
import { formatCurrency, formatMonths } from '../utils/formatters.js'

export function ScenarioSummary ({ scenarios }) {
  if (!scenarios || scenarios.length === 0) return null

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">Comparativo de cenários</h2>
        <p className="panel-subtitle">Como o plano se comporta em diferentes condições.</p>
      </header>

      <div className="metrics-grid">
        {scenarios.map((scenario) => (
          <article key={scenario.id} className="metric-box">
            <div className="metric-label" style={{ color: scenario.color }}>{scenario.label}</div>
            <div className="metric-value">{formatCurrency(scenario.summary.finalBalance)}</div>
            <p className="metric-subtext">
              {scenario.summary.goalAchieved
                ? `Meta em ${formatMonths(scenario.summary.goalAchievedMonth)}`
                : 'Meta não atingida no período'}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

ScenarioSummary.propTypes = {
  scenarios: PropTypes.array
}
