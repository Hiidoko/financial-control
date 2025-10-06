const MONTHS_IN_YEAR = 12

const clamp = (value, min, max) => Math.min(Math.max(value, min), max)

const pctToMonthlyRate = (percent) => Math.pow(1 + percent / 100, 1 / MONTHS_IN_YEAR) - 1

const DEFAULT_JOB_LOSS_START = 6
const UNEXPECTED_EXPENSE_MONTH = 6

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

function simulateScenario (input, overrides, meta) {
  const scenario = buildScenario(input, overrides)
  const months = input.goalYears * MONTHS_IN_YEAR

  const monthlyReturnRate = pctToMonthlyRate(input.expectedReturnRate)
  const monthlyInflationRate = pctToMonthlyRate(input.inflationRate)
  const monthlyIncomeGrowth = pctToMonthlyRate(scenario.incomeGrowthRate)
  const monthlyExpenseGrowth = pctToMonthlyRate(scenario.expenseGrowthRate + scenario.lifestyleInflation)

  let balance = input.currentSavings
  let totalContributed = 0
  let totalReturns = 0
  let goalAchievedMonth = null

  const timeline = []
  let jobLossMonthsLeft = scenario.jobLossMonths

  for (let month = 1; month <= months; month++) {
    const previousBalance = balance

    const incomeGrowthFactor = Math.pow(1 + monthlyIncomeGrowth, month - 1)
    let monthlyIncome = input.monthlyIncome * incomeGrowthFactor

    if (month >= DEFAULT_JOB_LOSS_START && jobLossMonthsLeft > 0) {
      monthlyIncome = 0
      jobLossMonthsLeft--
    }

    const expenseGrowthFactor = Math.pow(1 + monthlyExpenseGrowth, month - 1)
    const monthlyExpenses = input.monthlyExpenses * expenseGrowthFactor

    let contribution = Math.max(monthlyIncome - monthlyExpenses, 0) + input.additionalContribution

    if (month === 1 && scenario.oneTimeExtraIncome > 0) {
      contribution += scenario.oneTimeExtraIncome
    }

    const returns = previousBalance * monthlyReturnRate

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

    if (!goalAchievedMonth && balance >= input.goalAmount) {
      goalAchievedMonth = month
    }

    timeline.push({
      month,
      year: Math.ceil(month / MONTHS_IN_YEAR),
      income: monthlyIncome,
      expenses: monthlyExpenses,
      contribution,
      returns,
      balance,
      realBalance
    })
  }

  const finalRealBalance = timeline.at(-1)?.realBalance ?? balance

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
      goalAchieved: Boolean(goalAchievedMonth),
      goalAchievedMonth,
      goalAchievedYear: goalAchievedMonth ? Math.ceil(goalAchievedMonth / MONTHS_IN_YEAR) : null
    }
  }
}

function computeRequiredMonthlyContribution (input) {
  const months = input.goalYears * MONTHS_IN_YEAR
  const monthlyRate = pctToMonthlyRate(input.expectedReturnRate)

  if (months === 0) return 0

  if (monthlyRate === 0) {
    const requiredContribution = (input.goalAmount - input.currentSavings) / months
    return requiredContribution > 0 ? requiredContribution : 0
  }

  const growthFactor = Math.pow(1 + monthlyRate, months)
  const numerator = input.goalAmount - input.currentSavings * growthFactor
  const denominator = (growthFactor - 1) / monthlyRate
  const requiredContribution = numerator / denominator
  return Number.isFinite(requiredContribution) && requiredContribution > 0 ? requiredContribution : 0
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

  return [
    {
      id: 'marketCrash',
      label: 'Queda de mercado',
      severity: crashDropPct,
      finalBalanceAfterShock: crashBalance,
      goalStillAchieved: crashBalance >= input.goalAmount
    },
    {
      id: 'inflationSpike',
      label: 'Inflação acima do esperado',
      severity: inflationSpikePct,
      realBalanceAfterShock: inflationHit,
      goalStillAchieved: inflationHit >= input.goalAmount
    }
  ]
}

export function buildSimulationResult (input) {
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

  const requiredMonthlyContribution = computeRequiredMonthlyContribution(input)

  const savingsRate = input.monthlyIncome > 0
    ? (input.monthlyIncome - input.monthlyExpenses + input.additionalContribution) / input.monthlyIncome
    : 0

  const emergencyFundTarget = input.monthlyExpenses * input.riskTolerance
  const emergencyFundGap = Math.max(emergencyFundTarget - input.currentSavings, 0)

  const stressTests = buildStressTests(input, baseline, input.stressTests)

  return {
    scenarios: [baseline, optimistic, pessimistic],
    summary: {
      requiredMonthlyContribution,
      baseline: baseline.summary,
      optimistic: optimistic.summary,
      pessimistic: pessimistic.summary,
      savingsRate,
      emergencyFundTarget,
      emergencyFundGap,
      emergencyFundCoverage: emergencyFundTarget > 0 ? (1 - emergencyFundGap / emergencyFundTarget) : 1
    },
    stressTests
  }
}
