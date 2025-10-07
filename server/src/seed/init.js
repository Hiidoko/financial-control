import Preset from '../models/Preset.js'

const defaultPresets = [
  {
    slug: 'familia-equilibrada',
    title: 'Família em equilíbrio',
    description: 'Plano certificado ANBIMA para famílias com renda conjunta entre R$ 12k e R$ 18k.',
    monthlyIncome: 15000,
    monthlyExpenses: 9500,
    currentSavings: 40000,
    additionalContribution: 1200,
    expectedReturnRate: 8,
    inflationRate: 4,
    riskTolerance: 3,
    scenario: {
      incomeGrowthRate: 3,
      expenseGrowthRate: 2,
      jobLossMonths: 3,
      unexpectedExpense: 12000,
      oneTimeExtraIncome: 8000,
      lifestyleInflation: 1.2
    },
    goals: [
      { name: 'Reserva emergencial robusta', amount: 30000, targetYears: 2, priority: 'alta' },
      { name: 'Entrada do imóvel', amount: 180000, targetYears: 6, priority: 'alta' },
      { name: 'Educação avançada dos filhos', amount: 90000, targetYears: 8, priority: 'media' }
    ],
    certifiedBy: 'Especialista ANBIMA CFP®',
    certificationLevel: 'CFP®',
    badge: 'anbima-cfp'
  },
  {
    slug: 'profissional-sprint',
    title: 'Profissional Sprint',
    description: 'Foco em acelerar patrimônio nos primeiros anos de carreira.',
    monthlyIncome: 8000,
    monthlyExpenses: 4800,
    currentSavings: 15000,
    additionalContribution: 900,
    expectedReturnRate: 9,
    inflationRate: 4,
    riskTolerance: 4,
    scenario: {
      incomeGrowthRate: 6,
      expenseGrowthRate: 3,
      jobLossMonths: 1,
      unexpectedExpense: 6000,
      oneTimeExtraIncome: 5000,
      lifestyleInflation: 1.5
    },
    goals: [
      { name: 'Reserva de segurança', amount: 25000, targetYears: 2, priority: 'alta' },
      { name: 'MBA internacional', amount: 70000, targetYears: 4, priority: 'media' },
      { name: 'Aporte em previdência privada', amount: 60000, targetYears: 8, priority: 'baixa' }
    ],
    certifiedBy: 'Especialista ANBIMA CPA-20',
    certificationLevel: 'CPA-20',
    badge: 'anbima-cpa20'
  }
]

export async function seedPresets () {
  const count = await Preset.countDocuments()
  if (count > 0) return
  await Preset.insertMany(defaultPresets)
  console.log('Presets certificados criados')
}
