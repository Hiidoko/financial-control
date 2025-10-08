import { Router } from 'express'
import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'
import { z } from 'zod'

import User from '../models/User.js'
import { signToken } from '../utils/auth.js'
import { buildRecommendedGoals } from '../services/recommendedGoalsService.js'
import { authenticate } from '../middleware/auth.js'
import {
  getDemoUserProfile,
  isDemoCredential
} from '../utils/demoUser.js'

const router = Router()


const isDatabaseReady = () => mongoose.connection.readyState === 1


const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  birthDate: z.string(),
  role: z.enum(['basic', 'pro']).optional(),
  householdMembers: z.number().int().min(1).max(10).optional()
})

router.post('/register', async (req, res) => {
  try {
    if (!isDatabaseReady()) {
      return res.status(503).json({
        error: 'Cadastro indisponível no modo demonstração',
        demo: true
      })
    }

    const payload = registerSchema.parse(req.body)

    const existing = await User.findOne({ email: payload.email })
    if (existing) {
      return res.status(409).json({ error: 'Email já cadastrado' })
    }

    const passwordHash = await bcrypt.hash(payload.password, 12)
    const user = await User.create({
      name: payload.name,
      email: payload.email,
      passwordHash,
      birthDate: new Date(payload.birthDate),
      role: payload.role ?? 'basic',
      householdMembers: payload.householdMembers ?? 1,
      proFeatures: payload.role === 'pro'
        ? {
            comparativeReports: true,
            collaborativeGoals: true,
            bankingIntegrations: true
          }
        : undefined
    })

    const token = signToken(user)

    const recommendedGoals = buildRecommendedGoals({
      monthlyIncome: 0,
      monthlyExpenses: 0,
      age: calculateAge(user.birthDate),
      householdMembers: user.householdMembers
    })

    return res.status(201).json({
      token,
      user: user.toSafeJSON(),
      onboarding: {
        recommendedGoals
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', issues: error.issues })
    }
    console.error('Erro ao registrar usuário', error)
    return res.status(500).json({ error: 'Não foi possível concluir o cadastro' })
  }
})


router.get('/check-email', async (req, res) => {
  try {
    const email = String(req.query.email || '').trim().toLowerCase()
    if (!email) return res.status(400).json({ error: 'Parâmetro email é obrigatório' })
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'Email inválido' })
    if (!isDatabaseReady()) {
      return res.json({ exists: false, demo: true })
    }
    const exists = await User.exists({ email })
    return res.json({ exists: Boolean(exists) })
  } catch (error) {
    console.error('Erro ao checar email', error)
    return res.status(500).json({ error: 'Falha ao verificar email' })
  }
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

router.post('/login', async (req, res) => {
  try {
    const payload = loginSchema.parse(req.body)
    if (isDemoCredential(payload)) {
      const demoUser = getDemoUserProfile()
      const token = signToken({ id: demoUser.id, role: demoUser.role })
      return res.json({
        token,
        user: demoUser,
        demo: true
      })
    }

    if (!isDatabaseReady()) {
      return res.status(503).json({
        error: 'Serviço de autenticação indisponível — configure o banco ou use o acesso demo.',
        demo: true
      })
    }
    const user = await User.findOne({ email: payload.email })
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const isValid = await bcrypt.compare(payload.password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const token = signToken(user)

    return res.json({
      token,
      user: user.toSafeJSON()
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Dados inválidos', issues: error.issues })
    }
    console.error('Erro ao autenticar usuário', error)
    return res.status(500).json({ error: 'Não foi possível autenticar' })
  }
})

router.get('/me', authenticate, (req, res) => {
  const user = req.user.toSafeJSON()
  res.json({ user })
})

function calculateAge (birthDate) {
  const diff = Date.now() - new Date(birthDate).getTime()
  const ageDate = new Date(diff)
  return Math.abs(ageDate.getUTCFullYear() - 1970)
}

export default router
