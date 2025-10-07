import jwt from 'jsonwebtoken'

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '2h'

export function signToken (user) {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET não configurado')
  }

  return jwt.sign({
    sub: user.id,
    role: user.role
  }, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}
