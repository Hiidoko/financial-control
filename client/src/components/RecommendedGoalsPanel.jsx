import PropTypes from 'prop-types'

import { formatCurrency } from '@/utils/formatters.js'

export function RecommendedGoalsPanel ({ goals, onAdoptGoal }) {
  if (!goals || goals.length === 0) {
    return null
  }

  return (
    <section className="panel panel-recommended-goals">
      <header className="panel-header">
        <div>
          <h3 className="panel-title">Metas recomendadas automaticamente</h3>
          <p className="panel-subtitle">Geradas a partir da sua renda, gastos e fase de vida para acelerar conquistas prioritárias.</p>
        </div>
      </header>

      <ul className="recommended-goals__list">
        {goals.map((goal) => (
          <li key={goal.id ?? goal.name} className="recommended-goals__item">
            <div>
              <h4>{goal.name}</h4>
              <p>{goal.description}</p>
              <span className="recommended-goals__tag">Prioridade: {goal.priority ?? 'media'}</span>
            </div>
            <div className="recommended-goals__meta">
              <strong>{formatCurrency(goal.amount)}</strong>
              <span>{goal.targetYears} anos · {goal.category ?? 'Planejamento'}</span>
              {onAdoptGoal && (
                <button type="button" className="button-ghost" onClick={() => onAdoptGoal(goal)}>
                  Incorporar ao meu plano
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

RecommendedGoalsPanel.propTypes = {
  goals: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    description: PropTypes.string,
    amount: PropTypes.number,
    targetYears: PropTypes.number,
    priority: PropTypes.string,
    category: PropTypes.string
  })),
  onAdoptGoal: PropTypes.func
}

RecommendedGoalsPanel.defaultProps = {
  goals: [],
  onAdoptGoal: null
}
