import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import compression from 'compression'
import mongoose from 'mongoose'
import { createServer } from 'node:http'

import simulationRouter from './routes/simulation.js'
import authRouter from './routes/auth.js'
import presetsRouter from './routes/presets.js'
import proRouter from './routes/pro.js'
import { seedPresets } from './seed/init.js'

const app = express()
const DEFAULT_PORT = Number.parseInt(process.env.PORT ?? '4000', 10)
const MAX_PORT_ATTEMPTS = 5

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
  credentials: true
}))
app.use(compression())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.use('/api/auth', authRouter)
app.use('/api/presets', presetsRouter)
app.use('/api/pro', proRouter)
app.use('/api/simulations', simulationRouter)

app.use((err, req, res, next) => {
  console.error('[UnhandledError]', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Erro interno inesperado',
    details: err.details || null
  })
})

async function connectDatabase () {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI não configurada. Recursos persistentes indisponíveis.')
    return
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: Number.parseInt(process.env.MONGO_MAX_POOL ?? '10', 10)
    })
    console.log('Conectado ao MongoDB')
    await seedPresets()
  } catch (error) {
    console.error('Falha ao conectar ao MongoDB', error)
    process.exit(1)
  }
}

function startServer (port = DEFAULT_PORT, attempt = 0) {
  const server = createServer(app)

  server.once('listening', () => {
    if (port !== DEFAULT_PORT && process.env.PORT == null) {
      process.env.PORT = String(port)
    }
    console.log(`Servidor de simulações financeiras rodando na porta ${port}`)
  })

  server.once('error', (error) => {
    if (error.code === 'EADDRINUSE' && attempt < MAX_PORT_ATTEMPTS) {
      const nextPort = port + 1
      console.warn(`Porta ${port} ocupada. Tentando porta ${nextPort}...`)
      setTimeout(() => startServer(nextPort, attempt + 1), 100)
    } else {
      console.error('Não foi possível iniciar o servidor:', error)
      process.exit(1)
    }
  })

  server.listen(port)
}

(async () => {
  await connectDatabase()
  startServer()
})()
