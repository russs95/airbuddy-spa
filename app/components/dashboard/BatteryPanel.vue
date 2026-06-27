<script setup lang="ts">
import TrendChartCard from '~/components/dashboard/TrendChartCard.vue'
import RangeBar from '~/components/dashboard/RangeBar.vue'
import { TREND_RANGE_KEYS, BATT_THRESHOLD_BANDS } from '~/lib/trendConfig'

const {
  selectedDeviceUid, universalRange, chartExpanded, mergedTimestamps,
  trendsPending, trendsError, trendsErrorMessage,
  battLevelSeries, battCurrentSeries,
} = useDashboard()

const colorMode = useColorMode()
const chartTheme = computed<'light' | 'dark'>(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

function basePlaceholder() {
  if (!selectedDeviceUid.value) return { text: 'Select a device to view battery.', error: false }
  if (trendsPending.value) return { text: 'Loading…', error: false }
  if (trendsError.value) return { text: `Trends failed: ${trendsErrorMessage.value}`, error: true }
  return null
}

const chargePlaceholder = computed(() =>
  basePlaceholder() ?? (battLevelSeries.value.length ? null : { text: 'No battery data yet for this device.', error: false }))

const currentPlaceholder = computed(() => {
  if (!selectedDeviceUid.value) return { text: 'Select a device to view battery.', error: false }
  if (trendsPending.value) return { text: 'Loading…', error: false }
  return battCurrentSeries.value.length ? null : { text: 'No current data yet for this device.', error: false }
})
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-4' }">
    <template #header>
      <div class="lp:flex lp:items-center lp:justify-between lp:gap-3 lp:flex-wrap">
        <h2 class="lp:text-base lp:font-semibold">Battery</h2>
        <RangeBar v-model="universalRange" :items="TREND_RANGE_KEYS" />
      </div>
    </template>

    <div class="lp:grid lp:grid-cols-1 lp:xl:grid-cols-2 lp:gap-3">
      <TrendChartCard
        v-model:expanded="chartExpanded.battery"
        title="Charge Level"
        :timestamps="mergedTimestamps"
        :series="battLevelSeries"
        :range="universalRange"
        :theme="chartTheme"
        unit="%"
        :decimals="0"
        :y-min="0"
        :y-max="100"
        :threshold-bands="BATT_THRESHOLD_BANDS"
        :show-legend="true"
        :placeholder="chargePlaceholder?.text ?? null"
        :placeholder-error="chargePlaceholder?.error ?? false"
      />
      <TrendChartCard
        title="Current (+ charging / − discharging)"
        :expanded="chartExpanded.battery"
        :expandable="false"
        :timestamps="mergedTimestamps"
        :series="battCurrentSeries"
        :range="universalRange"
        :theme="chartTheme"
        unit="mA"
        :decimals="0"
        :y-pad="50"
        :show-legend="battCurrentSeries.length > 1"
        :placeholder="currentPlaceholder?.text ?? null"
        :placeholder-error="currentPlaceholder?.error ?? false"
      />
    </div>
  </UCard>
</template>
