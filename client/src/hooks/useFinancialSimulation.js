import { useCallback, useEffect, useMemo, useState } from 'react'

import { runSimulation } from '../services/api.js'
import { decryptShareFragment, extractShareFragment } from '../utils/exporters.js'

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

const HISTORY_STORAGE_KEY = 'ffs:history'
const MAX_HISTORY_ENTRIES = 15

export function useFinancialSimulation () {
  const [financialData, setFinancialData] = useState(defaultForm)
  const [scenario, setScenario] = useState(defaultScenario)
  const [expensesBreakdown, setExpensesBreakdown] = useState(defaultExpenses)
  const [goals, setGoals] = useState(defaultGoals)
  const [taxes, setTaxes] = useState(defaultTaxes)
  const [annualBonuses, setAnnualBonuses] = useState(defaultAnnualBonuses)
  const [history, setHistory] = useState(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch (error) {
      console.warn('Não foi possível carregar histórico de simulações', error)
      return []
    }
  })

  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const toPersist = history.slice(0, MAX_HISTORY_ENTRIES)
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(toPersist))
    } catch (err) {
      console.warn('Não foi possível salvar histórico de simulações', err)
    }
  }, [history])

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

      const payloadClone = JSON.parse(JSON.stringify(payload))
      const entry = {
        id: `sim-${Date.now()}`,
        timestamp: Date.now(),
        label: `Simulação ${new Date().toLocaleString('pt-BR')}`,
        payload: payloadClone,
        summary: data.simulation?.summary ?? null,
        scenarios: data.simulation?.scenarios ?? [],
        stressTests: data.simulation?.stressTests ?? [],
        recommendations: data.recommendations ?? null,
        comment: ''
      }

      setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES))
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [payload])

  const applyPayload = useCallback((data) => {
    if (!data) return

    setFinancialData({
      monthlyIncome: Number(data.monthlyIncome ?? defaultForm.monthlyIncome),
      monthlyExpenses: Number(data.monthlyExpenses ?? defaultForm.monthlyExpenses),
      currentSavings: Number(data.currentSavings ?? defaultForm.currentSavings),
      expectedReturnRate: Number(data.expectedReturnRate ?? defaultForm.expectedReturnRate),
      inflationRate: Number(data.inflationRate ?? defaultForm.inflationRate),
      additionalContribution: Number(data.additionalContribution ?? defaultForm.additionalContribution),
      riskTolerance: Number(data.riskTolerance ?? defaultForm.riskTolerance)
    })

    setScenario({
      ...defaultScenario,
      ...Object.fromEntries(Object.entries(data.scenario ?? {}).map(([key, value]) => [key, Number(value ?? defaultScenario[key])]))
    })

    setExpensesBreakdown((data.expensesBreakdown && data.expensesBreakdown.length > 0)
      ? data.expensesBreakdown.map((item, index) => ({
          category: item.category || `Categoria ${index + 1}`,
          amount: Number(item.amount ?? 0)
        }))
      : defaultExpenses)

    setGoals((data.goals && data.goals.length > 0)
      ? data.goals.map((goal, index) => ({
          id: goal.id || `goal-${Date.now()}-${index}`,
          name: goal.name || `Meta ${index + 1}`,
          amount: Number(goal.amount ?? 0),
          targetYears: Number(goal.targetYears ?? 1),
          priority: goal.priority || 'media'
        }))
      : defaultGoals)

    setTaxes({
      ...defaultTaxes,
      ...(data.taxes || {})
    })

    setAnnualBonuses((data.annualBonuses && data.annualBonuses.length > 0)
      ? data.annualBonuses.map((bonus, index) => ({
          id: bonus.id || `bonus-${Date.now()}-${index}`,
          label: bonus.label || `Bônus ${index + 1}`,
          month: Number(bonus.month ?? 12),
          amount: Number(bonus.amount ?? 0)
        }))
      : defaultAnnualBonuses)
  }, [])

  const updateHistoryComment = useCallback((historyId, comment) => {
    setHistory((prev) => prev.map((entry) => (
      entry.id === historyId
        ? { ...entry, comment }
        : entry
    )))
  }, [])

  const restoreSimulation = useCallback((historyId, { autoRun = false } = {}) => {
    const entry = history.find((item) => item.id === historyId)
    if (!entry) return
    applyPayload(entry.payload)
    if (autoRun) {
      setTimeout(() => {
        submit()
      }, 150)
    }
  }, [history, applyPayload, submit])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const fragment = extractShareFragment()
    if (!fragment) return

    const handleShareImport = async () => {
      try {
        const password = window.prompt('Informe a senha do plano compartilhado:')
        if (!password) return
        const shared = await decryptShareFragment(fragment, password)
        if (shared?.payload) {
          applyPayload(shared.payload)
          window.setTimeout(() => {
            submit()
          }, 200)
          window.alert('Plano compartilhado importado! Rodando simulação atualizada...')
        }
      } catch (err) {
        console.error('Falha ao importar plano compartilhado', err)
        window.alert('Não foi possível importar o plano. Verifique a senha ou gere um novo link.')
      } finally {
        window.location.hash = ''
      }
    }

    handleShareImport()
  }, [applyPayload, submit])

  return {
    financialData,
    scenario,
    expensesBreakdown,
    goals,
    taxes,
    annualBonuses,
  history,
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
    updateHistoryComment,
    restoreSimulation,
    submit
  }
}
