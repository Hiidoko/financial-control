import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'

function Section ({ title, description, children }) {
  if (!children) return null
  return (
    <section className="stack-space">
      <div>
        <h3 className="section-title">{title}</h3>
        {description && <p className="text-muted">{description}</p>}
      </div>
      <div className="recommendation-list">
        {children}
      </div>
    </section>
  )
}

Section.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  children: PropTypes.node
}

export function RecommendationPanel ({ recommendations, aiAdvice }) {
  if (!recommendations) return null

  const { quickWins, expenseCuts, strategicMoves, riskMitigation, kpis } = recommendations

  return (
    <section className="panel" id="recommendation-section">
      <header className="panel-header flex-between">
        <div>
          <h2 className="panel-title">Recomendações inteligentes</h2>
          <p className="panel-subtitle">Sugestões práticas para turbinar sua jornada financeira.</p>
        </div>
        {aiAdvice && (
          <div className="tag">
            <span>IA sugere:</span>
            <strong>{aiAdvice.highlight}</strong>
          </div>
        )}
      </header>

      <div className="stack-space">
        {aiAdvice && (
          <div className="recommendation-card">
            <h4>Insights comportamentais</h4>
            <p>{aiAdvice.message}</p>
          </div>
        )}

        <Section title="Vitórias rápidas" description="Mudanças simples com impacto imediato.">
          {quickWins && quickWins.length > 0 && quickWins.map((item, index) => (
            <div key={`quick-${index}`} className="recommendation-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
            </div>
          ))}
        </Section>

        <Section title="Cortes inteligentes" description="Reduza gastos sem comprometer qualidade de vida.">
          {expenseCuts && expenseCuts.length > 0 && expenseCuts.map((item, index) => (
            <div key={`cut-${index}`} className="recommendation-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <p className="metric-subtext">Impacto mensal estimado: {formatCurrency(item.estimatedMonthlyImpact)}</p>
            </div>
          ))}
        </Section>

        <Section title="Movimentos estratégicos" description="Ajustes estruturais para chegar mais longe.">
          {strategicMoves && strategicMoves.length > 0 && strategicMoves.map((item, index) => (
            <div key={`move-${index}`} className="recommendation-card">
              <div className="flex-between" style={{ marginBottom: '10px' }}>
                <h4>{item.title}</h4>
                <span className={`tag tag--impact-${item.impact}`}>{item.impact}</span>
              </div>
              <p>{item.description}</p>
              <p className="metric-subtext">Prazo sugerido: {item.timeHorizon}</p>
            </div>
          ))}
        </Section>

        <Section title="Gestão de riscos" description="Prepare-se para choques de mercado ou inflação.">
          {riskMitigation && riskMitigation.length > 0 && riskMitigation.map((item, index) => (
            <div key={`risk-${index}`} className="recommendation-card">
              <h4>{item.scenario}</h4>
              <p>{item.insight}</p>
              <p className="metric-subtext">Ação recomendada: {item.action}</p>
            </div>
          ))}
        </Section>
      </div>

      {kpis && (
        <footer style={{ marginTop: '24px' }}>
          <div className="metrics-grid">
            <article className="metric-box">
              <div className="metric-label">Taxa de poupança</div>
              <div className="metric-value">{(kpis.savingsRate * 100).toFixed(1)}%</div>
              <p className="metric-subtext">Meta mínima: 20%</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Meses de reserva</div>
              <div className="metric-value">{kpis.runwayMonths.toFixed(1)}</div>
              <p className="metric-subtext">Ideal: {aiAdvice?.targetRunway ?? '3-6'} meses</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Aporte recomendado</div>
              <div className="metric-value">{formatCurrency(kpis.requiredMonthlyContribution)}</div>
              <p className="metric-subtext">Para atingir a meta no prazo definido.</p>
            </article>
          </div>
        </footer>
      )}
    </section>
  )
}

RecommendationPanel.propTypes = {
  recommendations: PropTypes.object,
  aiAdvice: PropTypes.shape({
    highlight: PropTypes.string,
    message: PropTypes.string,
    targetRunway: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  })
}
