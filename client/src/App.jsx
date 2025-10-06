import { useEffect, useMemo, useState } from 'react'

import { FinanceForm } from './components/FinanceForm.jsx'
import { ScenarioControls } from './components/ScenarioControls.jsx'
import { ProjectionChart } from './components/ProjectionChart.jsx'
import { MetricCards } from './components/MetricCards.jsx'
import { ScenarioSummary } from './components/ScenarioSummary.jsx'
import { RecommendationPanel } from './components/RecommendationPanel.jsx'
import { StressTestList } from './components/StressTestList.jsx'
import { PdfExportButton } from './components/PdfExportButton.jsx'
import { useFinancialSimulation } from './hooks/useFinancialSimulation.js'
import { getBehaviorAdvice } from './ml/recommendationModel.js'

export default function App () {
  const {
    financialData,
    scenario,
    expensesBreakdown,
    results,
    error,
    isLoading,
    updateFinancialData,
    updateScenario,
    updateExpense,
    addExpense,
    removeExpense,
    submit
  } = useFinancialSimulation()

  const [aiAdvice, setAiAdvice] = useState(null)

  useEffect(() => {
    submit()
  }, [submit])

  useEffect(() => {
    if (!results?.simulation) return

    const baseline = results.simulation.summary.baseline
    const expenseRatio = financialData.monthlyIncome > 0
      ? financialData.monthlyExpenses / financialData.monthlyIncome
      : 1

    const goalProgress = financialData.goalAmount > 0
      ? Math.min(baseline.finalBalance / financialData.goalAmount, 1)
      : 0

    getBehaviorAdvice({
      savingsRate: results.simulation.summary.savingsRate,
      expenseRatio,
      goalProgress
    }).then(setAiAdvice)
  }, [financialData, results])

  const scenarios = results?.simulation?.scenarios ?? []
  const summary = results?.simulation?.summary

  const dashboardReady = Boolean(results)

  const headerSubtitle = useMemo(() => {
    if (!summary) return 'Combine projeções e inteligência leve para tomar decisões melhores.'
    if (summary.baseline.goalAchieved) {
      return 'Seu plano atinge a meta. Veja como antecipar o resultado com aportes estratégicos.'
    }
    return 'Sua meta ainda não é atingida no cenário base. Ajuste aportes ou gastos para chegar lá.'
  }, [summary])

  return (
    <div className="app-shell">
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#f8fafc' }}>Simulador de Futuro Financeiro</h1>
        <p style={{ marginTop: '8px', maxWidth: '640px', color: 'rgba(226,232,240,0.75)' }}>
          {headerSubtitle}
        </p>
      </header>

      <div className="layout-two-columns">
        <div className="stacked-cards">
          <FinanceForm
            data={financialData}
            expenses={expensesBreakdown}
            onChange={updateFinancialData}
            onExpenseChange={updateExpense}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            onSubmit={submit}
            isLoading={isLoading}
          />
          <ScenarioControls scenario={scenario} onChange={updateScenario} />
        </div>

        <div className="stack-space">
          {dashboardReady && (
            <>
              <PdfExportButton targetId="dashboard-content" />
              <div id="dashboard-content" className="stack-space">
                <MetricCards summary={summary} />
                <ProjectionChart scenarios={scenarios} />
                <ScenarioSummary scenarios={scenarios} />
                <StressTestList stressTests={results.simulation.stressTests} goalAmount={financialData.goalAmount} />
                <RecommendationPanel recommendations={results.recommendations} aiAdvice={aiAdvice} />
              </div>
            </>
          )}

          {!dashboardReady && (
            <section className="panel">
              <h3 className="panel-title">Informe seus dados</h3>
              <p className="panel-subtitle">Após salvar, o dashboard interativo aparece aqui.</p>
            </section>
          )}

          {error && (
            <section className="panel" style={{ borderColor: 'rgba(248, 113, 113, 0.5)' }}>
              <h3 className="panel-title text-danger">Erro na simulação</h3>
              <p className="panel-subtitle">{error}</p>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
