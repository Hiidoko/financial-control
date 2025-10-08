import PropTypes from 'prop-types'

import { formatCurrency, formatPercent } from '@/utils/formatters.js'
import { CollapseToggle } from './CollapseToggle.jsx'
import { usePanelCollapse, useAnimatedCollapse } from '@/hooks/usePanelCollapse.js'

const VOLATILITY_INTERPRETATION = (value) => {
  if (!Number.isFinite(value)) return '—'
  if (value < 0.1) return 'baixa volatilidade'
  if (value < 0.25) return 'moderada'
  return 'alta volatilidade'
}

export function ProInsightsPanel ({
  isPro,
  hasSummary,
  comparativeReport,
  comparativeLoading,
  comparativeError,
  onRunComparative,
  collaborativeForm,
  onCollaborativeFieldChange,
  onGenerateCollaborativePlan,
  collaborativePlan,
  collaborativeLoading,
  collaborativeError,
  openFinanceSnapshot,
  openFinanceLoading,
  openFinanceError,
  onFetchOpenFinance
}) {
  if (!isPro) {
    return (
      <section className="panel panel-pro-upsell">
        <h3 className="panel-title">Recursos Pro exclusivos</h3>
        <p className="panel-subtitle">
          Assine o plano Pro para destravar relatórios comparativos certificados, metas colaborativas com parceiros e conciliação Open Finance automatizada.
        </p>
        <ul className="upsell-list">
          <li>✔️ Benchmark ANBIMA com simulações base, otimista e pessimista</li>
          <li>✔️ Metas coordenadas e divisão de aportes entre parceiros</li>
          <li>✔️ Snapshot Open Finance com insights de liquidez e volatilidade</li>
        </ul>
        <p className="upsell-footer">Fale com o suporte para migrar de plano em poucos minutos.</p>
      </section>
    )
  }

  const { collapsed, toggle, contentId, shouldRender, onAnimationEnd } = usePanelCollapse('pro-insights', false)
  const contentRef = useAnimatedCollapse(collapsed, onAnimationEnd)
  return (
    <section className="panel panel-pro-insights">
      <header className="panel-header panel-header--with-toggle">
        <div>
          <h3 className="panel-title">Suite Pro · Inteligência certificada</h3>
          {!collapsed && <p className="panel-subtitle">Combine benchmarks ANBIMA, colaboração e dados Open Finance para planos acionáveis em minutos.</p>}
        </div>
        <CollapseToggle
          collapsed={collapsed}
          onToggle={toggle}
          labelCollapse="Recolher suite Pro"
          labelExpand="Expandir suite Pro"
          size="sm"
          controls={contentId}
        />
      </header>

      {shouldRender && (
        <div
          ref={contentRef}
          id={contentId}
          className="collapsible-content-wrapper collapsible-fade pro-insights__grid"
          aria-hidden={collapsed}
        >
        <article className="pro-insight-card">
          <header>
            <h4>Relatório comparativo ANBIMA</h4>
            <p>Compare patrimônio final e esforço de aporte em três cenários.</p>
          </header>

          <button
            type="button"
            className={`button-primary pro-action-btn${comparativeLoading ? ' is-loading' : ''}`}
            onClick={onRunComparative}
            disabled={!hasSummary || comparativeLoading}
          >
            {comparativeLoading
              ? <><span className="loader-dots" aria-hidden="true"><span /><span /><span /></span> Gerando...</>
              : 'Gerar relatório certificado'}
          </button>

          {comparativeError && <p className="pro-error">{comparativeError}</p>}

          {comparativeReport && (
            <div className="comparative-report">
              <dl>
                <div>
                  <dt>Baseline</dt>
                  <dd>{formatCurrency(comparativeReport.finalBalances.baseline)}</dd>
                </div>
                <div>
                  <dt>Otimista</dt>
                  <dd>{formatCurrency(comparativeReport.finalBalances.optimistic)}</dd>
                </div>
                <div>
                  <dt>Pessimista</dt>
                  <dd>{formatCurrency(comparativeReport.finalBalances.pessimistic)}</dd>
                </div>
              </dl>

              <p>
                O cenário otimista adiciona <strong>{formatCurrency(comparativeReport.growthDifferentials.optimisticVsBaseline)}</strong> sobre o baseline, enquanto o pessismista reduz em {formatCurrency(comparativeReport.growthDifferentials.pessimisticVsBaseline)}.
              </p>
            </div>
          )}
        </article>

        <article className="pro-insight-card">
          <header>
            <h4>Metas colaborativas</h4>
            <p>Convide parceiros e gere divisão sugerida de aportes.</p>
          </header>

          <form className="collaborative-form" onSubmit={(event) => {
            event.preventDefault()
            onGenerateCollaborativePlan()
          }}>
            <div className="form-grid">
              <label className="input-field">
                <span className="input-label">Nome do parceiro</span>
                <input
                  className="input-control"
                  type="text"
                  value={collaborativeForm.name}
                  onChange={(event) => onCollaborativeFieldChange('name', event.target.value)}
                  required
                />
              </label>
              <label className="input-field">
                <span className="input-label">E-mail</span>
                <input
                  className="input-control"
                  type="email"
                  value={collaborativeForm.email}
                  onChange={(event) => onCollaborativeFieldChange('email', event.target.value)}
                  required
                />
              </label>
              <label className="input-field">
                <span className="input-label">Idade</span>
                <input
                  className="input-control"
                  type="number"
                  min="18"
                  value={collaborativeForm.age}
                  onChange={(event) => onCollaborativeFieldChange('age', event.target.value)}
                />
              </label>
              <label className="input-field">
                <span className="input-label">Renda mensal</span>
                <input
                  className="input-control"
                  type="number"
                  min="0"
                  value={collaborativeForm.monthlyIncome}
                  onChange={(event) => onCollaborativeFieldChange('monthlyIncome', event.target.value)}
                />
              </label>
              <label className="input-field">
                <span className="input-label">Gastos mensais</span>
                <input
                  className="input-control"
                  type="number"
                  min="0"
                  value={collaborativeForm.monthlyExpenses}
                  onChange={(event) => onCollaborativeFieldChange('monthlyExpenses', event.target.value)}
                />
              </label>
              <label className="input-field">
                <span className="input-label">Membros na casa</span>
                <input
                  className="input-control"
                  type="number"
                  min="1"
                  value={collaborativeForm.householdMembers}
                  onChange={(event) => onCollaborativeFieldChange('householdMembers', event.target.value)}
                />
              </label>
            </div>

            <button type="submit" className="button-primary" disabled={collaborativeLoading}>
              {collaborativeLoading ? 'Calculando...' : 'Gerar plano compartilhado'}
            </button>
          </form>

          {collaborativeError && <p className="pro-error">{collaborativeError}</p>}

          {collaborativePlan && collaborativePlan.length > 0 && (
            <div className="collaborative-results">
              {collaborativePlan.map((item) => (
                <div key={item.partner.email} className="collaborative-result-card">
                  <header>
                    <h5>{item.partner.name}</h5>
                    <span>{item.partner.email}</span>
                  </header>
                  <ul>
                    {item.recommendedGoals.map((goal) => (
                      <li key={goal.name}>
                        <div>
                          <strong>{goal.name}</strong>
                          <span>{goal.priority} · {goal.category ?? 'Planejamento'}</span>
                        </div>
                        <div>
                          <span>Aporte sugerido</span>
                          <strong>{formatCurrency(goal.partnerShare)}</strong>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="pro-insight-card">
          <header>
            <h4>Snapshot Open Finance</h4>
            <p>Sincronize contas e veja liquidez e volatilidade de caixa.</p>
          </header>

          <button
            type="button"
            className={`button-primary pro-action-btn${openFinanceLoading ? ' is-loading' : ''}`}
            onClick={onFetchOpenFinance}
            disabled={openFinanceLoading}
          >
            {openFinanceLoading
              ? <><span className="loader-dots" aria-hidden="true"><span /><span /><span /></span> Sincronizando...</>
              : (openFinanceSnapshot ? 'Atualizar snapshot' : 'Gerar snapshot')}
          </button>

          {openFinanceError && <p className="pro-error">{openFinanceError}</p>}

          {openFinanceSnapshot && (
            <div className="open-finance-grid">
              <p className="open-finance-meta">
                Última sincronização: {new Date(openFinanceSnapshot.lastSyncedAt).toLocaleString('pt-BR')}
              </p>
              <ul className="open-finance-accounts">
                {openFinanceSnapshot.accounts?.map((account) => (
                  <li key={`${account.institution}-${account.type}`}>
                    <strong>{account.institution}</strong>
                    <span>Conta {account.type}</span>
                    <span>Saldo: {formatCurrency(account.balance)}</span>
                    <span>Depósito mensal médio: {formatCurrency(account.avgMonthlyDeposit)}</span>
                  </li>
                ))}
              </ul>
              <div className="open-finance-insights">
                <p>Volatilidade de renda: {formatPercent(openFinanceSnapshot.cashFlowInsights?.incomeVolatility ?? 0)}</p>
                <p>Volatilidade de gastos: {formatPercent(openFinanceSnapshot.cashFlowInsights?.expenseVolatility ?? 0)} ({VOLATILITY_INTERPRETATION(openFinanceSnapshot.cashFlowInsights?.expenseVolatility)})</p>
                <p>Cobertura de liquidez: {openFinanceSnapshot.cashFlowInsights?.liquidityCoverageMonths?.toFixed(1)} meses</p>
              </div>
            </div>
          )}
        </article>
        </div>
      )}
    </section>
  )
}

ProInsightsPanel.propTypes = {
  isPro: PropTypes.bool.isRequired,
  hasSummary: PropTypes.bool,
  comparativeReport: PropTypes.shape({
    finalBalances: PropTypes.shape({
      baseline: PropTypes.number,
      optimistic: PropTypes.number,
      pessimistic: PropTypes.number
    }),
    growthDifferentials: PropTypes.shape({
      optimisticVsBaseline: PropTypes.number,
      pessimisticVsBaseline: PropTypes.number
    })
  }),
  comparativeLoading: PropTypes.bool,
  comparativeError: PropTypes.string,
  onRunComparative: PropTypes.func.isRequired,
  collaborativeForm: PropTypes.shape({
    name: PropTypes.string,
    email: PropTypes.string,
    age: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    monthlyIncome: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    monthlyExpenses: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    householdMembers: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
  }).isRequired,
  onCollaborativeFieldChange: PropTypes.func.isRequired,
  onGenerateCollaborativePlan: PropTypes.func.isRequired,
  collaborativePlan: PropTypes.arrayOf(PropTypes.shape({
    partner: PropTypes.shape({
      name: PropTypes.string,
      email: PropTypes.string
    }),
    recommendedGoals: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      partnerShare: PropTypes.number,
      category: PropTypes.string,
      priority: PropTypes.string
    }))
  })),
  collaborativeLoading: PropTypes.bool,
  collaborativeError: PropTypes.string,
  openFinanceSnapshot: PropTypes.shape({
    lastSyncedAt: PropTypes.string,
    accounts: PropTypes.arrayOf(PropTypes.shape({
      institution: PropTypes.string,
      type: PropTypes.string,
      balance: PropTypes.number,
      avgMonthlyDeposit: PropTypes.number
    })),
    cashFlowInsights: PropTypes.shape({
      incomeVolatility: PropTypes.number,
      expenseVolatility: PropTypes.number,
      liquidityCoverageMonths: PropTypes.number
    })
  }),
  openFinanceLoading: PropTypes.bool,
  openFinanceError: PropTypes.string,
  onFetchOpenFinance: PropTypes.func.isRequired
}

ProInsightsPanel.defaultProps = {
  hasSummary: false,
  comparativeReport: null,
  comparativeLoading: false,
  comparativeError: null,
  collaborativePlan: null,
  collaborativeLoading: false,
  collaborativeError: null,
  openFinanceSnapshot: null,
  openFinanceLoading: false,
  openFinanceError: null
}
