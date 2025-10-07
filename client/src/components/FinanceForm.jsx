import PropTypes from 'prop-types'

const fieldConfig = [
  { key: 'monthlyIncome', label: 'Renda mensal (R$)', step: 100, min: 0 },
  { key: 'monthlyExpenses', label: 'Gastos mensais (R$)', step: 100, min: 0 },
  { key: 'currentSavings', label: 'Patrimônio atual (R$)', step: 100, min: 0 },
  { key: 'expectedReturnRate', label: 'Retorno anual (%)', step: 0.5, min: -10, max: 25 },
  { key: 'inflationRate', label: 'Inflação anual (%)', step: 0.5, min: 0, max: 20 },
  { key: 'additionalContribution', label: 'Aporte extra mensal (R$)', step: 50, min: 0 },
  { key: 'riskTolerance', label: 'Tolerância ao risco (1-5)', step: 1, min: 1, max: 5 }
]

const priorityOptions = [
  { value: 'alta', label: 'Alta' },
  { value: 'media', label: 'Média' },
  { value: 'baixa', label: 'Baixa' }
]

export function FinanceForm ({
  data,
  goals,
  expenses,
  taxes,
  annualBonuses,
  onChange,
  onGoalChange,
  onAddGoal,
  onRemoveGoal,
  onExpenseChange,
  onAddExpense,
  onRemoveExpense,
  onTaxChange,
  onBonusChange,
  onAddBonus,
  onRemoveBonus,
  onSubmit,
  isLoading,
  tourId
}) {
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
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h3 className="section-title">Metas financeiras</h3>
            <button type="button" className="button-ghost" onClick={onAddGoal}>
              adicionar meta
            </button>
          </div>

          <div className="goal-list">
            {goals.map((goal) => (
              <div key={goal.id} className="goal-item">
                <input
                  type="text"
                  className="input-control"
                  value={goal.name}
                  onChange={(event) => onGoalChange(goal.id, 'name', event.target.value)}
                  placeholder="Nome da meta"
                />
                <input
                  type="number"
                  className="input-control"
                  value={goal.amount}
                  min={1000}
                  step={1000}
                  onChange={(event) => onGoalChange(goal.id, 'amount', event.target.value)}
                  placeholder="Valor alvo"
                />
                <input
                  type="number"
                  className="input-control"
                  value={goal.targetYears}
                  min={1}
                  max={50}
                  step={1}
                  onChange={(event) => onGoalChange(goal.id, 'targetYears', event.target.value)}
                  placeholder="Horizonte (anos)"
                />
                <select
                  className="input-control"
                  value={goal.priority}
                  onChange={(event) => onGoalChange(goal.id, 'priority', event.target.value)}
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="button-ghost button-danger"
                  onClick={() => onRemoveGoal(goal.id)}
                  disabled={goals.length <= 1}
                >
                  remover
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="section-title">Tributação</h3>
          <div className="form-grid" style={{ marginTop: '12px' }}>
            <label className="input-field">
              <span className="input-label">Imposto sobre renda (%)</span>
              <input
                type="number"
                className="input-control"
                value={taxes.incomeTaxRate}
                min={0}
                max={40}
                step={0.5}
                onChange={(event) => onTaxChange('incomeTaxRate', event.target.value)}
              />
            </label>
            <label className="input-field">
              <span className="input-label">Imposto sobre investimentos (%)</span>
              <input
                type="number"
                className="input-control"
                value={taxes.investmentTaxRate}
                min={0}
                max={30}
                step={0.5}
                onChange={(event) => onTaxChange('investmentTaxRate', event.target.value)}
              />
            </label>
          </div>
        </div>

        <div>
          <div className="flex-between" style={{ marginBottom: '12px' }}>
            <h3 className="section-title">Bonificações anuais</h3>
            <button type="button" className="button-ghost" onClick={onAddBonus}>
              adicionar bônus
            </button>
          </div>

          <div className="expense-list">
            {annualBonuses.map((bonus) => (
              <div key={bonus.id} className="expense-item">
                <input
                  type="text"
                  className="input-control"
                  value={bonus.label}
                  onChange={(event) => onBonusChange(bonus.id, 'label', event.target.value)}
                  placeholder="Descrição"
                />
                <input
                  type="number"
                  className="input-control"
                  value={bonus.month}
                  min={1}
                  max={12}
                  step={1}
                  onChange={(event) => onBonusChange(bonus.id, 'month', event.target.value)}
                  placeholder="Mês"
                />
                <input
                  type="number"
                  className="input-control"
                  value={bonus.amount}
                  min={0}
                  step={100}
                  onChange={(event) => onBonusChange(bonus.id, 'amount', event.target.value)}
                  placeholder="Valor (R$)"
                />
                <button
                  type="button"
                  className="button-ghost button-danger"
                  onClick={() => onRemoveBonus(bonus.id)}
                >
                  remover
                </button>
              </div>
            ))}
          </div>
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
  goals: PropTypes.array.isRequired,
  expenses: PropTypes.array.isRequired,
  taxes: PropTypes.object.isRequired,
  annualBonuses: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  onGoalChange: PropTypes.func.isRequired,
  onAddGoal: PropTypes.func.isRequired,
  onRemoveGoal: PropTypes.func.isRequired,
  onExpenseChange: PropTypes.func.isRequired,
  onAddExpense: PropTypes.func.isRequired,
  onRemoveExpense: PropTypes.func.isRequired,
  onTaxChange: PropTypes.func.isRequired,
  onBonusChange: PropTypes.func.isRequired,
  onAddBonus: PropTypes.func.isRequired,
  onRemoveBonus: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  tourId: PropTypes.string
}
