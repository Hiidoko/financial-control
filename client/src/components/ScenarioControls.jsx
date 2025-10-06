import PropTypes from 'prop-types'
import { formatCurrency } from '../utils/formatters.js'

const sliderConfig = [
  {
    key: 'incomeGrowthRate',
    label: 'Crescimento anual da renda',
    min: -10,
    max: 20,
    step: 0.5,
    unit: '%',
    description: 'Projeta promoções ou aumento como autônomo.'
  },
  {
    key: 'expenseGrowthRate',
    label: 'Crescimento anual dos gastos',
    min: -10,
    max: 20,
    step: 0.5,
    unit: '%',
    description: 'Inflação do estilo de vida e reajustes contratuais.'
  },
  {
    key: 'jobLossMonths',
    label: 'Meses sem renda (demissão)',
    min: 0,
    max: 6,
    step: 1,
    unit: 'mês(es)',
    description: 'Cenário de perda temporária de emprego.'
  },
  {
    key: 'unexpectedExpense',
    label: 'Despesa inesperada',
    min: 0,
    max: 40000,
    step: 500,
    formatValue: formatCurrency,
    description: 'Um evento pontual como reforma ou manutenção.'
  },
  {
    key: 'oneTimeExtraIncome',
    label: 'Receita extra pontual',
    min: 0,
    max: 40000,
    step: 500,
    formatValue: formatCurrency,
    description: 'Bônus, participação nos lucros ou freelas.'
  },
  {
    key: 'lifestyleInflation',
    label: 'Inflação do estilo de vida',
    min: 0,
    max: 8,
    step: 0.5,
    unit: '%',
    description: 'Quanto seus gastos sobem conforme renda aumenta.'
  }
]

export function ScenarioControls ({ scenario, onChange }) {
  return (
    <section className="panel">
      <header className="panel-header flex-between">
        <div>
          <h2 className="panel-title">Cenários inteligentes</h2>
          <p className="panel-subtitle">Ajuste os controles para simular choques de renda, gastos e oportunidades.</p>
        </div>
      </header>

      <div className="stack-space">
        {sliderConfig.map((slider) => {
          const value = scenario[slider.key]
          const formattedValue = slider.formatValue
            ? slider.formatValue(value)
            : `${value}${slider.unit ? slider.unit : ''}`

          return (
            <div key={slider.key}>
              <div className="flex-between">
                <div>
                  <h3 className="section-title">{slider.label}</h3>
                  <p className="text-muted">{slider.description}</p>
                </div>
                <span className="tag">{formattedValue}</span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={value}
                className="scenario-slider"
                onChange={(event) => onChange(slider.key, event.target.value)}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

ScenarioControls.propTypes = {
  scenario: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
}
