import PropTypes from 'prop-types'
import { Line } from 'react-chartjs-2'
import { ensureChartRegistration } from '@/utils/chartSetup.js'
import { formatCurrency } from '../utils/formatters.js'

ensureChartRegistration()

function buildDataset (scenarios) {
  const labels = scenarios[0]?.timeline.map((point) => `M${point.month}`) ?? []

  const datasets = scenarios.map((scenario) => ({
    label: scenario.label,
    data: scenario.timeline.map((point) => Math.round(point.balance)),
    tension: 0.35,
    fill: false,
    borderColor: scenario.color,
    backgroundColor: `${scenario.color}66`,
    borderWidth: scenario.id === 'baseline' ? 3 : 2,
    pointRadius: 0
  }))

  return { labels, datasets }
}

export function ProjectionChart ({ scenarios }) {
  if (!scenarios || scenarios.length === 0) {
    return null
  }

  const chartData = buildDataset(scenarios)

  const options = {
    maintainAspectRatio: false,
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: '#cbd5f5',
          usePointStyle: true,
          padding: 18,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
        }
      }
    },
    scales: {
      x: {
        ticks: { color: '#94a3b8', maxRotation: 0 },
        grid: { color: 'rgba(148, 163, 184, 0.15)' }
      },
      y: {
        ticks: {
          color: '#94a3b8',
          callback: (value) => formatCurrency(value)
        },
        grid: { color: 'rgba(148, 163, 184, 0.15)' }
      }
    }
  }

  return (
    <div className="chart-card" id="projection-chart">
      <h3 className="panel-title">Projeção de patrimônio</h3>
      <div style={{ height: '320px' }}>
        <Line options={options} data={chartData} />
      </div>
    </div>
  )
}

ProjectionChart.propTypes = {
  scenarios: PropTypes.array
}
