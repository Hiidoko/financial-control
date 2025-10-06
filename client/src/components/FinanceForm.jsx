import PropTypes from 'prop-types'

const fieldConfig = [
  { key: 'monthlyIncome', label: 'Renda mensal (R$)', step: 100, min: 0 },
  { key: 'monthlyExpenses', label: 'Gastos mensais (R$)', step: 100, min: 0 },
  { key: 'currentSavings', label: 'Patrimônio atual (R$)', step: 100, min: 0 },
  { key: 'goalAmount', label: 'Meta financeira (R$)', step: 1000, min: 0 },
  { key: 'goalYears', label: 'Horizonte (anos)', step: 1, min: 1 },
  { key: 'expectedReturnRate', label: 'Retorno anual (%)', step: 0.5, min: -10, max: 25 },
  { key: 'inflationRate', label: 'Inflação anual (%)', step: 0.5, min: 0, max: 20 },
  { key: 'additionalContribution', label: 'Aporte extra mensal (R$)', step: 50, min: 0 },
  { key: 'riskTolerance', label: 'Tolerância ao risco (1-5)', step: 1, min: 1, max: 5 }
]

export function FinanceForm ({ data, expenses, onChange, onExpenseChange, onAddExpense, onRemoveExpense, onSubmit, isLoading, tourId }) {
  return (
    <section className="panel" data-tour={tourId}>
      <header className="panel-header">
        <h2 className="panel-title">Perfil financeiro</h2>
        <p className="panel-subtitle">Preencha seus dados para gerar projeções personalizadas.</p>
      </header>

      <form className="stack-space" onSubmit={(event) => {
        event.preventDefault()
        onSubmit()
      }}>
        <div className="form-grid" data-tour="form-inputs">
          {fieldConfig.map((field) => (
            <label key={field.key} className="input-field">
              <span className="input-label">{field.label}</span>
              <input
                type="number"
                className="input-control"
                value={data[field.key]}
                min={field.min}
                max={field.max}
                step={field.step}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            </label>
          ))}
        </div>

        <div>
          <div className="flex-between" data-tour="expenses-breakdown">
            <h3 className="section-title">Divisão dos gastos</h3>
            <button type="button" className="button-ghost" onClick={onAddExpense}>
              adicionar categoria
            </button>
          </div>

          <div className="expense-list">
            {expenses.map((item, index) => (
              <div key={`${item.category}-${index}`} className="expense-item">
                <input
                  type="text"
                  className="input-control"
                  value={item.category}
                  onChange={(event) => onExpenseChange(index, 'category', event.target.value)}
                />
                <input
                  type="number"
                  className="input-control"
                  value={item.amount}
                  min={0}
                  step={50}
                  onChange={(event) => onExpenseChange(index, 'amount', event.target.value)}
                />
                <button
                  type="button"
                  className="button-ghost button-danger"
                  onClick={() => onRemoveExpense(index)}
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="button-primary">
          {isLoading ? 'Calculando projeções...' : 'Gerar simulação'}
        </button>
      </form>
    </section>
  )
}

FinanceForm.propTypes = {
  data: PropTypes.object.isRequired,
  expenses: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onExpenseChange: PropTypes.func.isRequired,
  onAddExpense: PropTypes.func.isRequired,
  onRemoveExpense: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  tourId: PropTypes.string
}
