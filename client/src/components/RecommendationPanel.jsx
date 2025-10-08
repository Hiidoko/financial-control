import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'
import { CollapseToggle } from './CollapseToggle.jsx'
import { usePanelCollapse, useAnimatedCollapse } from '@/hooks/usePanelCollapse.js'

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

export function RecommendationPanel ({ recommendations, aiAdvice, tourId }) {
  if (!recommendations) return null
  const { collapsed, toggle, contentId, shouldRender, onAnimationEnd } = usePanelCollapse('recommendations', false)
  const contentRef = useAnimatedCollapse(collapsed, onAnimationEnd)
  const {
    quickWins,
    expenseCuts,
    strategicMoves,
    riskMitigation,
    persona,
    benchmark,
    kpis
  } = recommendations
  const savingsRate = kpis?.savingsRate ?? 0
  const runwayMonths = kpis?.runwayMonths ?? 0
  const goalsAchievedCount = kpis?.goalsAchievedCount ?? 0
  const totalGoals = kpis?.totalGoals ?? 0
  const requiredMonthlyContribution = kpis?.requiredMonthlyContribution ?? 0
  const financialIndependenceIndex = kpis?.financialIndependenceIndex ?? 0
  const shortfallProbability = kpis?.shortfallProbability ?? 0
  const discretionaryRatio = kpis?.discretionaryRatio ?? 0

  return (
    <section className="panel" id="recommendation-section" data-tour={tourId}>
      <header className="panel-header panel-header--with-toggle">
        <div>
          <h2 className="panel-title">Recomendações inteligentes</h2>
          {!collapsed && <p className="panel-subtitle">Sugestões práticas para turbinar sua jornada financeira.</p>}
        </div>
        {aiAdvice && !collapsed && (
          <div className="tag" style={{ marginRight: '40px' }}>
            <span>IA sugere:</span>
            <strong>{aiAdvice.highlight}</strong>
          </div>
        )}
        <CollapseToggle
          collapsed={collapsed}
          onToggle={toggle}
          labelCollapse="Recolher recomendações"
          labelExpand="Expandir recomendações"
          size="sm"
          controls={contentId}
        />
      </header>

      {shouldRender && (
        <div
          ref={contentRef}
          id={contentId}
          className="collapsible-content-wrapper collapsible-fade stack-space"
          aria-hidden={collapsed}
        >
        {persona && (
          <div className="recommendation-card">
            <h4>Perfil financeiro sugerido: {persona.name}</h4>
            <p>{persona.description}</p>
            <p className="metric-subtext">{persona.rationale}</p>
            {persona.playbook?.length > 0 && (
              <ul className="bullet-list">
                {persona.playbook.map((item, index) => (
                  <li key={`persona-play-${index}`}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {aiAdvice && (
          <div className="recommendation-card">
            <h4>Insights comportamentais</h4>
            <p>{aiAdvice.message}</p>
            {aiAdvice.rationale && <p className="metric-subtext">Por quê: {aiAdvice.rationale}</p>}
          </div>
        )}

        <Section title="Vitórias rápidas" description="Mudanças simples com impacto imediato.">
          {quickWins && quickWins.length > 0 && quickWins.map((item, index) => (
            <div key={`quick-${index}`} className="recommendation-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              {item.reason && <p className="metric-subtext">Por quê: {item.reason}</p>}
            </div>
          ))}
        </Section>

        <Section title="Cortes inteligentes" description="Reduza gastos sem comprometer qualidade de vida.">
          {expenseCuts && expenseCuts.length > 0 && expenseCuts.map((item, index) => (
            <div key={`cut-${index}`} className="recommendation-card">
              <h4>{item.title}</h4>
              <p>{item.description}</p>
              <p className="metric-subtext">Impacto mensal estimado: {formatCurrency(item.estimatedMonthlyImpact)}</p>
              {item.reason && <p className="metric-subtext">Por quê: {item.reason}</p>}
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
              {item.reason && <p className="metric-subtext">Por quê: {item.reason}</p>}
            </div>
          ))}
        </Section>

        <Section title="Gestão de riscos" description="Prepare-se para choques de mercado ou inflação.">
          {riskMitigation && riskMitigation.length > 0 && riskMitigation.map((item, index) => (
            <div key={`risk-${index}`} className="recommendation-card">
              <h4>{item.scenario}</h4>
              <p>{item.insight}</p>
              <p className="metric-subtext">Ação recomendada: {item.action}</p>
              {item.reason && <p className="metric-subtext">Por quê: {item.reason}</p>}
            </div>
          ))}
        </Section>

        {benchmark && (
          <Section title="Como você se compara" description={`Referência: ${benchmark.source}`}>
            <div className="recommendation-card">
              <p>{benchmark.notes}</p>
              <ul className="bullet-list">
                {benchmark.topDeviations?.slice(0, 4).map((item, index) => (
                  <li key={`bench-${index}`}>
                    {item.category}: {Math.round(item.share * 100)}% vs {Math.round(item.benchmarkShare * 100)}% ({item.delta >= 0 ? '+' : ''}{Math.round(item.delta * 100)} p.p.)
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        )}
        {kpis && !collapsed && (
        <footer style={{ marginTop: '24px' }}>
          <div className="metrics-grid">
            <article className="metric-box">
              <div className="metric-label">Taxa de poupança</div>
              <div className="metric-value">{(savingsRate * 100).toFixed(1)}%</div>
              <p className="metric-subtext">Meta mínima: 20%</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Meses de reserva</div>
              <div className="metric-value">{runwayMonths.toFixed(1)}</div>
              <p className="metric-subtext">Ideal: {aiAdvice?.targetRunway ?? '3-6'} meses</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Metas no cenário base</div>
              <div className="metric-value">{goalsAchievedCount}/{totalGoals}</div>
              <p className="metric-subtext">Acompanhe o avanço das metas prioritárias.</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Aporte recomendado</div>
              <div className="metric-value">{formatCurrency(requiredMonthlyContribution)}</div>
              <p className="metric-subtext">Valor extra estimado para cobrir metas pendentes.</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Índice de independência</div>
              <div className="metric-value">{financialIndependenceIndex.toFixed(2)}x</div>
              <p className="metric-subtext">Renda passiva alvo: 1x gastos médios mensais.</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Risco de shortfall</div>
              <div className="metric-value">{(shortfallProbability * 100).toFixed(1)}%</div>
              <p className="metric-subtext">Probabilidade de falha na meta prioritária (Monte Carlo).</p>
            </article>
            <article className="metric-box">
              <div className="metric-label">Gastos discricionários</div>
              <div className="metric-value">{(discretionaryRatio * 100).toFixed(1)}%</div>
              <p className="metric-subtext">Inclui lazer, vestuário e extras. Ajuste conforme sua persona.</p>
            </article>
          </div>
        </footer>
        )}
        </div>
      )}
    </section>
  )
}

RecommendationPanel.propTypes = {
  recommendations: PropTypes.shape({
    quickWins: PropTypes.array,
    expenseCuts: PropTypes.array,
    strategicMoves: PropTypes.array,
    riskMitigation: PropTypes.array,
    persona: PropTypes.object,
    benchmark: PropTypes.object,
    kpis: PropTypes.object
  }),
  aiAdvice: PropTypes.shape({
    highlight: PropTypes.string,
    message: PropTypes.string,
    targetRunway: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    rationale: PropTypes.string
  }),
  tourId: PropTypes.string
}
