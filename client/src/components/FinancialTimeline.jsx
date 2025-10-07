import PropTypes from 'prop-types'
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from 'chart.js'
import { Line } from 'react-chartjs-2'

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend)

const DEFAULT_JOB_LOSS_MONTH = 6
const UNEXPECTED_EXPENSE_MONTH = 6

function buildEvents (baseline, input, summary) {
  if (!baseline) return []
  const timelineMap = new Map(baseline.timeline.map((point) => [point.month, point]))
  const events = []

  if (input?.scenario?.oneTimeExtraIncome > 0) {
    const month = 1
    const point = timelineMap.get(month)
    events.push({
      id: 'extra-income',
      month,
      value: point?.balance ?? input.currentSavings,
      color: '#22c55e',
      label: 'Receita extra',
      description: `Receita extra de R$ ${input.scenario.oneTimeExtraIncome.toLocaleString('pt-BR')}`
    })
  }

  if (input?.scenario?.unexpectedExpense > 0) {
    const month = UNEXPECTED_EXPENSE_MONTH
    const point = timelineMap.get(month)
    events.push({
      id: 'unexpected-expense',
      month,
      value: point?.balance ?? 0,
      color: '#f97316',
      label: 'Gasto inesperado',
      description: `Despesa inesperada de R$ ${input.scenario.unexpectedExpense.toLocaleString('pt-BR')}`
    })
  }

  if (input?.scenario?.jobLossMonths > 0) {
    const month = DEFAULT_JOB_LOSS_MONTH
    const point = timelineMap.get(month)
    events.push({
      id: 'job-loss',
      month,
      value: point?.balance ?? 0,
      color: '#ef4444',
      label: 'Perda de renda',
      description: `${input.scenario.jobLossMonths} mês(es) sem renda estimados`
    })
  }

  if (summary?.baseline?.goalAchieved) {
    const month = summary.baseline.goalAchievedMonth
    const point = timelineMap.get(month)
    events.push({
      id: 'goal-achieved',
      month,
      value: point?.balance ?? summary.baseline.finalBalance,
      color: '#38bdf8',
      label: 'Meta atingida',
      description: `Meta alcançada em ${Math.ceil(month / 12)}º ano`
    })
  }

  return events
}

export function FinancialTimeline ({ baseline, input, summary, tourId }) {
  if (!baseline) return null

  const events = buildEvents(baseline, input, summary)

  const data = {
    datasets: [
      {
        type: 'line',
        label: 'Saldo acumulado',
        data: baseline.timeline.map((point) => ({ x: point.month, y: Math.round(point.balance) })),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.25)',
        tension: 0.3,
        pointRadius: 0
      },
      {
        type: 'scatter',
        label: 'Eventos financeiros',
        data: events.map((event) => ({
          x: event.month,
          y: Math.round(event.value),
          metadata: event
        })),
        pointRadius: 6,
        pointHoverRadius: 9,
        pointBackgroundColor: events.map((event) => event.color),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2
      }
    ]
  }

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    parsing: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (ctx.dataset.type === 'scatter') {
              return ctx.raw.metadata.description
            }
            return `Saldo: R$ ${ctx.parsed.y.toLocaleString('pt-BR')}`
          },
          title: (ctx) => {
            const month = ctx[0].parsed.x
            const year = Math.ceil(month / 12)
            return `Mês ${month} • Ano ${year}`
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        ticks: {
          color: '#94a3b8',
          callback: (value) => `M${value}`
        },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
        },
        grid: { color: 'rgba(148, 163, 184, 0.12)' }
      }
    }
  }

  return (
    <section className="timeline-card focus-optional" data-tour={tourId}>
      <header className="panel-header">
        <h2 className="panel-title">Linha do tempo financeira</h2>
        <p className="panel-subtitle">Eventos críticos e hitos durante a projeção base.</p>
      </header>

      <div className="timeline-legend">
        {events.map((event) => (
          <span key={event.id}>
            <i style={{ background: event.color }} />
            {event.label}
          </span>
        ))}
      </div>

      <div className="timeline-canvas">
        <Line data={data} options={options} />
      </div>
    </section>
  )
}

FinancialTimeline.propTypes = {
  baseline: PropTypes.shape({
    timeline: PropTypes.array
  }),
  input: PropTypes.object,
  summary: PropTypes.object,
  tourId: PropTypes.string
}
