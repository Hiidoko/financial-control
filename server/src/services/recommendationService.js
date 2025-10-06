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

function buildStrategicMoves (input, simulation) {
  const requiredContribution = simulation.summary.requiredMonthlyContribution
  const baselineContrib = simulation.scenarios[0].summary.goalAchieved
    ? 0
    : Math.max(requiredContribution - input.additionalContribution, 0)

  const moves = []

  if (baselineContrib > 0) {
    moves.push({
      title: 'Reforçar aportes mensais',
      description: `Para bater a meta em ${input.goalYears} anos, adicione mais R$ ${formatCurrency(baselineContrib)} por mês em investimentos indexados ao CDI ou IPCA+.`,
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
      requiredMonthlyContribution: simulation.summary.requiredMonthlyContribution,
      goalAchieved: simulation.summary.baseline.goalAchieved
    }
  }
}
