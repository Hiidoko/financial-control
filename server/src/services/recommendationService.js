import { spendingBenchmarks } from '../data/spendingBenchmarks.js'

function formatCurrency (value) {
  return Math.round(value * 100) / 100
}

function findBenchmarkForIncome (monthlyIncome) {
  const match = spendingBenchmarks.find((item) => {
    const [min, max] = item.incomeRange
    return monthlyIncome >= min && monthlyIncome <= max
  })
  return match ?? spendingBenchmarks[0]
}

function normalizeCategoryName (name) {
  const map = {
    moradia: 'Moradia',
    aluguel: 'Moradia',
    condominio: 'Moradia',
    alimentacao: 'Alimentação',
    mercado: 'Alimentação',
    supermercado: 'Alimentação',
    transporte: 'Transporte',
    combustivel: 'Transporte',
    mobilidade: 'Transporte',
    saude: 'Saúde',
    educacao: 'Educação',
    escola: 'Educação',
    lazer: 'Lazer',
    turismo: 'Lazer',
    vestuario: 'Vestuário',
    roupas: 'Vestuário',
    utilidades: 'Utilidades',
    contas: 'Utilidades'
  }

  const key = (name || '').toLowerCase()
  return map[key] ?? 'Outros'
}

function analyzeExpensesAgainstBenchmark (input) {
  const benchmark = findBenchmarkForIncome(input.monthlyIncome)
  const totalExpenses = input.expensesBreakdown?.reduce((sum, item) => sum + item.amount, 0) || input.monthlyExpenses
  if (totalExpenses <= 0) {
    return { benchmark, deviations: [], discretionaryRatio: 0 }
  }

  const totals = input.expensesBreakdown.reduce((acc, item) => {
    const category = normalizeCategoryName(item.category)
    acc[category] = (acc[category] || 0) + item.amount
    return acc
  }, {})

  const deviations = Object.entries(totals).map(([category, amount]) => {
    const share = amount / totalExpenses
    const benchmarkShare = benchmark.categories[category] ?? benchmark.categories.Outros
    const delta = share - benchmarkShare
    return {
      category,
      share,
      benchmarkShare,
      delta,
      monthlyAmount: amount
    }
  }).sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))

  const discretionaryCategories = ['Lazer', 'Vestuário', 'Outros']
  const discretionarySpend = deviations
    .filter((item) => discretionaryCategories.includes(item.category))
    .reduce((sum, item) => sum + item.monthlyAmount, 0)

  const discretionaryRatio = discretionarySpend / totalExpenses

  return { benchmark, deviations, discretionaryRatio }
}

const personaPrototypes = [
  {
    name: 'Conservador disciplinado',
    centroid: [0.35, 0.18, 0.55],
    description: 'Prioriza liquidez e controle estrito do orçamento. Plano foca em preservar reserva e aportes automáticos.',
    playbook: [
      'Reforçar aportes em renda fixa indexada ao IPCA para manter poder de compra.',
      'Aproveitar bonificações para ampliar colchão de segurança antes de aumentar risco.'
    ]
  },
  {
    name: 'Construtor equilibrado',
    centroid: [0.22, 0.3, 0.35],
    description: 'Equilibra gastos e investimentos, mas ainda pode otimizar o uso do excedente mensal.',
    playbook: [
      'Redirecionar parte do lazer para aportes consistentes em fundos diversificados.',
      'Criar metas automáticas vinculadas a objetivos específicos para manter foco.'
    ]
  },
  {
    name: 'Agressivo com alavancagem',
    centroid: [0.12, 0.42, 0.2],
    description: 'Gastos altos e pouca reserva. Precisa de ajustes fortes para reduzir exposição a choques.',
    playbook: [
      'Cortar despesas discricionárias até atingir pelo menos 3 meses de reserva.',
      'Canalizar bônus e PLR diretamente para reduzir passivos e montar reserva.'
    ]
  }
]

function identifyFinancialPersona ({ savingsRate, discretionaryRatio, emergencyCoverage }) {
  const point = [savingsRate, discretionaryRatio, emergencyCoverage]
  let best = personaPrototypes[0]
  let minDistance = Infinity

  personaPrototypes.forEach((persona) => {
    const distance = Math.sqrt(
      persona.centroid.reduce((sum, value, index) => sum + Math.pow(value - point[index], 2), 0)
    )

    if (distance < minDistance) {
      minDistance = distance
      best = persona
    }
  })

  return {
    ...best,
    distance: minDistance,
    rationale: `Comparação entre taxa de poupança (${(savingsRate * 100).toFixed(1)}%), gastos discricionários (${(discretionaryRatio * 100).toFixed(1)}%) e cobertura da reserva (${(emergencyCoverage * 100).toFixed(1)}%) indicou proximidade com o perfil "${best.name}".`
  }
}

function buildExpenseCuts (input, analysis) {
  if (!input.expensesBreakdown || input.expensesBreakdown.length === 0) {
    const potential = Math.max((input.monthlyExpenses - input.monthlyIncome * 0.6), 0)
    if (potential <= 0) return []

    return [
      {
        title: 'Revisar despesas gerais',
        description: 'Mapeie seus principais gastos fixos e negocie contratos (internet, seguro, academia) buscando reduzir pelo menos 10% do total mensal.',
        estimatedMonthlyImpact: formatCurrency(potential * 0.1),
        difficulty: 'média',
        reason: 'Sem categorização detalhada, aplicamos um corte linear de 10% para liberar caixa de forma rápida.'
      }
    ]
  }

  const deviations = analysis?.deviations ?? []
  const topOver = deviations.filter(item => item.delta > 0.03).slice(0, 3)

  if (topOver.length === 0) {
    const sorted = [...input.expensesBreakdown].sort((a, b) => b.amount - a.amount)
    return sorted.slice(0, 3).map(item => ({
      title: `Reduzir ${item.category}`,
      description: `Defina um teto ${Math.round(item.amount * 0.85)} para ${item.category} e utilize alertas no app bancário para não exceder.`,
      estimatedMonthlyImpact: formatCurrency(item.amount * 0.15),
      difficulty: 'média',
      reason: 'Categoria entre as três com maior peso absoluto no orçamento; redução de 15% gera folga imediata.'
    }))
  }

  return topOver.map((item) => ({
    title: `Gasto acima da média: ${item.category}`,
    description: `Benchmarks do IBGE sugerem alocar ${(item.benchmarkShare * 100).toFixed(0)}% nessa categoria. Hoje você direciona ${(item.share * 100).toFixed(0)}%. Renegocie, substitua fornecedores ou defina um teto para voltar ao intervalo saudável.`,
    estimatedMonthlyImpact: formatCurrency(item.delta * input.monthlyExpenses),
    difficulty: 'média',
    reason: `Excedente de ${(item.delta * 100).toFixed(1)} p.p. frente a lares semelhantes (${analysis?.benchmark?.persona}).`
  }))
}

function sortGoalsByPriority (goals = []) {
  const priorityWeight = { alta: 3, media: 2, baixa: 1 }
  return [...goals].sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0)
    if (weightDiff !== 0) return weightDiff
    return a.targetMonth - b.targetMonth
  })
}

function buildStrategicMoves (input, simulation) {
  const goalsInsights = sortGoalsByPriority(simulation.summary.goals)
  const primaryGoal = goalsInsights[0]
  const shortfallProbability = simulation.summary.shortfallProbability ?? 0

  const moves = []

  if (primaryGoal && primaryGoal.shortfall > 0) {
    moves.push({
      title: `Priorizar meta: ${primaryGoal.name}`,
      description: `Para alcançar "${primaryGoal.name}" em ${Math.ceil(primaryGoal.targetMonth / 12)} anos, destine aproximadamente R$ ${formatCurrency(primaryGoal.additionalMonthlyContribution)} extras por mês ou realoque aportes de metas menos prioritárias.`,
      timeHorizon: '0-3 meses',
      impact: 'alto',
      reason: `Shortfall de R$ ${formatCurrency(primaryGoal.shortfall)} no cenário base e necessidade de aporte adicional de R$ ${formatCurrency(primaryGoal.additionalMonthlyContribution)}.`
    })
  }

  const secondaryShortfalls = goalsInsights.filter(goal => goal.shortfall > 0 && goal.id !== primaryGoal?.id)
  if (secondaryShortfalls.length > 0) {
    const goalNames = secondaryShortfalls.map(goal => `"${goal.name}"`).join(', ')
    moves.push({
      title: 'Rebalancear objetivos',
      description: `Considere alongar prazos ou reduzir valores das metas ${goalNames} para manter o foco nas metas prioritárias sem comprometer o orçamento.`,
      timeHorizon: '3-6 meses',
      impact: 'médio',
      reason: 'Mais de uma meta apresenta déficit; redistribuir recursos evita múltiplas frustrações simultâneas.'
    })
  }

  if (shortfallProbability > 0.25) {
    moves.push({
      title: 'Blindar contra shortfall',
      description: `A probabilidade de não atingir a meta prioritária é de ${(shortfallProbability * 100).toFixed(1)}%. Reforce aportes ou ajuste metas para reduzir o risco.`,
      timeHorizon: '0-3 meses',
      impact: 'alto',
      reason: 'Simulações Monte Carlo apontam risco superior a 25%; ação imediata minimiza chance de insucesso.'
    })
  }

  if (simulation.summary.emergencyFundGap > 0) {
    moves.push({
      title: 'Construir reserva de emergência',
      description: `Reserve R$ ${formatCurrency(simulation.summary.emergencyFundGap)} para cobrir ${input.riskTolerance} meses de despesas. Utilize uma conta remunerada ou fundo DI com liquidez diária.`,
      timeHorizon: '0-6 meses',
      impact: 'alto',
      reason: `Cobertura atual é ${(simulation.summary.emergencyFundCoverage * 100).toFixed(0)}%, abaixo do alvo de ${input.riskTolerance} meses.`
    })
  }

  moves.push({
    title: 'Automatizar aportes',
    description: 'Programe aportes automáticos logo após o recebimento do salário. Automatização aumenta consistência e melhora o aproveitamento dos juros compostos.',
    timeHorizon: 'imediato',
    impact: 'medio',
    reason: 'Automação reduz vieses comportamentais e garante execução mesmo em rotinas corridas.'
  })

  return moves
}

function buildRiskMitigation (input, simulation) {
  const stressTests = simulation.stressTests || []
  return stressTests.map(test => {
    if (test.id === 'marketCrash') {
      return {
        scenario: 'Queda de mercado',
        insight: `Uma queda de ${test.severity}% reduziria seu saldo final para R$ ${formatCurrency(test.finalBalanceAfterShock)}.`,
        action: 'Diversifique com renda fixa pós-fixada e fundos multimercados conservadores para amortecer choques.',
        reason: 'Teste de estresse de mercado mostrou impacto relevante no saldo final; diversificação é a melhor defesa.'
      }
    }

    if (test.id === 'inflationSpike') {
      return {
        scenario: 'Inflação elevada',
        insight: `Inflação maior derrubaria o poder de compra final para R$ ${formatCurrency(test.realBalanceAfterShock)}.`,
        action: 'Inclua ativos indexados ao IPCA (Tesouro IPCA+, debêntures incentivadas) e revise índices de reajuste salarial.',
        reason: 'Choque inflacionário reduz patrimônio real; ativos indexados ajudam a preservar poder de compra.'
      }
    }

    return {
      scenario: 'Risco monitorado',
      insight: 'Revise o plano a cada trimestre.',
      action: 'Atualize as projeções sempre que houver grandes mudanças nas despesas ou renda.',
      reason: 'Sem eventos extremos, acompanhamento periódico garante aderência do plano.'
    }
  })
}

export function buildRecommendations (input, simulation) {
  const savingsRate = simulation.summary.savingsRate
  const runwayMonths = input.monthlyExpenses > 0 ? input.currentSavings / input.monthlyExpenses : 0
  const goalsInsights = simulation.summary.goals || []
  const primaryGoal = goalsInsights[0]
  const totalAdditionalContribution = goalsInsights.reduce((acc, goal) => acc + goal.additionalMonthlyContribution, 0)
  const shortfallProbability = simulation.summary.shortfallProbability ?? 0
  const financialIndependenceIndex = simulation.summary.financialIndependenceIndex ?? 0
  const emergencyCoverage = simulation.summary.emergencyFundCoverage ?? 0

  const benchmarkAnalysis = analyzeExpensesAgainstBenchmark(input)
  const persona = identifyFinancialPersona({
    savingsRate: Math.max(savingsRate, 0),
    discretionaryRatio: benchmarkAnalysis.discretionaryRatio,
    emergencyCoverage
  })

  const quickWins = []

  if (savingsRate < 0.2) {
    quickWins.push({
      title: 'Aumentar taxa de poupança',
      description: 'Direcione pelo menos 20% do excedente mensal para investimentos. Utilize a técnica 50-30-20 para reorganizar o orçamento.',
      reason: `Taxa atual: ${(savingsRate * 100).toFixed(1)}%. Recomendação mínima: 20%.`
    })
  }

  if (runwayMonths < input.riskTolerance) {
    quickWins.push({
      title: 'Fortalecer reserva de emergência',
      description: `Seu fluxo atual cobre ${runwayMonths.toFixed(1)} meses de despesas. Mire ${input.riskTolerance} meses para resiliência em caso de demissão.`,
      reason: `Cobertura de ${runwayMonths.toFixed(1)} meses < alvo de ${input.riskTolerance} meses.`
    })
  }

  if (input.scenario.jobLossMonths >= 3) {
    quickWins.push({
      title: 'Planos B de renda',
      description: 'Construa fontes extras de receita (freelas, consultorias) para garantir continuidade do plano durante períodos de instabilidade.',
      reason: `Cenário simulado prevê ${input.scenario.jobLossMonths} meses sem renda. Fontes alternativas reduzem necessidade de resgates.`
    })
  }

  if (financialIndependenceIndex < 0.6) {
    quickWins.push({
      title: 'Turbinar independência financeira',
      description: 'Avalie aumentar aportes em ativos geradores de renda (FIIs, Tesouro IPCA+) para aproximar o fluxo passivo dos seus gastos mensais.',
      reason: `Índice atual: ${financialIndependenceIndex.toFixed(2)}x. Objetivo mínimo: 1x despesas.`
    })
  }

  const expenseCuts = buildExpenseCuts(input, benchmarkAnalysis)
  const strategicMoves = buildStrategicMoves(input, simulation)
  const riskMitigation = buildRiskMitigation(input, simulation)

  return {
    quickWins,
    expenseCuts,
    strategicMoves,
    riskMitigation,
    persona,
    benchmark: {
      source: benchmarkAnalysis.benchmark.persona,
      notes: 'Valores inspirados na POF/IBGE para famílias urbanas em faixas de renda equivalentes (dados sintéticos).',
      topDeviations: benchmarkAnalysis.deviations.slice(0, 5)
    },
    kpis: {
      savingsRate: Math.max(savingsRate, 0),
      runwayMonths,
      requiredMonthlyContribution: totalAdditionalContribution,
      primaryGoalAchieved: primaryGoal ? primaryGoal.achievedBaseline : null,
      goalsAchievedCount: simulation.summary.baseline?.goalsAchievedCount ?? 0,
      totalGoals: goalsInsights.length,
      shortfallProbability,
      financialIndependenceIndex,
      discretionaryRatio: benchmarkAnalysis.discretionaryRatio,
      emergencyCoverage
    }
  }
}
