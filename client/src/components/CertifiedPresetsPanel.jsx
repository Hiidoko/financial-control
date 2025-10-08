import PropTypes from 'prop-types'
import { formatCurrency, formatPercent } from '@/utils/formatters.js'
import { CollapseToggle } from './CollapseToggle.jsx'
import { usePanelCollapse, useAnimatedCollapse } from '@/hooks/usePanelCollapse.js'

function CertificationBadge ({ badge, certifiedBy, certificationLevel }) {
  if (!badge && !certifiedBy) return null

  const labelMap = {
    'anbima-cpa10': 'Certificação CPA-10',
    'anbima-cpa20': 'Certificação CPA-20',
    'anbima-cfp': 'Planejamento CFP',
    'especialista-parceiro': 'Especialista parceiro'
  }

  const resolvedLabel = labelMap[badge] ?? certificationLevel ?? 'Certificação independente'

  return (
    <span className="certification-chip" title={certifiedBy ? `${resolvedLabel} · ${certifiedBy}` : resolvedLabel}>
      <span className="certification-dot" aria-hidden="true" />
      {resolvedLabel}
    </span>
  )
}

CertificationBadge.propTypes = {
  badge: PropTypes.string,
  certifiedBy: PropTypes.string,
  certificationLevel: PropTypes.string
}

export function CertifiedPresetsPanel ({ presets, isLoading, error, onApply, onRefresh }) {
  const { collapsed, toggle, contentId, shouldRender, onAnimationEnd } = usePanelCollapse('certified-presets', false)
  const contentRef = useAnimatedCollapse(collapsed, onAnimationEnd)
  return (
    <section className="panel panel-certified-presets">
      <header className="panel-header panel-header--with-toggle">
        <div>
          <h3 className="panel-title">Planos certificados ANBIMA</h3>
          {!collapsed && <p className="panel-subtitle">Aplicar um preset ajusta instantaneamente renda, metas e cenários baseados em benchmarks de mercado.</p>}
        </div>
        <div className="panel-actions" style={{ paddingRight: '42px' }}>
          <span className="plan-chip plan-chip--pro" aria-hidden="true">Certificado</span>
          <button type="button" className="button-ghost" onClick={onRefresh} disabled={isLoading}>
            Atualizar
          </button>
        </div>
        <CollapseToggle
          collapsed={collapsed}
          onToggle={toggle}
          labelCollapse="Recolher presets"
          labelExpand="Expandir presets"
          size="sm"
          controls={contentId}
        />
      </header>

      {shouldRender && (
        <div
          ref={contentRef}
          id={contentId}
          className="collapsible-content-wrapper collapsible-fade"
          aria-hidden={collapsed}
        >
        {isLoading && (
          <div className="panel-loading">Carregando carteiras validadas...</div>
        )}

        {!isLoading && error && (
          <div className="panel-error">{error}</div>
        )}

        {!isLoading && !error && (
          <div className="preset-grid">
            {presets.length === 0 && (
              <div className="preset-empty">Nenhum preset certificado disponível no momento.</div>
            )}

            {presets.map((preset) => (
              <article key={preset.slug ?? preset._id} className="preset-card">
                <div className="preset-card__header">
                  <h4>{preset.title}</h4>
                  <CertificationBadge
                    badge={preset.badge}
                    certifiedBy={preset.certifiedBy}
                    certificationLevel={preset.certificationLevel}
                  />
                </div>

                <p className="preset-card__description">{preset.description}</p>

                <dl className="preset-card__metrics">
                  <div>
                    <dt>Renda mensal</dt>
                    <dd>{formatCurrency(preset.monthlyIncome)}</dd>
                  </div>
                  <div>
                    <dt>Gastos certificados</dt>
                    <dd>{formatCurrency(preset.monthlyExpenses)}</dd>
                  </div>
                  <div>
                    <dt>Taxa esperada</dt>
                    <dd>{formatPercent((preset.expectedReturnRate ?? 0) / 100)}</dd>
                  </div>
                  <div>
                    <dt>Tolerância ao risco</dt>
                    <dd>{preset.riskTolerance ?? '—'}</dd>
                  </div>
                </dl>

                <div className="preset-card__goals">
                  <h5>Metas incluídas</h5>
                  <ul>
                    {preset.goals?.map((goal, index) => (
                      <li key={goal.name ?? index}>
                        <strong>{goal.name}</strong>
                        <span>{formatCurrency(goal.amount)} · {goal.targetYears} anos</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button type="button" className="button-primary" onClick={() => onApply(preset)}>
                  Aplicar preset certificado
                </button>
              </article>
            ))}
          </div>
        )}
        </div>
      )}
    </section>
  )
}

CertifiedPresetsPanel.propTypes = {
  presets: PropTypes.arrayOf(PropTypes.shape({
    slug: PropTypes.string,
    _id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    monthlyIncome: PropTypes.number,
    monthlyExpenses: PropTypes.number,
    expectedReturnRate: PropTypes.number,
    riskTolerance: PropTypes.number,
    goals: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string,
      amount: PropTypes.number,
      targetYears: PropTypes.number
    })),
    badge: PropTypes.string,
    certifiedBy: PropTypes.string,
    certificationLevel: PropTypes.string
  })).isRequired,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onApply: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired
}

CertificationBadge.defaultProps = {
  badge: null,
  certifiedBy: null,
  certificationLevel: null
}

CertifiedPresetsPanel.defaultProps = {
  isLoading: false,
  error: null
}
