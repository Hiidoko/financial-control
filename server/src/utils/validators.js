import { z } from 'zod'

export const expenseItemSchema = z.object({
  category: z.string().min(1, 'Categoria obrigatória'),
  amount: z.number().min(0)
})

const goalSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, 'Nome da meta obrigatório'),
  amount: z.number().positive('Informe o valor alvo da meta'),
  targetYears: z.number().int().min(1).max(50),
  priority: z.enum(['alta', 'media', 'baixa'])
})

const taxesSchema = z.object({
  incomeTaxRate: z.number().min(0).max(40),
  investmentTaxRate: z.number().min(0).max(30)
})

const annualBonusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  month: z.number().int().min(1).max(12),
  amount: z.number().nonnegative()
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
  expectedReturnRate: z.number().min(-50).max(50),
  inflationRate: z.number().min(-10).max(30),
  additionalContribution: z.number().min(0),
  riskTolerance: z.number().min(1).max(5),
  goals: z.array(goalSchema).min(1).max(5),
  taxes: taxesSchema.optional(),
  annualBonuses: z.array(annualBonusSchema).max(10).optional().default([]),
  expensesBreakdown: z.array(expenseItemSchema).max(10).optional().default([]),
  scenario: scenarioSchema,
  stressTests: stressTestsSchema.optional().default({
    marketCrashDrop: 20,
    inflationSpike: 5
  })
})

export function parseSimulationInput (payload) {
  const parsed = simulationInputSchema.parse(payload)
  const defaultTaxes = parsed.taxes ?? {
    incomeTaxRate: 12,
    investmentTaxRate: 15
  }

  const defaultBonuses = (parsed.annualBonuses && parsed.annualBonuses.length > 0)
    ? parsed.annualBonuses
    : [
        {
          id: '13-salario',
          label: '13º salário',
          month: 12,
          amount: parsed.monthlyIncome
        },
        {
          id: 'plr',
          label: 'PLR',
          month: 3,
          amount: parsed.monthlyIncome * 0.6
        }
      ]

  return {
    ...parsed,
    goals: parsed.goals,
    taxes: defaultTaxes,
    annualBonuses: defaultBonuses
  }
}
