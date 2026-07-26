// ── IAQ composite score helpers ───────────────────────────────────────────────
// Computes a 0-100 Indoor Air Quality danger score from raw sensor values.
// 0 = pristine air, 100 = dangerously polluted.
// Weights: CO2 50%, TVOC 30%, Temperature 10%, Humidity 10%.
// Available sensors contribute proportionally (nulls are skipped, weights renormalised).

function co2Danger(ppm: number): number {
  // 400 ppm (outdoor baseline) → 0, 2500 ppm → 100
  return Math.min(100, Math.max(0, (ppm - 400) / (2500 - 400) * 100))
}

function tvocDanger(ppb: number): number {
  // 0 ppb → 0, 1500 ppb → 100
  return Math.min(100, Math.max(0, ppb / 1500 * 100))
}

function tempDanger(c: number, idealTemp = 21.5): number {
  // Ideal (default 21.5 °C), ±15° → 100
  return Math.min(100, Math.max(0, Math.abs(c - idealTemp) / 15 * 100))
}

function humidityDanger(pct: number, idealHumidity = 50): number {
  // Ideal (default 50 %), ±35% → 100
  return Math.min(100, Math.max(0, Math.abs(pct - idealHumidity) / 35 * 100))
}

const WEIGHTS = { co2: 0.50, tvoc: 0.30, temp: 0.10, humidity: 0.10 }

// idealTemp/idealHumidity let a room override the whole-house comfort
// default (e.g. a nursery or garage) — see rooms_tb.target_temp_c / target_humidity_pct.
export function calcIaqScore(
  co2: number | null | undefined,
  tvoc: number | null | undefined,
  temp: number | null | undefined,
  humidity: number | null | undefined,
  idealTemp?: number | null,
  idealHumidity?: number | null,
): number {
  const parts: { score: number; weight: number }[] = []
  if (co2 != null)      parts.push({ score: co2Danger(Number(co2)),      weight: WEIGHTS.co2 })
  if (tvoc != null)     parts.push({ score: tvocDanger(Number(tvoc)),     weight: WEIGHTS.tvoc })
  if (temp != null)     parts.push({ score: tempDanger(Number(temp), idealTemp ?? undefined),     weight: WEIGHTS.temp })
  if (humidity != null) parts.push({ score: humidityDanger(Number(humidity), idealHumidity ?? undefined), weight: WEIGHTS.humidity })
  if (!parts.length) return 50
  const totalW = parts.reduce((s, p) => s + p.weight, 0)
  return Math.round(parts.reduce((s, p) => s + p.score * (p.weight / totalW), 0) * 10) / 10
}

// ── Compute score array from a /api/dashboard/device-trends response ──────────
export function scoresFromTrends(
  trends: any,
  idealTemp?: number | null,
  idealHumidity?: number | null,
): number[] {
  if (!trends?.timestamps?.length) return []
  const result: number[] = []
  for (let i = 0; i < trends.timestamps.length; i++) {
    const co2      = trends.ensEco2s?.[i]       ?? trends.scdCo2s?.[i]
    const tvoc     = trends.ensTvocs?.[i]
    const temp     = trends.ahtTemps?.[i]        ?? trends.scdTemps?.[i]
    const humidity = trends.ahtHumidities?.[i]   ?? trends.scdHumidities?.[i]
    if (co2 == null && tvoc == null) continue   // skip if no primary sensor data
    result.push(calcIaqScore(co2, tvoc, temp, humidity, idealTemp, idealHumidity))
  }
  return result
}

// ── Labels & colours ──────────────────────────────────────────────────────────
export function iaqLabel(score: number): string {
  if (score < 20) return 'Excellent'
  if (score < 40) return 'Good'
  if (score < 60) return 'Moderate'
  if (score < 80) return 'Poor'
  return 'Hazardous'
}

export function iaqColor(score: number): string {
  if (score < 20) return '#4ade80'
  if (score < 40) return '#86efac'
  if (score < 60) return '#fbbf24'
  if (score < 80) return '#f97316'
  return '#ef4444'
}

// ── SVG sparkline builders ────────────────────────────────────────────────────
// SVG convention: y=0 is top. score=100 (bad) → y=0 (high), score=0 (good) → y=height (low).

export function sparklinePoints(
  scores: number[],
  width = 600,
  height = 60,
): string {
  if (scores.length < 2) return ''
  return scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width
    const y = height * (1 - s / 100)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
}

export function sparklineFillPath(
  scores: number[],
  width = 600,
  height = 60,
): string {
  if (scores.length < 2) return ''
  const pts = scores.map((s, i) => {
    const x = (i / (scores.length - 1)) * width
    const y = height * (1 - s / 100)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return `M ${pts[0]} L ${pts.slice(1).join(' L ')} L ${width},${height} L 0,${height} Z`
}
