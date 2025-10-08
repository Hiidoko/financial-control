import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'
import { CollapseToggle } from './CollapseToggle.jsx'
import { usePanelCollapse, useAnimatedCollapse } from '@/hooks/usePanelCollapse.js'

export function ScenarioSummary ({ scenarios }) {
  if (!scenarios || scenarios.length === 0) return null
  const { collapsed, toggle, contentId, shouldRender, onAnimationEnd } = usePanelCollapse('scenario-summary', false)
  const contentRef = useAnimatedCollapse(collapsed, onAnimationEnd)
  return (
    <section className="panel">
      <header className="panel-header panel-header--with-toggle">
        <h2 className="panel-title">Comparativo de cenários</h2>
        {!collapsed && <p className="panel-subtitle">Como o plano se comporta em diferentes condições.</p>}
        <CollapseToggle
          collapsed={collapsed}
          onToggle={toggle}
          labelCollapse="Recolher comparativo"
          labelExpand="Expandir comparativo"
          size="sm"
          controls={contentId}
        />
      </header>
      {shouldRender && (
        <div
          ref={contentRef}
          id={contentId}
          className="collapsible-content-wrapper collapsible-fade"
          aria-hidden={collapsed}
        >
          <div className="metrics-grid">
            {scenarios.map((scenario) => (
              <article key={scenario.id} className="metric-box">
                <div className="metric-label" style={{ color: scenario.color }}>{scenario.label}</div>
                <div className="metric-value">{formatCurrency(scenario.summary.finalBalance)}</div>
                <p className="metric-subtext">
                  {(() => {
                    const totalGoals = scenario.summary.goals?.length ?? 0
                    const achievedGoals = scenario.summary.goalsAchievedCount ?? 0
                    if (totalGoals === 0) return 'Cadastre metas para acompanhar este cenário.'
                    if (achievedGoals === totalGoals) {
                      return 'Todas as metas alcançadas dentro do horizonte.'
                    }
                    const nextPending = scenario.summary.goals?.find((goal) => !goal.achieved)
                    if (nextPending) {
                      const years = Math.ceil((nextPending.targetMonth ?? 12) / 12)
                      return `Falta ${formatCurrency(nextPending.shortfall ?? 0)} para "${nextPending.name}" até o ${years}º ano.`
                    }
                    return 'Reavalie aportes e prioridades para atingir todas as metas.'
                  })()}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

ScenarioSummary.propTypes = {
  scenarios: PropTypes.array
}
