<template>
  <VChart
    class="air-trend-chart"
    :option="chartOption"
    :style="{ height: `${height}px` }"
    autoresize
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  MarkAreaComponent,
  LegendComponent,
} from 'echarts/components'

use([SVGRenderer, LineChart, GridComponent, TooltipComponent, MarkAreaComponent, LegendComponent])

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SeriesDef {
  name: string
  values: Array<number | null>
  color?: string
}

export interface ThresholdBand {
  label: string
  from: number      // lower Y value (-Infinity = open bottom)
  to: number        // upper Y value (Infinity = open top)
  color: string     // rgba / hex
}

// ─── Props ────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  timestamps: Array<number | null>
  series: SeriesDef[]
  range?: string
  theme?: 'light' | 'dark'
  unit?: string
  decimals?: number
  thresholdBands?: ThresholdBand[]
  height?: number
  showLegend?: boolean
  /**
   * Hard static minimum for the Y axis (e.g. 350 for eCO₂).
   * Ignored when yPad is set.
   */
  yMin?: number
  /**
   * Hard static maximum for the Y axis.
   * Ignored when yPad is set.
   */
  yMax?: number
  /**
   * When set, the component scans the VISIBLE (range-filtered) data,
   * then sets yAxis.min = dataMin − yPad and yAxis.max = dataMax + yPad.
   * This keeps the Y scale tight and contextual as the range changes.
   * Takes precedence over yMin / yMax when provided.
   */
  yPad?: number
}>(), {
  range: '1h',
  theme: 'light',
  unit: '',
  decimals: 0,
  thresholdBands: () => [],
  height: 200,
  showLegend: false,
  yMin: undefined,
  yMax: undefined,
  yPad: undefined,
})

// ─── Range helpers ────────────────────────────────────────────────────────────

const RANGE_HOURS: Record<string, number> = {
  '15m': 0.25, '30m': 0.5, '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24,
}

const windowStartSec = computed(() => {
  const hours = RANGE_HOURS[props.range ?? '1h'] ?? 1
  let maxTs = 0
  for (const ts of props.timestamps) {
    if (ts != null && ts > maxTs) maxTs = ts
  }
  const ref = maxTs > 0 ? maxTs : Date.now() / 1000
  return ref - hours * 3600
})

// ─── Theme palette ────────────────────────────────────────────────────────────

// We do NOT pass ECharts' built-in 'dark' theme — it conflicts with our
// explicit colour system and causes legend/axis text to stay black in dark mode.
const colors = computed(() => {
  const dark = props.theme === 'dark'
  return {
    axisLine:      dark ? 'rgba(238,242,247,0.18)' : 'rgba(17,24,39,0.15)',
    axisLabel:     dark ? 'rgba(238,242,247,0.72)' : 'rgba(17,24,39,0.55)',
    splitLine:     dark ? 'rgba(238,242,247,0.07)' : 'rgba(17,24,39,0.07)',
    legendText:    dark ? '#c8d4e3'                : '#374151',
    legendInactive:dark ? 'rgba(200,212,227,0.30)' : 'rgba(55,65,81,0.30)',
    tooltip: {
      bg:     dark ? '#0d2040' : '#ffffff',
      border: dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)',
      text:   dark ? '#eef2f7' : '#111827',
    },
  }
})

// ─── Data preparation ─────────────────────────────────────────────────────────

function prepareData(values: Array<number | null>): [number, number | null][] {
  const cutoff = windowStartSec.value
  const out: [number, number | null][] = []
  let lastTs: number | null = null
  for (let i = 0; i < props.timestamps.length; i++) {
    const ts = props.timestamps[i]
    if (ts == null || ts < cutoff) continue
    // Insert a null break when the gap from the previous accepted point exceeds 5 minutes.
    // connectNulls is false, so ECharts will leave a visible gap in the line.
    if (lastTs !== null && ts - lastTs > 300) {
      out.push([(lastTs + ts) / 2 * 1000, null])
    }
    const v = values[i]
    out.push([ts * 1000, v != null && Number.isFinite(v) ? v : null])
    lastTs = ts
  }
  return out
}

// ─── Y-axis bounds ────────────────────────────────────────────────────────────

/**
 * When yPad is set, scan all visible data points across every series to find
 * the true min/max, then pad by yPad on each side.
 * Falls back to static yMin/yMax when yPad is not provided.
 */
const yAxisBounds = computed<{ min?: number; max?: number }>(() => {
  if (props.yPad !== undefined) {
    let lo = Infinity
    let hi = -Infinity
    for (const s of props.series) {
      for (const [, v] of prepareData(s.values)) {
        if (v != null && Number.isFinite(v)) {
          if (v < lo) lo = v
          if (v > hi) hi = v
        }
      }
    }
    if (!Number.isFinite(lo)) return {}
    return { min: lo - props.yPad, max: hi + props.yPad }
  }
  const out: { min?: number; max?: number } = {}
  if (props.yMin !== undefined) out.min = props.yMin
  if (props.yMax !== undefined) out.max = props.yMax
  return out
})

// ─── Threshold bands (MarkArea) ───────────────────────────────────────────────

const markAreaData = computed(() =>
  props.thresholdBands.map((band) => [
    {
      name: band.label,
      yAxis: band.from === -Infinity ? 'min' : band.from,
      itemStyle: { color: band.color },
    },
    {
      yAxis: band.to === Infinity ? 'max' : band.to,
    },
  ])
)

// ─── ECharts option ───────────────────────────────────────────────────────────

const chartOption = computed(() => {
  const c = colors.value
  const unit = props.unit ? ` ${props.unit}` : ''
  const legendTop = props.showLegend ? 28 : 12

  const echartsSeries = props.series.map((s, idx) => ({
    name: s.name,
    type: 'line' as const,
    data: prepareData(s.values),
    smooth: false,
    showSymbol: false,
    lineStyle: { color: s.color ?? '#6a1b9a', width: 2 },
    itemStyle: { color: s.color ?? '#6a1b9a' },
    connectNulls: false,
    ...(idx === 0 && markAreaData.value.length > 0
      ? {
          markArea: {
            silent: true,
            data: markAreaData.value,
            label: { show: false },
          },
        }
      : {}),
  }))

  return {
    animation: false,
    backgroundColor: 'transparent',

    ...(props.showLegend
      ? {
          legend: {
            top: 4,
            left: 'center',
            itemWidth: 18,
            itemHeight: 3,
            textStyle: { color: c.legendText, fontSize: 11 },
            inactiveColor: c.legendInactive,
          },
        }
      : {}),

    grid: {
      top: legendTop,
      right: 12,
      bottom: 28,
      left: 52,
      containLabel: false,
    },

    xAxis: {
      type: 'time' as const,
      axisLine:  { lineStyle: { color: c.axisLine } },
      axisTick:  { lineStyle: { color: c.axisLine } },
      axisLabel: {
        color: c.axisLabel,
        fontSize: 11,
        formatter: (val: number) =>
          new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit', minute: '2-digit', hour12: false,
          }).format(new Date(val)),
      },
      splitLine: { show: false },
    },

    yAxis: {
      type: 'value' as const,
      ...yAxisBounds.value,
      axisLine:  { show: false },
      axisTick:  { show: false },
      axisLabel: {
        color: c.axisLabel,
        fontSize: 11,
        formatter: (v: number) => `${v.toFixed(props.decimals)}${unit}`,
      },
      splitLine: { lineStyle: { color: c.splitLine } },
    },

    tooltip: {
      trigger: 'axis' as const,
      backgroundColor: c.tooltip.bg,
      borderColor:     c.tooltip.border,
      textStyle:       { color: c.tooltip.text, fontSize: 12 },
      axisPointer: {
        type: 'line' as const,
        lineStyle: { color: c.axisLine, width: 1, type: 'dashed' as const },
      },
      formatter(params: any[]) {
        if (!params?.length) return ''
        const timeLabel = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
        }).format(new Date(params[0].axisValue))

        const rows = params
          .map((p) => {
            const val = p.value?.[1]
            const display = val != null && Number.isFinite(val)
              ? `${Number(val).toFixed(props.decimals)}${unit}` : '—'
            return `<span style="color:${p.color}">●</span> ${p.seriesName}: <strong>${display}</strong>`
          })
          .join('<br/>')

        return `<div style="font-size:11px;margin-bottom:4px;opacity:0.7">${timeLabel}</div>${rows}`
      },
    },

    series: echartsSeries,
  }
})
</script>

<style scoped>
.air-trend-chart {
  width: 100%;
  display: block;
}
</style>
