import { Router } from 'express'
import { ZodError } from 'zod'

import { parseSimulationInput } from '../utils/validators.js'
import { buildSimulationResult } from '../services/projectionService.js'
import { buildRecommendations } from '../services/recommendationService.js'
import { buildRecommendedGoals } from '../services/recommendedGoalsService.js'
import { getCachedSimulation, setCachedSimulation } from '../utils/cache.js'

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
    const demographics = req.body.demographics ?? {}
    const cacheKey = JSON.stringify({
      input,
      age: demographics.age ?? req.body.age,
      householdMembers: demographics.householdMembers ?? req.body.householdMembers ?? 1
    })

    const cachedResponse = getCachedSimulation(cacheKey)
    if (cachedResponse) {
      res.setHeader('X-Cache', 'HIT')
      return res.json(cachedResponse)
    }

  const simulation = buildSimulationResult(input)
  const recommendations = buildRecommendations(input, simulation)
    const recommendedGoals = buildRecommendedGoals({
      monthlyIncome: input.monthlyIncome,
      monthlyExpenses: input.monthlyExpenses,
      age: demographics.age ?? req.body.age,
      householdMembers: demographics.householdMembers ?? req.body.householdMembers ?? 1
    })

    const responsePayload = {
      input,
      simulation,
      recommendations,
      recommendedGoals
    }

    setCachedSimulation(cacheKey, responsePayload)
    res.setHeader('X-Cache', 'MISS')
    res.json(responsePayload)
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
