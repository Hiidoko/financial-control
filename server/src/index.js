import express from 'express'
import cors from 'cors'

import simulationRouter from './routes/simulation.js'

const app = express()
const PORT = process.env.PORT || 4000

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

app.listen(PORT, () => {
  console.log(`Servidor de simulações financeiras rodando na porta ${PORT}`)
})
