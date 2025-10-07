import { Router } from 'express'
import { z } from 'zod'

import { authenticate, authorizePro } from '../middleware/auth.js'
import { buildComparativeReport, buildCollaborativeGoals, synthesizeBankingSnapshot } from '../services/proFeaturesService.js'

const router = Router()

const comparativeSchema = z.object({
  baseline: z.object({
    finalBalance: z.number(),
    totalContributed: z.number()
  }),
  optimistic: z.object({
    finalBalance: z.number(),
    totalContributed: z.number()
  }),
  pessimistic: z.object({
    finalBalance: z.number(),
    totalContributed: z.number()
  })
})

router.post('/reports/comparative', authenticate, authorizePro, (req, res) => {
  try {
    const payload = comparativeSchema.parse(req.body)
    const report = buildComparativeReport({
      baselineSummary: payload.baseline,
      optimisticSummary: payload.optimistic,
      pessimisticSummary: payload.pessimistic
    })
    res.json({ report })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', issues: error.issues })
    }
    console.error('Erro ao gerar relatório comparativo', error)
    return res.status(500).json({ error: 'Não foi possível gerar o relatório' })
  }
})

const collaborativeSchema = z.object({
  partners: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
    age: z.number().min(18).max(90),
    monthlyIncome: z.number().nonnegative(),
    monthlyExpenses: z.number().nonnegative(),
    householdMembers: z.number().int().min(1).optional(),
    partnersCount: z.number().int().min(1).optional()
  })).min(1)
})

router.post('/goals/collaborative', authenticate, authorizePro, (req, res) => {
  try {
    const payload = collaborativeSchema.parse(req.body)
    const collaborative = buildCollaborativeGoals(payload)
    res.json({ collaborative })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', issues: error.issues })
    }
    console.error('Erro ao gerar metas colaborativas', error)
    return res.status(500).json({ error: 'Não foi possível gerar as metas' })
  }
})

router.get('/open-finance/snapshot', authenticate, authorizePro, (req, res) => {
  const snapshot = synthesizeBankingSnapshot()
  res.json({ snapshot })
})

export default router
