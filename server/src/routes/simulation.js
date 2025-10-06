import { Router } from 'express'
import { ZodError } from 'zod'

import { parseSimulationInput } from '../utils/validators.js'
import { buildSimulationResult } from '../services/projectionService.js'
import { buildRecommendations } from '../services/recommendationService.js'

const router = Router()

router.get('/presets', (req, res) => {
  res.json({
    preset: {
      monthlyIncome: 8000,
      monthlyExpenses: 5200,
      currentSavings: 15000,
      goalAmount: 200000,
      goalYears: 5,
      expectedReturnRate: 8,
      inflationRate: 4,
      additionalContribution: 500,
      riskTolerance: 3,
      scenario: {
        incomeGrowthRate: 3,
        expenseGrowthRate: 2,
        jobLossMonths: 2,
        unexpectedExpense: 8000,
        oneTimeExtraIncome: 6000,
        lifestyleInflation: 1
      }
    }
  })
})

router.post('/', (req, res, next) => {
  try {
    const input = parseSimulationInput(req.body)
    const simulation = buildSimulationResult(input)
    const recommendations = buildRecommendations(input, simulation)

    res.json({
      input,
      simulation,
      recommendations
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        error: 'Entrada inválida',
        issues: error.issues
      })
    }

    return next(error)
  }
})

export default router
