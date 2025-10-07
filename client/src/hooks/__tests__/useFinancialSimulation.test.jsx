import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest'

const runSimulationMock = vi.fn()

vi.mock('@/services/api.js', () => ({
  runSimulation: runSimulationMock
}))

let useFinancialSimulation

beforeAll(async () => {
  ({ useFinancialSimulation } = await import('../useFinancialSimulation.js'))
})

const mockSimulationResult = {
  input: {
    monthlyIncome: 9000,
    monthlyExpenses: 5800,
    currentSavings: 18000,
    expectedReturnRate: 8,
    inflationRate: 4.5,
    additionalContribution: 400,
    riskTolerance: 3,
    scenario: {
      incomeGrowthRate: 3,
      expenseGrowthRate: 2,
      jobLossMonths: 2,
      unexpectedExpense: 8000,
      oneTimeExtraIncome: 5000,
      lifestyleInflation: 1
    }
  },
  simulation: {
    scenarios: [
      {
        id: 'baseline',
        label: 'Base',
        color: '#2563eb',
        timeline: [
          {
            month: 1,
            year: 1,
            income: 9000,
            expenses: 5800,
            contribution: 600,
            returns: 120,
            balance: 18720,
            realBalance: 18500,
            emergencyCoverage: 1.4
          }
        ],
        summary: {
          finalBalance: 18720,
          finalRealBalance: 18500,
          totalContributed: 600,
          totalReturns: 120,
          goals: [
            {
              id: 'goal-1',
              name: 'Reserva de emergência',
              priority: 'alta',
              targetAmount: 40000,
              targetMonth: 36,
              targetYear: 3,
              achieved: false,
              achievedWithinTarget: false,
              achievedMonth: null,
              balanceAtTarget: 25000,
              shortfall: 15000,
              completionRatio: 0.62
            }
          ],
          goalsAchievedCount: 0,
          emergencyCoverageTimeline: []
        }
      }
    ],
    summary: {
      goals: [
        {
          id: 'goal-1',
          name: 'Reserva de emergência',
          priority: 'alta',
          targetAmount: 40000,
          targetMonth: 36,
          shortfall: 15000,
          completionRatio: 0.62,
          additionalMonthlyContribution: 420,
          projectedAchievementMonth: 48,
          projectedAchievementYear: 4,
          achievedBaseline: false,
          achievedOptimistic: false,
          achievedPessimistic: false
        }
      ],
      baseline: {
        finalBalance: 18720,
        finalRealBalance: 18500,
        totalContributed: 600,
        totalReturns: 120,
        goals: [
          {
            id: 'goal-1',
            name: 'Reserva de emergência',
            priority: 'alta',
            targetAmount: 40000,
            targetMonth: 36,
            targetYear: 3,
            achieved: false,
            achievedWithinTarget: false,
            achievedMonth: null,
            projectedAchievementMonth: 48,
            projectedAchievementYear: 4,
            balanceAtTarget: 25000,
            shortfall: 15000,
            completionRatio: 0.62
          }
        ],
        goalsAchievedCount: 0,
        emergencyCoverageTimeline: []
      },
      optimistic: {
        finalBalance: 21000,
        finalRealBalance: 20500,
        totalContributed: 800,
        totalReturns: 200,
        goals: []
      },
      pessimistic: {
        finalBalance: 16000,
        finalRealBalance: 15800,
        totalContributed: 500,
        totalReturns: 80,
        goals: []
      },
      savingsRate: 0.24,
      emergencyFundTarget: 17400,
      emergencyFundGap: 0,
      emergencyFundCoverage: 1,
      financialIndependenceIndex: 1.4,
      shortfallProbability: 0.18,
      monteCarloIterations: 200
    },
    stressTests: []
  },
  recommendations: {
    persona: {
      name: 'Construtor disciplinado'
    },
    actions: []
  }
}

describe('useFinancialSimulation hook', () => {
  beforeEach(() => {
    runSimulationMock.mockReset()
    runSimulationMock.mockResolvedValue(mockSimulationResult)
  })

  it('usa o mock de runSimulation corretamente', async () => {
  const { runSimulation } = await import('@/services/api.js')
    await runSimulation({ foo: 'bar' })
    expect(runSimulationMock).toHaveBeenCalledTimes(1)
  })

  it('carrega resultados iniciais e armazena histórico', async () => {
    const { result } = renderHook(() => useFinancialSimulation())

    await act(async () => {
      await result.current.submit()
    })

    await waitFor(() => {
      expect(runSimulationMock).toHaveBeenCalled()
      expect(result.current.history.length).toBeGreaterThan(0)
    })

    expect(result.current.results).toEqual(mockSimulationResult)

    const [entry] = result.current.history
    act(() => {
      result.current.updateHistoryComment(entry.id, 'Primeiras impressões')
    })

    expect(result.current.history[0].comment).toBe('Primeiras impressões')
  })

  it('restaura uma simulação do histórico', async () => {
    const { result } = renderHook(() => useFinancialSimulation())

    await act(async () => {
      await result.current.submit()
    })

    await waitFor(() => {
      expect(result.current.history.length).toBeGreaterThan(0)
    })

    const originalHistoryEntry = result.current.history[0]

    act(() => {
      result.current.updateFinancialData('monthlyIncome', 12500)
    })
    expect(result.current.financialData.monthlyIncome).toBe(12500)

    act(() => {
      result.current.restoreSimulation(originalHistoryEntry.id)
    })

    await waitFor(() => {
      expect(result.current.financialData.monthlyIncome).toBe(originalHistoryEntry.payload.monthlyIncome)
    })
  })
})
