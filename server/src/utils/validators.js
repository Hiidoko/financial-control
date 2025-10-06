import { z } from 'zod'

export const expenseItemSchema = z.object({
  category: z.string().min(1, 'Categoria obrigatória'),
  amount: z.number().min(0)
})

const scenarioSchema = z.object({
  incomeGrowthRate: z.number().min(-50).max(50),
  expenseGrowthRate: z.number().min(-50).max(50),
  jobLossMonths: z.number().int().min(0).max(12),
  unexpectedExpense: z.number().min(0),
  oneTimeExtraIncome: z.number().min(0),
  lifestyleInflation: z.number().min(0).max(30)
})

const stressTestsSchema = z.object({
  marketCrashDrop: z.number().min(0).max(80),
  inflationSpike: z.number().min(0).max(30)
})

export const simulationInputSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  currentSavings: z.number().nonnegative(),
  goalAmount: z.number().nonnegative(),
  goalYears: z.number().int().min(1).max(50),
  expectedReturnRate: z.number().min(-50).max(50),
  inflationRate: z.number().min(-10).max(30),
  additionalContribution: z.number().min(0),
  riskTolerance: z.number().min(1).max(5),
  expensesBreakdown: z.array(expenseItemSchema).max(10).optional().default([]),
  scenario: scenarioSchema,
  stressTests: stressTestsSchema.optional().default({
    marketCrashDrop: 20,
    inflationSpike: 5
  })
})

export function parseSimulationInput (payload) {
  return simulationInputSchema.parse(payload)
}
