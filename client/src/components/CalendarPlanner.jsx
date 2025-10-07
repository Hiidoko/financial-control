import { useMemo } from 'react'
import PropTypes from 'prop-types'

import { downloadIcs, buildGoogleCalendarLink } from '../utils/exporters.js'
import { formatCurrency } from '../utils/formatters.js'

function createMonthlyContributionEvents (payload, months = 12) {
  const baseAmount = Math.max(
    Number(payload.additionalContribution ?? 0) + Math.max((payload.monthlyIncome ?? 0) - (payload.monthlyExpenses ?? 0), 0),
    0
  )

  const now = new Date()
  const events = []

  for (let i = 1; i <= months; i++) {
    const start = new Date(now)
    start.setMonth(start.getMonth() + i)
    start.setDate(1)
    start.setHours(9, 0, 0, 0)

    const end = new Date(start)
    end.setHours(start.getHours() + 1)

    events.push({
      id: `contribution-${i}`,
      title: 'Aporte mensal planejado',
      start,
      end,
      description: `Destine pelo menos ${formatCurrency(baseAmount)} aos investimentos.`
    })
  }

  return events
}

function createQuarterlyReviewEvents (months = 12) {
  const now = new Date()
  const events = []
  for (let i = 3; i <= months; i += 3) {
    const start = new Date(now)
    start.setMonth(start.getMonth() + i)
    start.setDate(5)
    start.setHours(10, 0, 0, 0)
    const end = new Date(start)
    end.setHours(start.getHours() + 1)

    events.push({
      id: `review-${i}`,
      title: 'Check-up financeiro trimestral',
      start,
      end,
      description: 'Reveja metas, aportes e recomendações para ajustar o plano.'
    })
  }
  return events
}

export function CalendarPlanner ({ payload, recommendations }) {
  const personaName = recommendations?.persona?.name ?? 'Plano atual'
  const monthlyEvents = useMemo(() => createMonthlyContributionEvents(payload), [payload])
  const reviewEvents = useMemo(() => createQuarterlyReviewEvents(), [])

  const nextReview = reviewEvents[0]
  const googleLink = nextReview
    ? buildGoogleCalendarLink({
        title: nextReview.title,
        details: nextReview.description,
        start: nextReview.start,
        end: nextReview.end
      })
    : null

  return (
    <section className="panel">
      <h3 className="panel-title">Integração com calendários</h3>
      <p className="panel-subtitle">Gere eventos para manter seus aportes e checkpoints em dia ({personaName}).</p>

      <div className="stack-space">
        <div className="calendar-card">
          <h4>Aportes mensais</h4>
          <p>Crie eventos recorrentes para lembrar-se de investir logo após receber a renda.</p>
          <button type="button" className="button-primary" onClick={() => downloadIcs(monthlyEvents, 'aportes-mensais.ics')}>
            Baixar lembretes (ICS)
          </button>
        </div>

        <div className="calendar-card">
          <h4>Revisões trimestrais</h4>
          <p>Acompanhe metas e recomendações a cada trimestre.</p>
          <button type="button" className="button-primary" onClick={() => downloadIcs(reviewEvents, 'revisoes-trimestrais.ics')}>
            Baixar checkpoints (ICS)
          </button>
          {googleLink && (
            <a className="button-ghost" href={googleLink} target="_blank" rel="noopener noreferrer">
              Adicionar próxima revisão ao Google Calendar
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

CalendarPlanner.propTypes = {
  payload: PropTypes.object,
  recommendations: PropTypes.object
}
