import PropTypes from 'prop-types'
import { formatCurrency, formatPercent } from '../utils/formatters.js'

export function MetricCards ({ summary }) {
  if (!summary) return null

  const baseline = summary.baseline ?? {}
  const baselineGoals = baseline.goals ?? []
  const totalGoals = baselineGoals.length
  const achievedGoals = baseline.goalsAchievedCount ?? 0
  const goalsInsights = summary.goals ?? []
  const primaryGoal = goalsInsights[0] ?? null
  const baselinePrimaryGoal = primaryGoal ? baselineGoals.find((goal) => goal.id === primaryGoal.id) ?? null : null
  const totalAdditionalContribution = goalsInsights.reduce((acc, goal) => acc + goal.additionalMonthlyContribution, 0)
  const financialIndependenceIndexRaw = summary.financialIndependenceIndex ?? 0
  const financialIndependenceIndex = Number.isFinite(financialIndependenceIndexRaw) ? financialIndependenceIndexRaw : 0
  const shortfallProbabilityRaw = summary.shortfallProbability ?? 0
  const shortfallProbability = Number.isFinite(shortfallProbabilityRaw) ? shortfallProbabilityRaw : 0
  const monteCarloIterations = summary.monteCarloIterations ?? 0
  const emergencyCoverageRaw = baseline.emergencyCoverageTimeline?.at(-1)?.coverage ?? 0
  const emergencyCoverage = Number.isFinite(emergencyCoverageRaw) ? emergencyCoverageRaw : 0

  const metrics = [
    {
      key: 'finalBalance',
      label: 'Saldo final (base)',
      value: formatCurrency(baseline.finalBalance ?? 0),
      subtext: totalGoals > 0
        ? `${achievedGoals} de ${totalGoals} metas concluídas no cenário base.`
        : 'Inclua metas para acompanhar o progresso do plano.'
    },
    {
      key: 'primaryGoal',
      label: primaryGoal ? `Meta prioritária: ${primaryGoal.name}` : 'Meta prioritária',
      value: primaryGoal
        ? `${Math.round(Math.min(primaryGoal.completionRatio ?? 0, 1) * 100)}% concluída`
        : 'Sem metas definidas',
      subtext: primaryGoal
        ? (baselinePrimaryGoal?.achieved
            ? `Prevista para o ${Math.ceil((baselinePrimaryGoal.achievedMonth ?? baselinePrimaryGoal.targetMonth) / 12)}º ano.`
            : `Faltam ${formatCurrency(primaryGoal.shortfall ?? 0)} até o ${Math.ceil((baselinePrimaryGoal?.targetMonth ?? 12) / 12)}º ano.`)
        : 'Adicione metas e defina prioridades para orientar decisões.'
    },
    {
      key: 'additionalContribution',
      label: 'Aporte extra sugerido',
      value: formatCurrency(totalAdditionalContribution),
      subtext: totalAdditionalContribution > 0
        ? 'Distribua o aporte adicional entre metas pendentes conforme prioridade.'
        : 'Aportes atuais sustentam o plano nas condições simuladas.'
    },
    {
      key: 'savingsRate',
      label: 'Taxa de poupança',
      value: formatPercent(Math.max(summary.savingsRate ?? 0, 0)),
      subtext: 'Parcela da renda direcionada para investimentos mensais.'
    },
    {
      key: 'financialIndependence',
      label: 'Independência financeira',
      value: `${financialIndependenceIndex.toFixed(2)}x despesas`,
      subtext: financialIndependenceIndex >= 1
        ? 'Patrimônio permite renda passiva suficiente para cobrir o padrão de vida atual.'
        : 'Aumente aportes ou prazo para alcançar 1x e viver de renda com segurança.'
    },
    {
      key: 'shortfallProbability',
      label: 'Probabilidade de shortfall',
      value: formatPercent(shortfallProbability),
      subtext: primaryGoal
        ? `Estimativa com ${monteCarloIterations} execuções Monte Carlo para a meta prioritária.`
        : 'Cadastre uma meta para estimar o risco de não alcançá-la.'
    },
    {
      key: 'emergencyCoverage',
      label: 'Cobertura fundo de emergência',
      value: formatPercent(emergencyCoverage),
      subtext: emergencyCoverage >= 1
        ? 'Reserva supera o alvo definido pelo nível de tolerância ao risco.'
        : 'Destine parte dos bônus e aportes para completar o colchão de segurança.'
    }
  ]

  return (
    <div className="metrics-grid">
      {metrics.map((metric) => (
        <article key={metric.key} className="metric-box">
          <div className="metric-label">{metric.label}</div>
          <div className="metric-value">{metric.value}</div>
          <p className="metric-subtext">{metric.subtext}</p>
        </article>
      ))}
    </div>
  )
}

MetricCards.propTypes = {
  summary: PropTypes.object
}
