import { Router } from 'express'
import { z } from 'zod'

import Preset from '../models/Preset.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req, res) => {
  const presets = await Preset.find().sort({ createdAt: -1 }).lean()
  res.json({ presets })
})

const presetSchema = z.object({
  slug: z.string().min(3),
  title: z.string().min(4),
  description: z.string().min(4),
  monthlyIncome: z.number().nonnegative(),
  monthlyExpenses: z.number().nonnegative(),
  currentSavings: z.number().nonnegative(),
  additionalContribution: z.number().nonnegative(),
  expectedReturnRate: z.number(),
  inflationRate: z.number(),
  riskTolerance: z.number(),
  scenario: z.object({
    incomeGrowthRate: z.number(),
    expenseGrowthRate: z.number(),
    jobLossMonths: z.number().min(0).max(12),
    unexpectedExpense: z.number().nonnegative(),
    oneTimeExtraIncome: z.number().nonnegative(),
    lifestyleInflation: z.number().min(0)
  }),
  goals: z.array(z.object({
    name: z.string(),
    amount: z.number().nonnegative(),
    targetYears: z.number().positive(),
    priority: z.enum(['alta', 'media', 'baixa'])
  })).min(1),
  certifiedBy: z.string().optional(),
  certificationLevel: z.string().optional(),
  badge: z.enum(['anbima-cpa20', 'anbima-cfp', 'especialista-parceiro']).optional()
})

router.post('/', authenticate, async (req, res) => {
  if (req.user.role !== 'pro') {
    return res.status(403).json({ error: 'Somente especialistas Pro podem registrar presets' })
  }

  try {
    const payload = presetSchema.parse(req.body)
    const preset = await Preset.create(payload)
    res.status(201).json({ preset: preset.toJSON() })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', issues: error.issues })
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Slug já utilizado' })
    }
    console.error('Erro ao criar preset', error)
    return res.status(500).json({ error: 'Não foi possível criar o preset' })
  }
})

export default router
