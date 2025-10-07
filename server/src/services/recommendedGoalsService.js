const AGE_SEGMENTS = [
  { maxAge: 25, label: 'início de carreira' },
  { maxAge: 35, label: 'estabilidade' },
  { maxAge: 50, label: 'expansão' },
  { maxAge: 65, label: 'pré-aposentadoria' },
  { maxAge: Infinity, label: 'legado' }
]

const GOAL_LIBRARY = {
  'início de carreira': [
    { name: 'Reserva emergencial', multiplier: 6, priority: 'alta' },
    { name: 'Especialização ou intercâmbio', multiplier: 0.6, priority: 'media' },
    { name: 'Aporte em previdência privada', multiplier: 1.2, priority: 'baixa' }
  ],
  estabilidade: [
    { name: 'Aporte para imóvel', multiplier: 12, priority: 'alta' },
    { name: 'Constituição da reserva emergencial', multiplier: 12, priority: 'alta' },
    { name: 'Educação continuada', multiplier: 0.8, priority: 'media' }
  ],
  expansão: [
    { name: 'Educação dos filhos', multiplier: 6, priority: 'alta' },
    { name: 'Viagens em família', multiplier: 1.5, priority: 'media' },
    { name: 'Aumentar aportes previdenciários', multiplier: 2.4, priority: 'alta' }
  ],
  'pré-aposentadoria': [
    { name: 'Quitação de dívidas', multiplier: 4, priority: 'alta' },
    { name: 'Reserva de renda passiva', multiplier: 8, priority: 'alta' },
    { name: 'Planos de saúde e cuidados', multiplier: 3, priority: 'media' }
  ],
  legado: [
    { name: 'Planejamento sucessório', multiplier: 12, priority: 'alta' },
    { name: 'Filantropia ou doações planejadas', multiplier: 2, priority: 'media' },
    { name: 'Reserva de cuidados prolongados', multiplier: 6, priority: 'alta' }
  ]
}

function resolveAgeSegment (age) {
  const segment = AGE_SEGMENTS.find((item) => age <= item.maxAge)
  return segment?.label ?? AGE_SEGMENTS[AGE_SEGMENTS.length - 1].label
}

export function buildRecommendedGoals ({ monthlyIncome, monthlyExpenses, age, householdMembers = 1 }) {
  const sanitizedIncome = Math.max(Number(monthlyIncome ?? 0), 0)
  const sanitizedExpenses = Math.max(Number(monthlyExpenses ?? 0), 0)
  const discretionaryIncome = Math.max(sanitizedIncome - sanitizedExpenses, 0)
  const segment = resolveAgeSegment(Number(age ?? 30))
  const library = GOAL_LIBRARY[segment] ?? []

  const baseEmergencyMultiplier = householdMembers >= 3 ? 9 : 6
  const emergencyGoal = {
    name: 'Reserva emergencial protegida',
    priority: 'alta',
    targetYears: 2,
    recommendedContribution: discretionaryIncome * 0.35,
    targetAmount: sanitizedExpenses * baseEmergencyMultiplier
  }

  const goals = library.map((goal, index) => {
    const horizonYears = Math.min(15, Math.max(2, index * 3 + 3))
    const targetAmount = sanitizedIncome * goal.multiplier
    return {
      name: goal.name,
      priority: goal.priority,
      targetYears: horizonYears,
      recommendedContribution: goal.priority === 'alta'
        ? discretionaryIncome * 0.25
        : discretionaryIncome * 0.1,
      targetAmount
    }
  })

  return {
    segment,
    discretionaryIncome,
    goals: [emergencyGoal, ...goals]
  }
}
