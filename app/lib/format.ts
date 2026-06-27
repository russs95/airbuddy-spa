// ── Telemetry formatting helpers ──────────────────────────────────────────────

export function formatMetric(value: unknown, decimals = 0): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '--'
  return n.toFixed(decimals)
}

export function formatPacketTime(ts: unknown): string {
  const n = Number(ts)
  if (!Number.isFinite(n)) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(n * 1000))
}

export function formatPacketTimeShort(ts: unknown): string {
  const n = Number(ts)
  if (!Number.isFinite(n)) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(new Date(n * 1000))
}

export function formatPacketValue(value: unknown, decimals = 0, unit = ''): string {
  const n = Number(value)
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(decimals)}${unit ? ` ${unit}` : ''}`
}

export function aqiEmoji(aqi: unknown): string {
  const n = Number(aqi)
  if (!Number.isFinite(n)) return ''
  if (n <= 1) return '😄'
  if (n <= 2) return '🙂'
  if (n <= 3) return '😐'
  if (n <= 4) return '😟'
  return '😰'
}

export function aqiLabel(aqi: unknown): string {
  const n = Number(aqi)
  if (!Number.isFinite(n)) return '—'
  if (n <= 1) return 'Excellent'
  if (n <= 2) return 'Good'
  if (n <= 3) return 'Moderate'
  if (n <= 4) return 'Poor'
  return 'Very Poor'
}

// Whether an array contains at least one finite numeric value.
export function hasData(arr: unknown): boolean {
  return Array.isArray(arr) && arr.some(v => v !== null && Number.isFinite(Number(v)))
}

export function pretty(v: unknown): string {
  return JSON.stringify(v ?? null, null, 2)
}
