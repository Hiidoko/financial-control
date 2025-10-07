function formatCurrency (value) {
  return Math.round(value * 100) / 100
}

function buildExpenseCuts (input) {
  if (!input.expensesBreakdown || input.expensesBreakdown.length === 0) {
    const potential = Math.max((input.monthlyExpenses - input.monthlyIncome * 0.6), 0)
    if (potential <= 0) return []

    return [
      {
        title: 'Revisar despesas gerais',
        description: 'Mapeie seus principais gastos fixos e negocie contratos (internet, seguro, academia) buscando reduzir pelo menos 10% do total mensal.',
        estimatedMonthlyImpact: formatCurrency(potential * 0.1),
        difficulty: 'média'
      }
    ]
  }

  const sorted = [...input.expensesBreakdown].sort((a, b) => b.amount - a.amount)
  return sorted.slice(0, 3).map(item => ({
    title: `Reduzir ${item.category}`,
    description: `Defina um teto ${Math.round(item.amount * 0.85)} para ${item.category} e utilize alertas no app bancário para não exceder.`,
    estimatedMonthlyImpact: formatCurrency(item.amount * 0.15),
    difficulty: 'média'
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
      impact: 'alto'
    })
  }

  const secondaryShortfalls = goalsInsights.filter(goal => goal.shortfall > 0 && goal.id !== primaryGoal?.id)
  if (secondaryShortfalls.length > 0) {
    const goalNames = secondaryShortfalls.map(goal => `"${goal.name}"`).join(', ')
    moves.push({
      title: 'Rebalancear objetivos',
      description: `Considere alongar prazos ou reduzir valores das metas ${goalNames} para manter o foco nas metas prioritárias sem comprometer o orçamento.`,
      timeHorizon: '3-6 meses',
      impact: 'médio'
    })
  }

  if (shortfallProbability > 0.25) {
    moves.push({
      title: 'Blindar contra shortfall',
      description: `A probabilidade de não atingir a meta prioritária é de ${(shortfallProbability * 100).toFixed(1)}%. Reforce aportes ou ajuste metas para reduzir o risco.`,
      timeHorizon: '0-3 meses',
      impact: 'alto'
    })
  }

  if (simulation.summary.emergencyFundGap > 0) {
    moves.push({
      title: 'Construir reserva de emergência',
      description: `Reserve R$ ${formatCurrency(simulation.summary.emergencyFundGap)} para cobrir ${input.riskTolerance} meses de despesas. Utilize uma conta remunerada ou fundo DI com liquidez diária.`,
      timeHorizon: '0-6 meses',
      impact: 'alto'
    })
  }

  moves.push({
    title: 'Automatizar aportes',
    description: 'Programe aportes automáticos logo após o recebimento do salário. Automatização aumenta consistência e melhora o aproveitamento dos juros compostos.',
    timeHorizon: 'imediato',
    impact: 'medio'
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
        action: 'Diversifique com renda fixa pós-fixada e fundos multimercados conservadores para amortecer choques.'
      }
    }

    if (test.id === 'inflationSpike') {
      return {
        scenario: 'Inflação elevada',
        insight: `Inflação maior derrubaria o poder de compra final para R$ ${formatCurrency(test.realBalanceAfterShock)}.`,
        action: 'Inclua ativos indexados ao IPCA (Tesouro IPCA+, debêntures incentivadas) e revise índices de reajuste salarial.'
      }
    }

    return {
      scenario: 'Risco monitorado',
      insight: 'Revise o plano a cada trimestre.',
      action: 'Atualize as projeções sempre que houver grandes mudanças nas despesas ou renda.'
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

  const quickWins = []

  if (savingsRate < 0.2) {
    quickWins.push({
      title: 'Aumentar taxa de poupança',
      description: 'Direcione pelo menos 20% do excedente mensal para investimentos. Utilize a técnica 50-30-20 para reorganizar o orçamento.'
    })
  }

  if (runwayMonths < input.riskTolerance) {
    quickWins.push({
      title: 'Fortalecer reserva de emergência',
      description: `Seu fluxo atual cobre ${runwayMonths.toFixed(1)} meses de despesas. Mire ${input.riskTolerance} meses para resilência em caso de demissão.`
    })
  }

  if (input.scenario.jobLossMonths >= 3) {
    quickWins.push({
      title: 'Planos B de renda',
      description: 'Construa fontes extras de receita (freelas, consultorias) para garantir continuidade do plano durante períodos de instabilidade.'
    })
  }

  if (financialIndependenceIndex < 0.6) {
    quickWins.push({
      title: 'Turbinar independência financeira',
      description: 'Avalie aumentar aportes em ativos geradores de renda (FIIs, Tesouro IPCA+) para aproximar o fluxo passivo dos seus gastos mensais.'
    })
  }

  const expenseCuts = buildExpenseCuts(input)
  const strategicMoves = buildStrategicMoves(input, simulation)
  const riskMitigation = buildRiskMitigation(input, simulation)

  return {
    quickWins,
    expenseCuts,
    strategicMoves,
    riskMitigation,
    kpis: {
      savingsRate: Math.max(savingsRate, 0),
      runwayMonths,
      requiredMonthlyContribution: totalAdditionalContribution,
      primaryGoalAchieved: primaryGoal ? primaryGoal.achievedBaseline : null,
      goalsAchievedCount: simulation.summary.baseline?.goalsAchievedCount ?? 0,
      totalGoals: goalsInsights.length,
      shortfallProbability,
      financialIndependenceIndex
    }
  }
}
