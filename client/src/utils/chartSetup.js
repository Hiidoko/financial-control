import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Title,
  Filler,
  ScatterController,
  LineController
} from 'chart.js'

// Registro centralizado incluindo controlador scatter necessário para datasets type: 'scatter'
let registered = false
export function ensureChartRegistration () {
  if (registered) return ChartJS
  ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    LineController,
    ScatterController,
    Tooltip,
    Legend,
    Title,
    Filler
  )
  registered = true
  return ChartJS
}
