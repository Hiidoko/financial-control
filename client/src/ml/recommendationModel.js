import * as tf from '@tensorflow/tfjs'

let modelInstance
let trainingPromise

function buildModel () {
  const model = tf.sequential()
  model.add(tf.layers.dense({ units: 8, activation: 'relu', inputShape: [3] }))
  model.add(tf.layers.dense({ units: 6, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
  model.compile({ optimizer: tf.train.adam(0.05), loss: 'categoricalCrossentropy' })
  return model
}

function generateSyntheticDataset () {
  const baseSamples = [
    { features: [0.05, 0.92, 0.1], label: [1, 0, 0] },
    { features: [0.08, 0.88, 0.15], label: [1, 0, 0] },
    { features: [0.12, 0.82, 0.25], label: [1, 0, 0] },
    { features: [0.18, 0.74, 0.35], label: [1, 0, 0] },
    { features: [0.2, 0.68, 0.4], label: [0, 1, 0] },
    { features: [0.22, 0.65, 0.45], label: [0, 1, 0] },
    { features: [0.24, 0.62, 0.55], label: [0, 1, 0] },
    { features: [0.26, 0.6, 0.6], label: [0, 1, 0] },
    { features: [0.28, 0.55, 0.65], label: [0, 1, 0] },
    { features: [0.3, 0.5, 0.7], label: [0, 1, 0] },
    { features: [0.32, 0.48, 0.72], label: [0, 1, 0] },
    { features: [0.34, 0.45, 0.8], label: [0, 0, 1] },
    { features: [0.36, 0.42, 0.82], label: [0, 0, 1] },
    { features: [0.38, 0.38, 0.85], label: [0, 0, 1] },
    { features: [0.4, 0.36, 0.9], label: [0, 0, 1] },
    { features: [0.42, 0.34, 0.93], label: [0, 0, 1] }
  ]

  const jittered = baseSamples.flatMap((sample) => {
    const [savingsRate, expenseRatio, goalProgress] = sample.features
    return [
      sample,
      {
        features: [
          Math.min(Math.max(savingsRate + (Math.random() - 0.5) * 0.05, 0), 1),
          Math.min(Math.max(expenseRatio + (Math.random() - 0.5) * 0.05, 0), 1),
          Math.min(Math.max(goalProgress + (Math.random() - 0.5) * 0.05, 0), 1)
        ],
        label: sample.label
      }
    ]
  })

  const xs = tf.tensor2d(jittered.map((s) => s.features))
  const ys = tf.tensor2d(jittered.map((s) => s.label))
  return { xs, ys }
}

async function ensureModelTrained () {
  if (modelInstance) return modelInstance
  if (trainingPromise) return trainingPromise

  trainingPromise = (async () => {
    modelInstance = buildModel()
    const { xs, ys } = generateSyntheticDataset()
    await modelInstance.fit(xs, ys, {
      epochs: 120,
      shuffle: true,
      verbose: 0
    })
    xs.dispose()
    ys.dispose()
    return modelInstance
  })()

  return trainingPromise
}

const ACTIONS = [
  {
    label: 'Enxugar gastos',
    highlight: 'Cortar supérfluos',
    message: 'Sua taxa de poupança está baixa e os gastos consomem boa parte da renda. Revise assinaturas e renegocie despesas fixas para abrir espaço para investimentos.',
    targetRunway: 6,
    explain: ({ savingsRate, expenseRatio }) => `Taxa de poupança em ${(savingsRate * 100).toFixed(1)}% com despesas consumindo ${(expenseRatio * 100).toFixed(1)}% da renda.`
  },
  {
    label: 'Reforçar aportes',
    highlight: 'Aumentar investimentos',
    message: 'Existe margem para elevar aportes mensais. Direcione parte do excedente para ativos com boa liquidez e mantenha consistência mensal.',
    targetRunway: 4,
    explain: ({ goalProgress }) => `Metas avançando ${(goalProgress * 100).toFixed(0)}%, sinal de espaço para acelerar aportes.`
  },
  {
    label: 'Otimizar carteira',
    highlight: 'Rever carteira',
    message: 'Você já poupa bem! Explore produtos com maior retorno ajustado ao risco (Tesouro IPCA+, debêntures de baixo risco) para antecipar sua meta.',
    targetRunway: 6,
    explain: ({ savingsRate, goalProgress }) => `Poupança em ${(savingsRate * 100).toFixed(1)}% e metas ${(goalProgress * 100).toFixed(0)}% concluídas justificam evoluir a carteira.`
  }
]

function buildExplanation (inputs, action) {
  const { savingsRate, expenseRatio, goalProgress } = inputs
  const featureSignals = []

  if (savingsRate < 0.2) featureSignals.push('poupança abaixo de 20%')
  if (expenseRatio > 0.7) featureSignals.push('gastos fixos acima de 70% da renda')
  if (goalProgress < 0.4) featureSignals.push('metas iniciais ainda longe do alvo')
  if (goalProgress > 0.6 && savingsRate > 0.25) featureSignals.push('metas bem encaminhadas e poupança robusta')

  const topSignals = featureSignals.slice(0, 2).join(' e ')
  const base = action.explain ? action.explain(inputs) : ''

  if (topSignals && base) return `${base}. Principais sinais: ${topSignals}.`
  if (base) return base
  if (topSignals) return `Principais sinais: ${topSignals}.`
  return 'Sugerido com base no padrão histórico de uso da renda e progresso das metas.'
}

export async function getBehaviorAdvice ({ savingsRate, expenseRatio, goalProgress }) {
  const model = await ensureModelTrained()
  const input = tf.tensor2d([[
    Math.min(Math.max(savingsRate, 0), 1),
    Math.min(Math.max(expenseRatio, 0), 1),
    Math.min(Math.max(goalProgress, 0), 1)
  ]])

  const prediction = model.predict(input)
  const values = Array.from(await prediction.data())

  input.dispose()
  prediction.dispose()

  const index = values.indexOf(Math.max(...values))
  const action = ACTIONS[index] ?? ACTIONS[1]
  const explanation = buildExplanation({ savingsRate, expenseRatio, goalProgress }, action)
  return {
    ...action,
    rationale: explanation
  }
}
