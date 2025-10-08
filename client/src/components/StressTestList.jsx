import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'
import { CollapseToggle } from './CollapseToggle.jsx'
import { usePanelCollapse, useAnimatedCollapse } from '@/hooks/usePanelCollapse.js'

export function StressTestList ({ stressTests }) {
  if (!stressTests || stressTests.length === 0) return null
  const { collapsed, toggle, contentId, shouldRender, onAnimationEnd } = usePanelCollapse('stress-tests', false)
  const contentRef = useAnimatedCollapse(collapsed, onAnimationEnd)
  return (
    <section className="panel">
      <header className="panel-header panel-header--with-toggle">
        <h2 className="panel-title">Testes de estresse</h2>
        {!collapsed && <p className="panel-subtitle">Veja como o plano responde a choques de mercado e inflação.</p>}
        <CollapseToggle
          collapsed={collapsed}
          onToggle={toggle}
          labelCollapse="Recolher testes"
          labelExpand="Expandir testes"
          size="sm"
          controls={contentId}
        />
      </header>
      {shouldRender && (
        <div
          ref={contentRef}
          id={contentId}
          className="collapsible-content-wrapper collapsible-fade recommendation-list"
          aria-hidden={collapsed}
        >
          {stressTests.map((test) => (
            <article key={test.id} className="recommendation-card">
              <h4>{test.label}</h4>
              {test.finalBalanceAfterShock && (
                <p>
                  Saldo projetado após choque: <strong>{formatCurrency(test.finalBalanceAfterShock)}</strong>
                </p>
              )}
              {test.realBalanceAfterShock && (
                <p>
                  Poder de compra em 5 anos: <strong>{formatCurrency(test.realBalanceAfterShock)}</strong>
                </p>
              )}
              <p className={test.goalStillAchieved ? 'text-success' : 'text-danger'}>
                {test.goalStillAchieved
                  ? test.focusGoalName
                    ? `Mesmo com o choque, a meta prioritária "${test.focusGoalName}" permanece viável.`
                    : 'Mesmo com o choque, o plano se mantém resiliente.'
                  : test.focusGoalName
                    ? `A meta prioritária "${test.focusGoalName}" ficaria comprometida.`
                    : 'Os choques impactam o alcance das metas.'}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

StressTestList.propTypes = {
  stressTests: PropTypes.array
}
