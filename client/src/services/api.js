const BASE_URL = '/api/simulations'

export async function runSimulation (payload) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || 'Não foi possível gerar a simulação')
  }

  return response.json()
}
