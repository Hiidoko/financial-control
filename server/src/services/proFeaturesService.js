import { buildRecommendedGoals } from './recommendedGoalsService.js'

export function buildComparativeReport ({ baselineSummary, optimisticSummary, pessimisticSummary }) {
  return {
    finalBalances: {
      baseline: baselineSummary.finalBalance,
      optimistic: optimisticSummary.finalBalance,
      pessimistic: pessimisticSummary.finalBalance
    },
    totalContributions: {
      baseline: baselineSummary.totalContributed,
      optimistic: optimisticSummary.totalContributed,
      pessimistic: pessimisticSummary.totalContributed
    },
    growthDifferentials: {
      optimisticVsBaseline: optimisticSummary.finalBalance - baselineSummary.finalBalance,
      pessimisticVsBaseline: baselineSummary.finalBalance - pessimisticSummary.finalBalance
    }
  }
}

export function buildCollaborativeGoals ({ partners }) {
  if (!Array.isArray(partners) || partners.length === 0) return []

  return partners.map((partner) => {
    const goals = buildRecommendedGoals({
      monthlyIncome: partner.monthlyIncome,
      monthlyExpenses: partner.monthlyExpenses,
      age: partner.age,
      householdMembers: partner.householdMembers ?? 1
    })

    return {
      partner: {
        name: partner.name,
        email: partner.email
      },
      recommendedGoals: goals.goals.map((goal) => ({
        ...goal,
        partnerShare: goal.recommendedContribution / Math.max(partner.partnersCount ?? partners.length, 1)
      }))
    }
  })
}

export function synthesizeBankingSnapshot () {
  const now = new Date()
  return {
    lastSyncedAt: now.toISOString(),
    accounts: [
      {
        institution: 'Banco Open Finance Alpha',
        type: 'corrente',
        balance: 12850.32,
        avgMonthlyDeposit: 8100.12
      },
      {
        institution: 'Cooperativa Beta Invest',
        type: 'investimentos',
        balance: 45210.8,
        avgMonthlyDeposit: 2200.5
      }
    ],
    cashFlowInsights: {
      incomeVolatility: 0.18,
      expenseVolatility: 0.22,
      liquidityCoverageMonths: 4.3
    }
  }
}
