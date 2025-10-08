import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { ExportMenu } from './components/ExportMenu.jsx' // ainda usado dentro de menu legacy se necessário
import { DashboardMenu } from './components/DashboardMenu.jsx'
import { SimulationHistory } from './components/SimulationHistory.jsx'
import { CalendarPlanner } from './components/CalendarPlanner.jsx'
import { CertifiedPresetsPanel } from './components/CertifiedPresetsPanel.jsx'
import { RecommendedGoalsPanel } from './components/RecommendedGoalsPanel.jsx'
import { ProInsightsPanel } from './components/ProInsightsPanel.jsx'
import { useFinancialSimulation } from './hooks/useFinancialSimulation.js'
import { getBehaviorAdvice } from './ml/recommendationModel.js'
import { useThemeContext } from './context/ThemeContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import { AuthScreen } from './components/AuthScreen.jsx'
import { fetchCertifiedPresets, fetchCollaborativeGoals, fetchComparativeReport, fetchOpenFinanceSnapshot } from '@/services/api.js'

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
  adoptGoal,
    removeGoal,
    updateTax,
    updateAnnualBonus,
    addAnnualBonus,
    removeAnnualBonus,
    updateHistoryComment,
    restoreSimulation,
    applyPayload,
    submit
  } = useFinancialSimulation()

  const { user, isPro: authIsPro, logout, isLoading: authIsLoading, token } = useAuth()
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
  const [certifiedPresets, setCertifiedPresets] = useState([])
  const [presetsLoading, setPresetsLoading] = useState(false)
  const [presetsError, setPresetsError] = useState(null)
  const [comparativeReport, setComparativeReport] = useState(null)
  const [comparativeLoading, setComparativeLoading] = useState(false)
  const [comparativeError, setComparativeError] = useState(null)
  const [collaborativePlan, setCollaborativePlan] = useState(null)
  const [collaborativeLoading, setCollaborativeLoading] = useState(false)
  const [collaborativeError, setCollaborativeError] = useState(null)
  const [openFinanceSnapshot, setOpenFinanceSnapshot] = useState(null)
  const [openFinanceLoading, setOpenFinanceLoading] = useState(false)
  const [openFinanceError, setOpenFinanceError] = useState(null)
  const [collaboratorForm, setCollaboratorForm] = useState({
    name: '',
    email: '',
    age: 32,
    monthlyIncome: 7000,
    monthlyExpenses: 4200,
    householdMembers: 2
  })

  const refreshCertifiedPresets = useCallback(async () => {
    if (!user) {
      setCertifiedPresets([])
      setPresetsLoading(false)
      return
    }

    setPresetsLoading(true)
    setPresetsError(null)

    try {
      const response = await fetchCertifiedPresets()
      setCertifiedPresets(response.presets ?? [])
    } catch (err) {
      setPresetsError(err.message)
    } finally {
      setPresetsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    submit()
  }, [submit, user])

  useEffect(() => {
    refreshCertifiedPresets()
  }, [refreshCertifiedPresets])

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

  const comparativeInput = useMemo(() => {
    if (!summary) return null
    return {
      baseline: {
        finalBalance: summary.baseline?.finalBalance ?? 0,
        totalContributed: summary.baseline?.totalContributed ?? 0
      },
      optimistic: {
        finalBalance: summary.optimistic?.finalBalance ?? 0,
        totalContributed: summary.optimistic?.totalContributed ?? 0
      },
      pessimistic: {
        finalBalance: summary.pessimistic?.finalBalance ?? 0,
        totalContributed: summary.pessimistic?.totalContributed ?? 0
      }
    }
  }, [summary])

  const dashboardReady = Boolean(results)
  const recommendedGoals = results?.recommendedGoals ?? []

  const displayName = useMemo(() => user?.name ?? user?.email ?? 'Investidor Visionário', [user])

  const handleApplyPreset = useCallback((preset) => {
    if (!preset) return
    applyPayload({
      ...preset,
      scenario: preset.scenario ?? {},
      goals: Array.isArray(preset.goals) ? preset.goals : []
    })
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        submit()
      }, 200)
    } else {
      submit()
    }
  }, [applyPayload, submit])

  const handleAdoptGoal = useCallback((goal) => {
    if (!goal) return
    adoptGoal(goal)
    if (typeof window !== 'undefined') {
      window.setTimeout(() => {
        submit()
      }, 160)
    } else {
      submit()
    }
  }, [adoptGoal, submit])

  const handleGenerateComparativeReport = useCallback(async () => {
    if (!authIsPro || !comparativeInput || !token) return
    setComparativeLoading(true)
    setComparativeError(null)
    try {
      const response = await fetchComparativeReport(comparativeInput, token)
      setComparativeReport(response.report)
    } catch (err) {
      setComparativeError(err.message)
    } finally {
      setComparativeLoading(false)
    }
  }, [authIsPro, comparativeInput, token])

  const updateCollaborativeField = useCallback((field, value) => {
    setCollaboratorForm((prev) => ({
      ...prev,
      [field]: ['age', 'monthlyIncome', 'monthlyExpenses', 'householdMembers'].includes(field)
        ? Number(value)
        : value
    }))
  }, [])

  const handleGenerateCollaborativePlan = useCallback(async () => {
    if (!authIsPro || !token) return
    if (!collaboratorForm.name || !collaboratorForm.email) {
      setCollaborativeError('Informe nome e e-mail do parceiro para gerar metas conjuntas.')
      return
    }

    setCollaborativeLoading(true)
    setCollaborativeError(null)

    try {
      const partnersPayload = [
        {
          name: user?.name ?? 'Você',
          email: user?.email ?? 'cliente@planejamento.fin',
          age: Math.max(Number.isFinite(collaboratorForm.age) ? collaboratorForm.age : 32, 18),
          monthlyIncome: Number.isFinite(financialData.monthlyIncome) ? financialData.monthlyIncome : 0,
          monthlyExpenses: Number.isFinite(financialData.monthlyExpenses) ? financialData.monthlyExpenses : 0,
          householdMembers: collaboratorForm.householdMembers ?? 2,
          partnersCount: 2
        },
        {
          name: collaboratorForm.name,
          email: collaboratorForm.email,
          age: Math.max(collaboratorForm.age ?? 30, 18),
          monthlyIncome: collaboratorForm.monthlyIncome ?? 0,
          monthlyExpenses: collaboratorForm.monthlyExpenses ?? 0,
          householdMembers: collaboratorForm.householdMembers ?? 2,
          partnersCount: 2
        }
      ]

      const response = await fetchCollaborativeGoals({ partners: partnersPayload }, token)
      setCollaborativePlan(response.collaborative)
    } catch (err) {
      setCollaborativeError(err.message)
    } finally {
      setCollaborativeLoading(false)
    }
  }, [authIsPro, token, collaboratorForm, user, financialData])

  const handleFetchOpenFinanceSnapshot = useCallback(async () => {
    if (!authIsPro || !token) return
    setOpenFinanceLoading(true)
    setOpenFinanceError(null)
    try {
      const response = await fetchOpenFinanceSnapshot(token)
      setOpenFinanceSnapshot(response.snapshot)
    } catch (err) {
      setOpenFinanceError(err.message)
    } finally {
      setOpenFinanceLoading(false)
    }
  }, [authIsPro, token])

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
      target: '[data-tour="tour-button"]',
      placement: 'bottom',
      content: 'Use este menu para iniciar o assistente guiado sempre que quiser revisitar as principais áreas do simulador.'
    },
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

  if (authIsLoading && !user) {
    return (
      <div className="auth-loading-screen">
        <div className="auth-loading-spinner" />
        <p>Validando sua sessão segura...</p>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen />
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

      <header className="dash-hero dash-hero--compact" data-tour="dashboard-hero">
        <div className="dash-hero__bg" aria-hidden="true" />
        <div className="dash-hero__bar">
          <div className="dash-hero__user">
            <span className="dash-hero__greeting">{displayName}</span>
            {authIsPro && <span className="badge badge--pro" title="Plano Pro ativo">Pro</span>}
          </div>
          <div className="dash-hero__actions-minimal" aria-label="Ações do dashboard">
            <DashboardMenu
              theme={theme}
              toggleTheme={toggleTheme}
              focusMode={focusMode}
              toggleFocusMode={toggleFocusMode}
              onStartTour={() => setIsTourRunning(true)}
              tourDisabled={!dashboardReady}
              results={results}
              payload={payload}
              logout={logout}
            />
          </div>
        </div>
        <div className="dash-hero__subinfo">
          <p className="dash-hero__context-line">{headerSubtitle}</p>
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
          <CertifiedPresetsPanel
            presets={certifiedPresets}
            isLoading={presetsLoading}
            error={presetsError}
            onApply={handleApplyPreset}
            onRefresh={refreshCertifiedPresets}
          />

          {recommendedGoals.length > 0 && (
            <RecommendedGoalsPanel goals={recommendedGoals} onAdoptGoal={handleAdoptGoal} />
          )}

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

          <ProInsightsPanel
            isPro={authIsPro}
            hasSummary={Boolean(summary)}
            comparativeReport={comparativeReport}
            comparativeLoading={comparativeLoading}
            comparativeError={comparativeError}
            onRunComparative={handleGenerateComparativeReport}
            collaborativeForm={collaboratorForm}
            onCollaborativeFieldChange={updateCollaborativeField}
            onGenerateCollaborativePlan={handleGenerateCollaborativePlan}
            collaborativePlan={collaborativePlan}
            collaborativeLoading={collaborativeLoading}
            collaborativeError={collaborativeError}
            openFinanceSnapshot={openFinanceSnapshot}
            openFinanceLoading={openFinanceLoading}
            openFinanceError={openFinanceError}
            onFetchOpenFinance={handleFetchOpenFinanceSnapshot}
          />
        </div>
      </div>
    </div>
  )
}
