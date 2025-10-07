import jwt from 'jsonwebtoken'
import User from '../models/User.js'

function extractToken (req) {
  const header = req.headers.authorization
  if (!header) return null
  const [scheme, token] = header.split(' ')
  if (scheme?.toLowerCase() !== 'bearer') return null
  return token
}

export async function authenticate (req, res, next) {
  try {
    const token = extractToken(req)
    if (!token) {
      return res.status(401).json({ error: 'Credenciais não fornecidas' })
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub)
    if (!user) {
      return res.status(401).json({ error: 'Sessão inválida' })
    }

    req.user = user
    next()
  } catch (error) {
    console.error('Erro de autenticação', error)
    return res.status(401).json({ error: 'Não autorizado' })
  }
}

export function authorizePro (req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Não autorizado' })
  }
  if (req.user.role !== 'pro') {
    return res.status(403).json({ error: 'Recurso exclusivo do plano Pro' })
  }
  return next()
}
