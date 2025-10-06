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
  const samples = [
    { features: [0.05, 0.9, 0.2], label: [1, 0, 0] },
    { features: [0.12, 0.85, 0.4], label: [1, 0, 0] },
    { features: [0.18, 0.7, 0.5], label: [0, 1, 0] },
    { features: [0.22, 0.6, 0.6], label: [0, 1, 0] },
    { features: [0.3, 0.5, 0.75], label: [0, 1, 0] },
    { features: [0.35, 0.4, 0.8], label: [0, 0, 1] },
    { features: [0.4, 0.35, 0.9], label: [0, 0, 1] },
    { features: [0.25, 0.55, 0.85], label: [0, 0, 1] }
  ]

  const xs = tf.tensor2d(samples.map((s) => s.features))
  const ys = tf.tensor2d(samples.map((s) => s.label))
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
    targetRunway: 6
  },
  {
    label: 'Reforçar aportes',
    highlight: 'Aumentar investimentos',
    message: 'Existe margem para elevar aportes mensais. Direcione parte do excedente para ativos com boa liquidez e mantenha consistência mensal.',
    targetRunway: 4
  },
  {
    label: 'Otimizar carteira',
    highlight: 'Rever carteira',
    message: 'Você já poupa bem! Explore produtos com maior retorno ajustado ao risco (Tesouro IPCA+, debêntures de baixo risco) para antecipar sua meta.',
    targetRunway: 6
  }
]

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
  return ACTIONS[index] ?? ACTIONS[1]
}
