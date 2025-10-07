import express from 'express'
import cors from 'cors'
import { createServer } from 'node:http'

import simulationRouter from './routes/simulation.js'

const app = express()
const DEFAULT_PORT = Number.parseInt(process.env.PORT, 10) || 4000
const MAX_PORT_ATTEMPTS = 5

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

app.use('/api/simulations', simulationRouter)

app.use((err, req, res, next) => {
  console.error('[UnhandledError]', err)
  const status = err.status || 500
  res.status(status).json({
    error: err.message || 'Erro interno inesperado',
    details: err.details || null
  })
})

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

startServer()
