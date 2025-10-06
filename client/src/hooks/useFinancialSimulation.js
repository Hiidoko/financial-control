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

const defaultForm = {
  monthlyIncome: 9000,
  monthlyExpenses: 5800,
  currentSavings: 18000,
  goalAmount: 250000,
  goalYears: 6,
  expectedReturnRate: 8,
  inflationRate: 4.5,
  additionalContribution: 400,
  riskTolerance: 3
}

export function useFinancialSimulation () {
  const [financialData, setFinancialData] = useState(defaultForm)
  const [scenario, setScenario] = useState(defaultScenario)
  const [expensesBreakdown, setExpensesBreakdown] = useState(defaultExpenses)

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

  const payload = useMemo(() => ({
    ...financialData,
    expensesBreakdown,
    scenario
  }), [financialData, expensesBreakdown, scenario])

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
    results,
    isLoading,
    error,
    payload,
    updateFinancialData,
    updateScenario,
    updateExpense,
    addExpense,
    removeExpense,
    submit
  }
}
