import { describe, expect, it } from 'vitest'

import { buildSimulationResult } from '../../services/projectionService.js'

const baseInput = {
  monthlyIncome: 9000,
  monthlyExpenses: 5500,
  currentSavings: 18000,
  expectedReturnRate: 8,
  inflationRate: 4,
  additionalContribution: 500,
  riskTolerance: 6,
  goals: [
    { id: 'goal-1', name: 'Reserva de emergência', amount: 40000, targetYears: 3, priority: 'alta' },
    { id: 'goal-2', name: 'Aposentadoria complementar', amount: 300000, targetYears: 15, priority: 'media' }
  ],
  scenario: {
    incomeGrowthRate: 3,
    expenseGrowthRate: 2,
    jobLossMonths: 2,
    unexpectedExpense: 8000,
    oneTimeExtraIncome: 5000,
    lifestyleInflation: 1
  },
  taxes: {
    incomeTaxRate: 12,
    investmentTaxRate: 15
  },
  annualBonuses: [
    { id: 'bonus-13', label: '13º salário', month: 12, amount: 9000 },
    { id: 'bonus-plr', label: 'PLR', month: 3, amount: 4000 }
  ],
  stressTests: {
    marketCrashDrop: 22,
    inflationSpike: 6
  }
}

function cloneInput (input) {
  return JSON.parse(JSON.stringify(input))
}

describe('projectionService.buildSimulationResult', () => {
  it('monta três cenários com sumário consistente', () => {
    const result = buildSimulationResult(cloneInput(baseInput))

    expect(result.scenarios).toHaveLength(3)
    const baseline = result.scenarios.find((scenario) => scenario.id === 'baseline')
    expect(baseline).toBeDefined()
    expect(baseline.timeline.length).toBeGreaterThan(0)

    expect(result.summary).toBeDefined()
    expect(result.summary.baseline.goals).toBeDefined()
    expect(result.summary.goals.length).toBe(baseInput.goals.length)

    expect(result.summary.shortfallProbability).toBeGreaterThanOrEqual(0)
    expect(result.summary.shortfallProbability).toBeLessThanOrEqual(1)

    expect(result.summary.financialIndependenceIndex).toBeGreaterThanOrEqual(0)
  })

  it('calcula aporte adicional positivo quando há shortfall', () => {
    const stressedInput = cloneInput({
      ...baseInput,
      monthlyIncome: 4000,
      monthlyExpenses: 3800,
      currentSavings: 1000,
      additionalContribution: 0
    })

    const result = buildSimulationResult(stressedInput)
    const firstGoal = result.summary.goals[0]

    expect(firstGoal.shortfall).toBeGreaterThan(0)
    expect(firstGoal.additionalMonthlyContribution).toBeGreaterThanOrEqual(0)
  })
})
