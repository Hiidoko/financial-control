const MONTHS_IN_YEAR = 12

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const pctToMonthlyRate = (percent) => Math.pow(1 + percent / 100, 1 / MONTHS_IN_YEAR) - 1

const DEFAULT_JOB_LOSS_START = 6
const UNEXPECTED_EXPENSE_MONTH = 6
const DEFAULT_TAXES = { incomeTaxRate: 12, investmentTaxRate: 15 }
const SAFE_WITHDRAWAL_RATE = 0.04
const MONTE_CARLO_ITERATIONS = 200

function buildScenario (input, overrides = {}) {
  const { scenario } = input
  return {
    incomeGrowthRate: scenario.incomeGrowthRate + (overrides.incomeGrowthDelta ?? 0),
    expenseGrowthRate: scenario.expenseGrowthRate + (overrides.expenseGrowthDelta ?? 0),
    jobLossMonths: clamp(overrides.jobLossMonths ?? scenario.jobLossMonths, 0, 12),
    unexpectedExpense: clamp(overrides.unexpectedExpense ?? scenario.unexpectedExpense, 0, Number.MAX_SAFE_INTEGER),
    oneTimeExtraIncome: Math.max(overrides.oneTimeExtraIncome ?? scenario.oneTimeExtraIncome, 0),
    lifestyleInflation: Math.max(overrides.lifestyleInflation ?? scenario.lifestyleInflation, 0)
  }
}

function getPlanningHorizonMonths (goals) {
  const longestGoal = goals.reduce((max, goal) => Math.max(max, goal.targetYears), 0)
  return Math.max(longestGoal * MONTHS_IN_YEAR, 12)
}

function sortGoalsByPriority (goals) {
  const priorityWeight = { alta: 3, media: 2, baixa: 1 }
  return [...goals].sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] ?? 0) - (priorityWeight[a.priority] ?? 0)
    if (weightDiff !== 0) return weightDiff
    return a.targetYears - b.targetYears
  })
}

function simulateScenario (input, overrides, meta) {
  const goals = sortGoalsByPriority(input.goals)
  const scenario = buildScenario(input, overrides)
  const months = getPlanningHorizonMonths(goals)
  const taxes = input.taxes ?? DEFAULT_TAXES
  const annualBonuses = input.annualBonuses ?? []
  const emergencyFundTarget = input.monthlyExpenses * input.riskTolerance

  const monthlyReturnRate = pctToMonthlyRate(input.expectedReturnRate)
  const monthlyInflationRate = pctToMonthlyRate(input.inflationRate)
  const monthlyIncomeGrowth = pctToMonthlyRate(scenario.incomeGrowthRate)
  const monthlyExpenseGrowth = pctToMonthlyRate(scenario.expenseGrowthRate + scenario.lifestyleInflation)

  let balance = input.currentSavings
  let totalContributed = 0
  let totalReturns = 0
  const goalProgress = new Map(goals.map(goal => [goal.id, { achievedMonth: null }]))

  const timeline = []
  let jobLossMonthsLeft = scenario.jobLossMonths

  for (let month = 1; month <= months; month++) {
    const previousBalance = balance
    const monthOfYear = ((month - 1) % MONTHS_IN_YEAR) + 1

    const incomeGrowthFactor = Math.pow(1 + monthlyIncomeGrowth, month - 1)
    let monthlyIncome = input.monthlyIncome * incomeGrowthFactor

    if (month >= DEFAULT_JOB_LOSS_START && jobLossMonthsLeft > 0) {
      monthlyIncome = 0
      jobLossMonthsLeft--
    }

    const monthlyIncomeAfterTax = monthlyIncome * (1 - (taxes.incomeTaxRate ?? DEFAULT_TAXES.incomeTaxRate) / 100)

    const expenseGrowthFactor = Math.pow(1 + monthlyExpenseGrowth, month - 1)
    const monthlyExpenses = input.monthlyExpenses * expenseGrowthFactor

    const disposableIncome = Math.max(monthlyIncomeAfterTax - monthlyExpenses, 0)
    let contribution = disposableIncome + input.additionalContribution

    if (month === 1 && scenario.oneTimeExtraIncome > 0) {
      contribution += scenario.oneTimeExtraIncome * (1 - (taxes.incomeTaxRate ?? DEFAULT_TAXES.incomeTaxRate) / 100)
    }

    const bonusContribution = annualBonuses
      .filter((bonus) => bonus.month === monthOfYear)
      .reduce((acc, bonus) => acc + bonus.amount * (1 - (taxes.incomeTaxRate ?? DEFAULT_TAXES.incomeTaxRate) / 100), 0)

    contribution += bonusContribution

    contribution = Math.max(contribution, 0)

    const grossReturns = previousBalance * monthlyReturnRate
    const returns = grossReturns >= 0
      ? grossReturns * (1 - (taxes.investmentTaxRate ?? DEFAULT_TAXES.investmentTaxRate) / 100)
      : grossReturns

    let newBalance = previousBalance + returns + contribution

    if (month === UNEXPECTED_EXPENSE_MONTH && scenario.unexpectedExpense > 0) {
      newBalance -= scenario.unexpectedExpense
    }

    if (newBalance < 0) newBalance = 0

    balance = newBalance
    totalContributed += contribution
    totalReturns += Math.max(returns, 0)

    const inflationFactor = Math.pow(1 + monthlyInflationRate, month)
    const realBalance = inflationFactor > 0 ? balance / inflationFactor : balance
    const emergencyCoverage = emergencyFundTarget > 0 ? balance / emergencyFundTarget : 0

    goals.forEach((goal) => {
      const progress = goalProgress.get(goal.id)
      if (progress && !progress.achievedMonth && balance >= goal.amount) {
        progress.achievedMonth = month
        goalProgress.set(goal.id, progress)
      }
    })

    timeline.push({
      month,
      year: Math.ceil(month / MONTHS_IN_YEAR),
      income: monthlyIncome,
      expenses: monthlyExpenses,
      contribution,
      returns,
      balance,
      realBalance,
      emergencyCoverage
    })
  }

  const finalRealBalance = timeline.at(-1)?.realBalance ?? balance
  const emergencyCoverageTimeline = timeline.map(({ month, emergencyCoverage }) => ({ month, coverage: emergencyCoverage }))

  const goalsSummary = goals.map((goal) => {
    const targetMonth = goal.targetYears * MONTHS_IN_YEAR
    const pointAtOrAfterTarget = timeline.find(point => point.month >= targetMonth) ?? timeline.at(-1)
    const balanceAtTarget = pointAtOrAfterTarget?.balance ?? balance
    const achievedMonth = goalProgress.get(goal.id)?.achievedMonth ?? null
    const projectedAchievementMonth = achievedMonth
    const achievedWithinTarget = achievedMonth !== null && achievedMonth <= targetMonth
    const shortfall = Math.max(goal.amount - balanceAtTarget, 0)
    const completionRatio = goal.amount > 0 ? Math.min(balanceAtTarget / goal.amount, 1) : 0

    return {
      id: goal.id,
      name: goal.name,
      priority: goal.priority,
      targetAmount: goal.amount,
      targetMonth,
      targetYear: Math.ceil(targetMonth / MONTHS_IN_YEAR),
      achieved: achievedWithinTarget,
      achievedWithinTarget,
      achievedMonth,
      achievedYear: achievedWithinTarget && achievedMonth ? Math.ceil(achievedMonth / MONTHS_IN_YEAR) : null,
      projectedAchievementMonth,
      projectedAchievementYear: projectedAchievementMonth ? Math.ceil(projectedAchievementMonth / MONTHS_IN_YEAR) : null,
      balanceAtTarget,
      shortfall,
      completionRatio
    }
  })

  const goalsAchievedCount = goalsSummary.filter(goal => goal.achieved).length

  return {
    id: meta.id,
    label: meta.label,
    color: meta.color,
    timeline,
    summary: {
      finalBalance: balance,
      finalRealBalance,
      totalContributed,
      totalReturns,
      goals: goalsSummary,
      goalsAchievedCount,
      emergencyCoverageTimeline
    }
  }
}

function computeAdditionalContributionForShortfall (shortfall, remainingMonths, monthlyRate) {
  if (remainingMonths <= 0) return shortfall
  if (monthlyRate === 0) {
    return shortfall / remainingMonths
  }

  const factor = (Math.pow(1 + monthlyRate, remainingMonths) - 1) / monthlyRate
  const required = shortfall / factor
  return Number.isFinite(required) && required > 0 ? required : 0
}

function buildStressTests (input, baseline, stressConfig) {
  const lastPoint = baseline.timeline.at(-1)
  if (!lastPoint) {
    return []
  }

  const crashDropPct = stressConfig?.marketCrashDrop ?? 20
  const inflationSpikePct = stressConfig?.inflationSpike ?? 5

  const crashBalance = lastPoint.balance * (1 - crashDropPct / 100)
  const inflationHit = lastPoint.realBalance / Math.pow(1 + inflationSpikePct / 100, 5)

  const topGoal = sortGoalsByPriority(input.goals)[0]
  const goalAmount = topGoal?.amount ?? 0

  return [
    {
      id: 'marketCrash',
      label: 'Queda de mercado',
      severity: crashDropPct,
      finalBalanceAfterShock: crashBalance,
      goalStillAchieved: goalAmount > 0 ? (crashBalance >= goalAmount) : true,
      focusGoalId: topGoal?.id ?? null,
      focusGoalName: topGoal?.name ?? null,
      focusGoalAmount: goalAmount,
      focusGoalPriority: topGoal?.priority ?? null
    },
    {
      id: 'inflationSpike',
      label: 'Inflação acima do esperado',
      severity: inflationSpikePct,
      realBalanceAfterShock: inflationHit,
      goalStillAchieved: goalAmount > 0 ? (inflationHit >= goalAmount) : true,
      focusGoalId: topGoal?.id ?? null,
      focusGoalName: topGoal?.name ?? null,
      focusGoalAmount: goalAmount,
      focusGoalPriority: topGoal?.priority ?? null
    }
  ]
}

function computeFinancialIndependenceIndex (finalRealBalance, monthlyExpenses) {
  if (monthlyExpenses <= 0) return 1
  if (!Number.isFinite(finalRealBalance) || finalRealBalance <= 0) return 0
  const monthlyPassiveIncome = (finalRealBalance * SAFE_WITHDRAWAL_RATE) / MONTHS_IN_YEAR
  return monthlyPassiveIncome / monthlyExpenses
}

function sampleNormal (mean, stdDev) {
  const u1 = Math.random()
  const u2 = Math.random()
  const randStdNormal = Math.sqrt(-2 * Math.log(u1 || Number.EPSILON)) * Math.cos(2 * Math.PI * u2)
  return mean + stdDev * randStdNormal
}

function randomInRange (min, max) {
  return min + Math.random() * (max - min)
}

function cloneSimulationInput (input) {
  return {
    ...input,
    goals: input.goals.map(goal => ({ ...goal })),
    scenario: { ...input.scenario },
    taxes: input.taxes ? { ...input.taxes } : undefined,
    annualBonuses: input.annualBonuses ? input.annualBonuses.map((bonus) => ({ ...bonus })) : []
  }
}

function buildMonteCarloInput (input) {
  const clone = cloneSimulationInput(input)

  const incomeFactor = 1 + randomInRange(-0.12, 0.12)
  const expenseFactor = 1 + randomInRange(-0.1, 0.12)
  const contributionFactor = 1 + randomInRange(-0.3, 0.3)

  clone.monthlyIncome = Math.max(input.monthlyIncome * incomeFactor, 0)
  clone.monthlyExpenses = Math.max(input.monthlyExpenses * expenseFactor, 0)
  clone.additionalContribution = Math.max(input.additionalContribution * contributionFactor, 0)
  clone.expectedReturnRate = clamp(sampleNormal(input.expectedReturnRate, 6), -40, 30)
  clone.inflationRate = clamp(sampleNormal(input.inflationRate, 2), -10, 25)
  clone.scenario.incomeGrowthRate = clamp(input.scenario.incomeGrowthRate + randomInRange(-1.5, 1.5), -50, 50)
  clone.scenario.expenseGrowthRate = clamp(input.scenario.expenseGrowthRate + randomInRange(-1.5, 1.5), -50, 50)

  return clone
}

function runMonteCarloShortfall (input) {
  const goals = sortGoalsByPriority(input.goals)
  const priorityGoal = goals[0]
  if (!priorityGoal) return 0

  let shortfalls = 0

  for (let i = 0; i < MONTE_CARLO_ITERATIONS; i++) {
    const mcInput = buildMonteCarloInput(input)
    const scenario = simulateScenario(mcInput, {}, {
      id: `mc-${i}`,
      label: 'Monte Carlo',
      color: '#ffffff'
    })

    const goalResult = scenario.summary.goals.find(goal => goal.id === priorityGoal.id)
    if (!goalResult || !goalResult.achievedWithinTarget) {
      shortfalls++
    }
  }

  return shortfalls / MONTE_CARLO_ITERATIONS
}

export function buildSimulationResult (input) {
  const goals = sortGoalsByPriority(input.goals)

  const baseline = simulateScenario(input, {}, {
    id: 'baseline',
    label: 'Cenário base',
    color: '#2563eb'
  })

  const optimistic = simulateScenario(input, {
    incomeGrowthDelta: 2,
    expenseGrowthDelta: -2,
    jobLossMonths: 0,
    unexpectedExpense: input.scenario.unexpectedExpense * 0.5,
    oneTimeExtraIncome: input.scenario.oneTimeExtraIncome + input.monthlyIncome * 1.5,
    lifestyleInflation: Math.max(input.scenario.lifestyleInflation - 1, 0)
  }, {
    id: 'optimistic',
    label: 'Cenário otimista',
    color: '#22c55e'
  })

  const pessimistic = simulateScenario(input, {
    incomeGrowthDelta: -2,
    expenseGrowthDelta: 3,
    jobLossMonths: clamp(input.scenario.jobLossMonths + 3, 0, 12),
    unexpectedExpense: input.scenario.unexpectedExpense + input.monthlyExpenses * 3,
    oneTimeExtraIncome: 0,
    lifestyleInflation: input.scenario.lifestyleInflation + 1.5
  }, {
    id: 'pessimistic',
    label: 'Cenário pessimista',
    color: '#f97316'
  })

  const monthlyRate = pctToMonthlyRate(input.expectedReturnRate)
  const goalsInsights = goals.map((goal) => {
    const targetMonth = goal.targetYears * MONTHS_IN_YEAR
    const baselineGoal = baseline.summary.goals.find(item => item.id === goal.id)
    const shortfall = baselineGoal?.shortfall ?? 0
    const additionalMonthlyContribution = computeAdditionalContributionForShortfall(shortfall, targetMonth, monthlyRate)

    return {
      id: goal.id,
      name: goal.name,
      priority: goal.priority,
      targetAmount: goal.amount,
      targetMonth,
      shortfall,
      completionRatio: baselineGoal?.completionRatio ?? 0,
      additionalMonthlyContribution,
      projectedAchievementMonth: baselineGoal?.projectedAchievementMonth ?? null,
      projectedAchievementYear: baselineGoal?.projectedAchievementYear ?? null,
      achievedBaseline: baselineGoal?.achieved ?? false,
      achievedOptimistic: optimistic.summary.goals.find(item => item.id === goal.id)?.achieved ?? false,
      achievedPessimistic: pessimistic.summary.goals.find(item => item.id === goal.id)?.achieved ?? false
    }
  })

  const financialIndependenceIndex = computeFinancialIndependenceIndex(baseline.summary.finalRealBalance, input.monthlyExpenses)
  const shortfallProbability = runMonteCarloShortfall(input)
  const monteCarloIterations = MONTE_CARLO_ITERATIONS

  const savingsRate = input.monthlyIncome > 0
    ? (input.monthlyIncome - input.monthlyExpenses + input.additionalContribution) / input.monthlyIncome
    : 0

  const emergencyFundTarget = input.monthlyExpenses * input.riskTolerance
  const emergencyFundGap = Math.max(emergencyFundTarget - input.currentSavings, 0)

  const stressTests = buildStressTests(input, baseline, input.stressTests)

  return {
    scenarios: [baseline, optimistic, pessimistic],
    summary: {
      goals: goalsInsights,
      baseline: baseline.summary,
      optimistic: optimistic.summary,
      pessimistic: pessimistic.summary,
      savingsRate,
      emergencyFundTarget,
      emergencyFundGap,
      emergencyFundCoverage: emergencyFundTarget > 0 ? (1 - emergencyFundGap / emergencyFundTarget) : 1,
      financialIndependenceIndex,
      shortfallProbability,
      monteCarloIterations
    },
    stressTests
  }
}
