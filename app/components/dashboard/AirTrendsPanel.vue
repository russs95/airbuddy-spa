<script setup lang="ts">
import TrendChartCard from '~/components/dashboard/TrendChartCard.vue'
import RangeBar from '~/components/dashboard/RangeBar.vue'
import {
  TREND_RANGE_KEYS, ECO2_THRESHOLD_BANDS, TEMP_THRESHOLD_BANDS,
  HUMIDITY_THRESHOLD_BANDS, TVOC_THRESHOLD_BANDS,
} from '~/lib/trendConfig'

const {
  selectedDeviceUid, universalRange, chartExpanded, mergedTimestamps,
  trends, trendsPending, trendsError, trendsErrorMessage,
  co2Series, tempSeries, humiditySeries, tvocSeries,
} = useDashboard()

const colorMode = useColorMode()
const chartTheme = computed<'light' | 'dark'>(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

// Shared empty/loading/error placeholder for the four trend charts.
const placeholder = computed<{ text: string; error: boolean } | null>(() => {
  if (!selectedDeviceUid.value) return { text: 'Select a device to view trends.', error: false }
  if (trendsPending.value) return { text: 'Loading…', error: false }
  if (trendsError.value) return { text: `Trends failed: ${trendsErrorMessage.value}`, error: true }
  if (!trends.value?.timestamps?.length) return { text: 'No trend data yet for this device.', error: false }
  return null
})
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-4' }">
    <template #header>
      <div class="lp:flex lp:items-center lp:justify-between lp:gap-3 lp:flex-wrap">
        <h2 class="lp:text-base lp:font-semibold">Air Quality Trends</h2>
        <RangeBar v-model="universalRange" :items="TREND_RANGE_KEYS" />
      </div>
    </template>

    <div class="lp:grid lp:grid-cols-1 lp:xl:grid-cols-2 lp:gap-3">
      <TrendChartCard
        v-model:expanded="chartExpanded.eco2"
        title="CO₂"
        :timestamps="mergedTimestamps"
        :series="co2Series"
        :range="universalRange"
        :theme="chartTheme"
        unit="ppm"
        :decimals="0"
        :y-min="350"
        :threshold-bands="ECO2_THRESHOLD_BANDS"
        :show-legend="co2Series.length > 1"
        :placeholder="placeholder?.text ?? null"
        :placeholder-error="placeholder?.error ?? false"
      />
      <TrendChartCard
        v-model:expanded="chartExpanded.temp"
        title="Temperature"
        :timestamps="mergedTimestamps"
        :series="tempSeries"
        :range="universalRange"
        :theme="chartTheme"
        unit="°C"
        :decimals="1"
        :y-pad="5"
        :base-height="220"
        :expanded-height="440"
        :threshold-bands="TEMP_THRESHOLD_BANDS"
        :show-legend="tempSeries.length > 1"
        :placeholder="placeholder?.text ?? null"
        :placeholder-error="placeholder?.error ?? false"
      />
      <TrendChartCard
        v-model:expanded="chartExpanded.humidity"
        title="Humidity"
        :timestamps="mergedTimestamps"
        :series="humiditySeries"
        :range="universalRange"
        :theme="chartTheme"
        unit="%"
        :decimals="1"
        :threshold-bands="HUMIDITY_THRESHOLD_BANDS"
        :show-legend="humiditySeries.length > 1"
        :placeholder="placeholder?.text ?? null"
        :placeholder-error="placeholder?.error ?? false"
      />
      <TrendChartCard
        v-model:expanded="chartExpanded.tvoc"
        title="TVOC"
        :timestamps="mergedTimestamps"
        :series="tvocSeries"
        :range="universalRange"
        :theme="chartTheme"
        unit="ppb"
        :decimals="0"
        :y-min="0"
        :threshold-bands="TVOC_THRESHOLD_BANDS"
        :show-legend="tvocSeries.length > 1"
        :placeholder="placeholder?.text ?? null"
        :placeholder-error="placeholder?.error ?? false"
      />
    </div>
  </UCard>
</template>
