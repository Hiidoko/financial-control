import * as XLSX from 'xlsx'

const encoder = new TextEncoder()
const decoder = new TextDecoder()

function downloadBlob (content, filename, mime) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function exportTimelineCsv (results) {
  const baseline = results?.simulation?.scenarios?.find((scenario) => scenario.id === 'baseline')
  if (!baseline) return

  const header = ['month', 'year', 'balance', 'realBalance', 'income', 'expenses', 'contribution', 'returns', 'emergencyCoverage']
  const rows = baseline.timeline.map((point) => ([
    point.month,
    point.year,
    Math.round(point.balance),
    Math.round(point.realBalance),
    Math.round(point.income),
    Math.round(point.expenses),
    Math.round(point.contribution),
    Math.round(point.returns),
    Number(point.emergencyCoverage?.toFixed(2) ?? 0)
  ]))

  const csvLines = [header.join(','), ...rows.map((row) => row.join(','))]
  downloadBlob(csvLines.join('\n'), 'timeline-baseline.csv', 'text/csv;charset=utf-8;')
}

function toSheetFromArray (data, header) {
  const aoa = [header, ...data]
  return XLSX.utils.aoa_to_sheet(aoa)
}

export function exportExcelWorkbook (results) {
  if (!results?.simulation) return

  const workbook = XLSX.utils.book_new()
  const scenarios = results.simulation.scenarios ?? []
  const baseline = scenarios.find((scenario) => scenario.id === 'baseline')
  const optimistic = scenarios.find((scenario) => scenario.id === 'optimistic')
  const pessimistic = scenarios.find((scenario) => scenario.id === 'pessimistic')

  if (baseline) {
    const timelineRows = baseline.timeline.map((point) => ([
      point.month,
      point.year,
      point.balance,
      point.realBalance,
      point.income,
      point.expenses,
      point.contribution,
      point.returns,
      point.emergencyCoverage
    ]))
    const timelineSheet = toSheetFromArray(timelineRows, ['Mês', 'Ano', 'Saldo', 'Saldo Real', 'Receita', 'Despesas', 'Aporte', 'Rendimentos', 'Cobertura Emergência'])
    XLSX.utils.book_append_sheet(workbook, timelineSheet, 'Timeline Base')
  }

  if (results.simulation.summary?.goals) {
    const goalRows = results.simulation.summary.goals.map((goal) => ([
      goal.name,
      goal.priority,
      goal.targetAmount,
      goal.targetMonth,
      goal.shortfall,
      Math.round((goal.completionRatio ?? 0) * 100),
      goal.additionalMonthlyContribution
    ]))
    const goalSheet = toSheetFromArray(goalRows, ['Meta', 'Prioridade', 'Valor alvo', 'Prazo (meses)', 'Shortfall', 'Conclusão (%)', 'Aporte adicional'])
    XLSX.utils.book_append_sheet(workbook, goalSheet, 'Metas')
  }

  const summaryRows = []
  if (baseline) summaryRows.push(['Base', baseline.summary.finalBalance, baseline.summary.totalContributed, baseline.summary.totalReturns])
  if (optimistic) summaryRows.push(['Otimista', optimistic.summary.finalBalance, optimistic.summary.totalContributed, optimistic.summary.totalReturns])
  if (pessimistic) summaryRows.push(['Pessimista', pessimistic.summary.finalBalance, pessimistic.summary.totalContributed, pessimistic.summary.totalReturns])

  if (summaryRows.length > 0) {
    const summarySheet = toSheetFromArray(summaryRows, ['Cenário', 'Saldo final', 'Total aportado', 'Total rendimentos'])
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Cenários')
  }

  XLSX.writeFile(workbook, 'simulacao-financeira.xlsx')
}

function bufferToBase64 (buffer) {
  return btoa(String.fromCharCode(...buffer))
}

function base64ToBuffer (base64) {
  const binary = atob(base64)
  const len = binary.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

async function deriveKey (password, salt) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 120000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function createShareLink (payload, results, password) {
  if (!password) throw new Error('Informe uma senha para proteger o link')
  const fullPayload = { payload, summary: results?.simulation?.summary ?? null }
  const encoded = encoder.encode(JSON.stringify(fullPayload))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await deriveKey(password, salt)
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)
  const cipherBytes = new Uint8Array(cipherBuffer)

  const envelope = {
    v: 1,
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(cipherBytes)
  }

  const hash = btoa(JSON.stringify(envelope))
  return `${window.location.origin}${window.location.pathname}#share=${encodeURIComponent(hash)}`
}

export async function decryptShareFragment (fragment, password) {
  if (!fragment || !password) throw new Error('Link ou senha inválidos')
  const decodedEnvelope = JSON.parse(atob(decodeURIComponent(fragment)))
  const salt = base64ToBuffer(decodedEnvelope.salt)
  const iv = base64ToBuffer(decodedEnvelope.iv)
  const data = base64ToBuffer(decodedEnvelope.data)
  const key = await deriveKey(password, salt)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  const json = decoder.decode(decrypted)
  return JSON.parse(json)
}

export function extractShareFragment () {
  if (typeof window === 'undefined') return null
  const hash = window.location.hash ?? ''
  const match = hash.match(/share=([^&]+)/)
  return match ? match[1] : null
}

function formatDateForICS (date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
}

export function downloadIcs (events, filename = 'lembrancas-financeiras.ics') {
  if (!Array.isArray(events) || events.length === 0) return
  const now = new Date()
  const dtStamp = formatDateForICS(now)
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Financial Control//PT-BR',
    'CALSCALE:GREGORIAN'
  ]

  events.forEach((event) => {
    const uid = `${event.id || crypto.randomUUID()}@financial-control`
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTAMP:${dtStamp}`)
    lines.push(`DTSTART:${formatDateForICS(event.start)}`)
    if (event.end) {
      lines.push(`DTEND:${formatDateForICS(event.end)}`)
    }
    lines.push(`SUMMARY:${event.title}`)
    if (event.description) {
      lines.push(`DESCRIPTION:${event.description}`)
    }
    lines.push('END:VEVENT')
  })

  lines.push('END:VCALENDAR')
  downloadBlob(lines.join('\r\n'), filename, 'text/calendar;charset=utf-8;')
}

export function buildGoogleCalendarLink ({ title, details, start, end }) {
  const format = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details,
    dates: `${format(start)}/${format(end)}`
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export { downloadBlob }
