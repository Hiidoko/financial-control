import { useCallback, useMemo, useState } from 'react'

import { runSimulation } from '../services/api.js'

const defaultExpenses = [
  { category: 'Moradia', amount: 2500 },
  { category: 'Alimentação', amount: 1200 },
  { category: 'Transporte', amount: 600 }
]

const defaultScenario = {
  incomeGrowthRate: 3,
  expenseGrowthRate: 2,
  jobLossMonths: 2,
  unexpectedExpense: 8000,
  oneTimeExtraIncome: 5000,
  lifestyleInflation: 1
}

const defaultGoals = [
  { id: 'goal-1', name: 'Aposentadoria', amount: 300000, targetYears: 15, priority: 'alta' },
  { id: 'goal-2', name: 'Viagem dos sonhos', amount: 40000, targetYears: 4, priority: 'media' }
]

const defaultForm = {
  monthlyIncome: 9000,
  monthlyExpenses: 5800,
  currentSavings: 18000,
  expectedReturnRate: 8,
  inflationRate: 4.5,
  additionalContribution: 400,
  riskTolerance: 3
}

const defaultTaxes = {
  incomeTaxRate: 12,
  investmentTaxRate: 15
}

const defaultAnnualBonuses = [
  { id: 'bonus-13', label: '13º salário', month: 12, amount: defaultForm.monthlyIncome },
  { id: 'bonus-plr', label: 'PLR', month: 3, amount: defaultForm.monthlyIncome * 0.6 }
]

export function useFinancialSimulation () {
  const [financialData, setFinancialData] = useState(defaultForm)
  const [scenario, setScenario] = useState(defaultScenario)
  const [expensesBreakdown, setExpensesBreakdown] = useState(defaultExpenses)
  const [goals, setGoals] = useState(defaultGoals)
  const [taxes, setTaxes] = useState(defaultTaxes)
  const [annualBonuses, setAnnualBonuses] = useState(defaultAnnualBonuses)

  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const updateFinancialData = useCallback((field, value) => {
    setFinancialData((prev) => ({
      ...prev,
      [field]: Number(value)
    }))
  }, [])

  const updateScenario = useCallback((field, value) => {
    setScenario((prev) => ({
      ...prev,
      [field]: Number(value)
    }))
  }, [])

  const updateExpense = useCallback((index, field, value) => {
    setExpensesBreakdown((prev) => prev.map((item, i) => (
      i === index
        ? { ...item, [field]: field === 'amount' ? Number(value) : value }
        : item
    )))
  }, [])

  const addExpense = useCallback(() => {
    setExpensesBreakdown((prev) => ([
      ...prev,
      { category: 'Novo gasto', amount: 0 }
    ]))
  }, [])

  const removeExpense = useCallback((index) => {
    setExpensesBreakdown((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const updateGoal = useCallback((goalId, field, value) => {
    setGoals((prev) => prev.map((goal) => (
      goal.id === goalId
        ? { ...goal, [field]: field === 'amount' ? Number(value) : field === 'targetYears' ? Number(value) : value }
        : goal
    )))
  }, [])

  const addGoal = useCallback(() => {
    setGoals((prev) => ([
      ...prev,
      {
        id: `goal-${Date.now()}`,
        name: 'Nova meta',
        amount: 20000,
        targetYears: 3,
        priority: 'media'
      }
    ]))
  }, [])

  const removeGoal = useCallback((goalId) => {
    setGoals((prev) => (prev.length > 1 ? prev.filter((goal) => goal.id !== goalId) : prev))
  }, [])

  const updateTax = useCallback((field, value) => {
    setTaxes((prev) => ({
      ...prev,
      [field]: Number(value)
    }))
  }, [])

  const updateAnnualBonus = useCallback((bonusId, field, value) => {
    setAnnualBonuses((prev) => prev.map((bonus) => (
      bonus.id === bonusId
        ? {
            ...bonus,
            [field]: field === 'month' ? Number(value) : field === 'amount' ? Number(value) : value
          }
        : bonus
    )))
  }, [])

  const addAnnualBonus = useCallback(() => {
    setAnnualBonuses((prev) => ([
      ...prev,
      {
        id: `bonus-${Date.now()}`,
        label: 'Novo bônus',
        month: 1,
        amount: 0
      }
    ]))
  }, [])

  const removeAnnualBonus = useCallback((bonusId) => {
    setAnnualBonuses((prev) => prev.filter((bonus) => bonus.id !== bonusId))
  }, [])

  const payload = useMemo(() => ({
    ...financialData,
    expensesBreakdown,
    scenario,
    goals,
    taxes,
    annualBonuses
  }), [financialData, expensesBreakdown, scenario, goals, taxes, annualBonuses])

  const submit = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await runSimulation(payload)
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [payload])

  return {
    financialData,
    scenario,
    expensesBreakdown,
    goals,
    taxes,
    annualBonuses,
    results,
    isLoading,
    error,
    payload,
    updateFinancialData,
    updateScenario,
    updateExpense,
    addExpense,
    removeExpense,
    updateGoal,
    addGoal,
    removeGoal,
    updateTax,
    updateAnnualBonus,
    addAnnualBonus,
    removeAnnualBonus,
    submit
  }
}
