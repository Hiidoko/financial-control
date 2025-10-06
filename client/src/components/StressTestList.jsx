import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'

export function StressTestList ({ stressTests, goalAmount }) {
  if (!stressTests || stressTests.length === 0) return null

  return (
    <section className="panel">
      <header className="panel-header">
        <h2 className="panel-title">Testes de estresse</h2>
        <p className="panel-subtitle">Veja como o plano responde a choques de mercado e inflação.</p>
      </header>

      <div className="recommendation-list">
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
                ? 'Mesmo com o choque, a meta permanece viável.'
                : `A meta de ${formatCurrency(goalAmount)} ficaria comprometida.`}
            </p>
          </article>
        ))}
      </div>
    </section>
  )
}

StressTestList.propTypes = {
  stressTests: PropTypes.array,
  goalAmount: PropTypes.number
}
