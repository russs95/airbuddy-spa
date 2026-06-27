<script setup lang="ts">
import AirTrendChart from '~/components/charts/AirTrendChart.vue'
import type { SeriesDef, ThresholdBand } from '~/components/charts/AirTrendChart.vue'

const props = withDefaults(defineProps<{
  title: string
  timestamps: Array<number | null>
  series: SeriesDef[]
  range: string
  theme: 'light' | 'dark'
  unit?: string
  decimals?: number
  thresholdBands?: ThresholdBand[]
  yMin?: number
  yMax?: number
  yPad?: number
  baseHeight?: number
  expandedHeight?: number
  showLegend?: boolean
  expandable?: boolean
  // Non-null → show this message instead of the chart.
  placeholder?: string | null
  placeholderError?: boolean
}>(), {
  unit: '',
  decimals: 0,
  thresholdBands: () => [],
  baseHeight: 200,
  expandedHeight: 400,
  showLegend: false,
  expandable: true,
  placeholder: null,
  placeholderError: false,
})

const expanded = defineModel<boolean>('expanded', { default: false })
</script>

<template>
  <div class="lp:rounded-lg lp:border lp:border-(--ui-border) lp:p-3">
    <div class="lp:flex lp:items-center lp:justify-between lp:mb-2">
      <span class="lp:text-sm lp:font-medium">{{ title }}</span>
      <UButton
        v-if="expandable"
        size="xs"
        color="neutral"
        variant="ghost"
        :icon="expanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
        :aria-pressed="expanded"
        :title="expanded ? 'Collapse chart' : 'Expand chart'"
        @click="expanded = !expanded"
      />
    </div>

    <div
      v-if="placeholder"
      class="lp:flex lp:items-center lp:justify-center lp:text-sm"
      :class="placeholderError ? 'lp:text-error' : 'lp:text-(--ui-text-muted)'"
      :style="{ height: `${baseHeight}px` }"
    >
      {{ placeholder }}
    </div>

    <AirTrendChart
      v-else
      :timestamps="timestamps"
      :series="series"
      :range="range"
      :theme="theme"
      :unit="unit"
      :decimals="decimals"
      :threshold-bands="thresholdBands"
      :y-min="yMin"
      :y-max="yMax"
      :y-pad="yPad"
      :height="expanded ? expandedHeight : baseHeight"
      :show-legend="showLegend"
    />
  </div>
</template>
