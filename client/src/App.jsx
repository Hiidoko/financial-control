import { useEffect, useMemo, useState } from 'react'
import Joyride, { STATUS } from 'react-joyride'

import { FinanceForm } from './components/FinanceForm.jsx'
import { ScenarioControls } from './components/ScenarioControls.jsx'
import { ProjectionChart } from './components/ProjectionChart.jsx'
import { MetricCards } from './components/MetricCards.jsx'
import { ScenarioSummary } from './components/ScenarioSummary.jsx'
import { RecommendationPanel } from './components/RecommendationPanel.jsx'
import { StressTestList } from './components/StressTestList.jsx'
import { WidgetBoard } from './components/WidgetBoard.jsx'
import { FinancialTimeline } from './components/FinancialTimeline.jsx'
import { ExportMenu } from './components/ExportMenu.jsx'
import { SimulationHistory } from './components/SimulationHistory.jsx'
import { CalendarPlanner } from './components/CalendarPlanner.jsx'
import { useFinancialSimulation } from './hooks/useFinancialSimulation.js'
import { getBehaviorAdvice } from './ml/recommendationModel.js'
import { useThemeContext } from './context/ThemeContext.jsx'

const WIDGET_ORDER_KEY = 'ffs:widget-order'
const DEFAULT_WIDGET_ORDER = ['metrics', 'projection', 'timeline', 'summary', 'history', 'calendar', 'stress', 'recommendations']

export default function App () {
  const {
    financialData,
    goals,
    scenario,
    expensesBreakdown,
    taxes,
    annualBonuses,
    results,
    history,
    error,
    isLoading,
    payload,
    updateFinancialData,
    updateScenario,
    updateExpense,
    addExpense,
    removeExpense,
    updateGoal,
    addGoal,
    removeGoal,
    updateTax,
    updateAnnualBonus,
    addAnnualBonus,
    removeAnnualBonus,
    updateHistoryComment,
    restoreSimulation,
    submit
  } = useFinancialSimulation()

  const { theme, toggleTheme, focusMode, toggleFocusMode } = useThemeContext()

  const [widgetOrder, setWidgetOrder] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_WIDGET_ORDER
    try {
      const stored = window.localStorage.getItem(WIDGET_ORDER_KEY)
      if (!stored) return DEFAULT_WIDGET_ORDER
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((id) => DEFAULT_WIDGET_ORDER.includes(id))
        const missing = DEFAULT_WIDGET_ORDER.filter((id) => !sanitized.includes(id))
        return [...sanitized, ...missing]
      }
    } catch (error) {
      console.warn('Não foi possível carregar ordem dos widgets', error)
    }
    return DEFAULT_WIDGET_ORDER
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(WIDGET_ORDER_KEY, JSON.stringify(widgetOrder))
  }, [widgetOrder])

  const [aiAdvice, setAiAdvice] = useState(null)
  const [isTourRunning, setIsTourRunning] = useState(false)

  useEffect(() => {
    submit()
  }, [submit])

  useEffect(() => {
    if (!results?.simulation) return

    const primaryGoal = results.simulation.summary.goals?.[0]
    const expenseRatio = financialData.monthlyIncome > 0
      ? financialData.monthlyExpenses / financialData.monthlyIncome
      : 1

    const goalProgress = primaryGoal?.completionRatio ?? 0

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
    const totalGoals = summary.baseline?.goals?.length ?? 0
    const achievedGoals = summary.baseline?.goalsAchievedCount ?? 0
    if (totalGoals > 0 && achievedGoals === totalGoals) {
      return 'Todas as metas estão no caminho certo. Explore aportes extras para antecipar conquistas.'
    }
    if (achievedGoals > 0) {
      return 'Parte das metas foi alcançada no cenário base. Ajuste aportes para equilibrar as demais.'
    }
    return 'As metas prioritárias ainda precisam de reforço. Reorganize aportes ou prazos para alcançar seus objetivos.'
  }, [summary])

  const baselineScenario = useMemo(() => (
    scenarios.find((item) => item.id === 'baseline') ?? scenarios[0] ?? null
  ), [scenarios])

  const widgetItems = useMemo(() => {
    if (!summary) return {}

    const map = {
      metrics: {
        label: 'Indicadores chave',
        importance: 'core',
        node: <MetricCards summary={summary} />
      }
    }

    if (scenarios.length > 0) {
      map.projection = {
        label: 'Projeção de patrimônio',
        importance: 'optional',
        node: <ProjectionChart scenarios={scenarios} />
      }

      map.summary = {
        label: 'Comparativo de cenários',
        importance: 'optional',
        node: <ScenarioSummary scenarios={scenarios} />
      }
    }

    if (baselineScenario && results?.input) {
      map.timeline = {
        label: 'Linha do tempo',
        importance: 'optional',
        node: <FinancialTimeline baseline={baselineScenario} input={results.input} summary={summary} tourId="timeline" />
      }
    }

    if (results?.simulation?.stressTests?.length) {
      map.stress = {
        label: 'Testes de estresse',
        importance: 'optional',
        node: <StressTestList stressTests={results.simulation.stressTests} />
      }
    }

    if (results?.recommendations) {
      map.recommendations = {
        label: 'Recomendações',
        importance: 'core',
        node: <RecommendationPanel recommendations={results.recommendations} aiAdvice={aiAdvice} tourId="recommendations" />
      }
    }

    if (history.length > 0) {
      map.history = {
        label: 'Histórico',
        importance: 'optional',
        node: (
          <SimulationHistory
            history={history}
            onUpdateComment={updateHistoryComment}
            onRestore={restoreSimulation}
          />
        )
      }
    }

    if (results?.recommendations) {
      map.calendar = {
        label: 'Agenda financeira',
        importance: 'optional',
        node: <CalendarPlanner payload={payload} recommendations={results.recommendations} />
      }
    }

    return map
  }, [summary, scenarios, baselineScenario, results, aiAdvice, history, updateHistoryComment, restoreSimulation, payload])

  const tourSteps = useMemo(() => [
    {
      target: '[data-tour="form"]',
      content: 'Comece preenchendo renda, despesas, patrimônio e suas metas para personalizar todas as projeções.'
    },
    {
      target: '[data-tour="scenario"]',
      content: 'Use os controles de cenários para simular promoções, demissão temporária e eventos extraordinários.'
    },
    {
      target: '[data-tour="dashboard-controls"]',
      content: 'Alterne entre tema claro/escuro, ative o modo foco e use as opções de exportação e compartilhamento.'
    },
    {
      target: '[data-tour="dashboard-widgets"]',
      content: 'Arraste e solte os cards para priorizar as visualizações que mais importam para você.'
    },
    {
      target: '[data-tour="timeline"]',
      content: 'A linha do tempo mostra eventos críticos (bônus, gastos e meta atingida) sobre a curva de patrimônio.'
    },
    {
      target: '[data-tour="recommendations"]',
      content: 'Aqui ficam as recomendações inteligentes da IA com próximos passos práticos.'
    }
  ], [])

  const handleJoyrideCallback = ({ status }) => {
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setIsTourRunning(false)
    }
  }

  return (
    <div className="app-shell">
      <Joyride
        run={isTourRunning}
        steps={tourSteps}
        continuous
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{ options: { primaryColor: '#6366f1', zIndex: 10000 } }}
        locale={{ back: 'Voltar', close: 'Fechar', last: 'Finalizar', next: 'Próximo', skip: 'Pular' }}
      />

      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Simulador de Futuro Financeiro</h1>
        <p style={{ marginTop: '8px', maxWidth: '640px' }}>
          {headerSubtitle}
        </p>

        <div className="header-controls" data-tour="dashboard-controls">
          <button type="button" className="toggle-button" data-tour="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          </button>
          <button type="button" className="toggle-button" data-tour="focus-toggle" onClick={toggleFocusMode}>
            {focusMode ? 'Sair do modo foco' : 'Ativar modo foco'}
          </button>
          <button
            type="button"
            className="toggle-button"
            data-tour="tour-button"
            onClick={() => setIsTourRunning(true)}
            disabled={!dashboardReady}
          >
            Assistente guiado
          </button>
          <ExportMenu targetId="dashboard-content" results={results} payload={payload} />
        </div>
      </header>

      <div className="layout-two-columns">
        <div className="stacked-cards">
          <FinanceForm
            data={financialData}
            goals={goals}
            expenses={expensesBreakdown}
            taxes={taxes}
            annualBonuses={annualBonuses}
            onChange={updateFinancialData}
            onGoalChange={updateGoal}
            onAddGoal={addGoal}
            onRemoveGoal={removeGoal}
            onExpenseChange={updateExpense}
            onAddExpense={addExpense}
            onRemoveExpense={removeExpense}
            onTaxChange={updateTax}
            onBonusChange={updateAnnualBonus}
            onAddBonus={addAnnualBonus}
            onRemoveBonus={removeAnnualBonus}
            onSubmit={submit}
            isLoading={isLoading}
            tourId="form"
          />
          <ScenarioControls scenario={scenario} onChange={updateScenario} tourId="scenario" />
        </div>

        <div className="stack-space">
          {dashboardReady && Object.keys(widgetItems).length > 0 && (
            <div id="dashboard-content" data-tour="dashboard-widgets">
              <WidgetBoard
                items={widgetItems}
                order={widgetOrder}
                onOrderChange={setWidgetOrder}
                focusMode={focusMode}
              />
            </div>
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
