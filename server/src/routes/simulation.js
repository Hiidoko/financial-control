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
      expectedReturnRate: 8,
      inflationRate: 4,
      additionalContribution: 500,
      riskTolerance: 3,
      goals: [
        { id: 'preset-1', name: 'Entrada da casa', amount: 200000, targetYears: 5, priority: 'alta' },
        { id: 'preset-2', name: 'Educação dos filhos', amount: 80000, targetYears: 8, priority: 'media' }
      ],
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
