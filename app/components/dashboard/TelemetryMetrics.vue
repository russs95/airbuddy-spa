<script setup lang="ts">
import { formatMetric, aqiEmoji, aqiLabel } from '~/lib/format'

const {
  selectedDeviceUid, livePending, liveError, liveErrorMessage, live,
} = useDashboard()

const metrics = computed(() => {
  const l = live.value
  if (!l) return []
  const out: { label: string; value: string; unit?: string }[] = [
    { label: 'CO₂', value: formatMetric(l.ens_eco2 ?? l.scd_co2, 0), unit: 'ppm' },
    { label: 'Temperature', value: formatMetric(l.aht_temp ?? l.scd_temp, 1), unit: '°C' },
    { label: 'Humidity', value: formatMetric(l.aht_humidity ?? l.scd_humidity, 1), unit: '%' },
    { label: 'AQI', value: formatMetric(l.ens_aqi, 0) },
  ]
  if (l.ina_batt_pct != null) out.push({ label: 'Battery', value: formatMetric(l.ina_batt_pct, 0), unit: '%' })
  if (l.ina_bus_v != null) out.push({ label: 'Bus V', value: formatMetric(l.ina_bus_v, 2), unit: 'V' })
  return out
})
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-4' }">
    <template #header>
      <h2 class="lp:text-base lp:font-semibold">Latest Telemetry</h2>
    </template>

    <div v-if="!selectedDeviceUid" class="lp:text-sm lp:text-(--ui-text-muted)">
      Select a device to view live telemetry.
    </div>
    <div v-else-if="livePending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading latest telemetry…</div>
    <UAlert
      v-else-if="liveError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="`Latest telemetry failed: ${liveErrorMessage}`"
    />
    <template v-else>
      <div
        v-if="live?.ens_aqi != null"
        class="lp:flex lp:items-center lp:gap-3 lp:rounded-lg lp:border lp:border-(--ui-border) lp:bg-(--ui-bg-muted) lp:px-4 lp:py-3"
      >
        <span class="lp:text-2xl">{{ aqiEmoji(live.ens_aqi) }}</span>
        <span class="lp:font-medium">AQI {{ live.ens_aqi }} — {{ aqiLabel(live.ens_aqi) }}</span>
      </div>

      <div class="lp:grid lp:grid-cols-2 lp:sm:grid-cols-3 lp:lg:grid-cols-6 lp:gap-3">
        <div
          v-for="m in metrics"
          :key="m.label"
          class="lp:rounded-lg lp:border lp:border-(--ui-border) lp:bg-(--ui-bg-elevated) lp:p-3"
        >
          <div class="lp:text-xs lp:text-(--ui-text-muted)">{{ m.label }}</div>
          <div class="lp:text-2xl lp:font-semibold lp:leading-tight">{{ m.value }}</div>
          <div v-if="m.unit" class="lp:text-xs lp:text-(--ui-text-muted)">{{ m.unit }}</div>
        </div>
      </div>

      <div class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:gap-x-6 lp:gap-y-1 lp:text-xs lp:text-(--ui-text-muted)">
        <div><strong>Device:</strong> {{ live?.device_name || selectedDeviceUid || '—' }}</div>
        <div><strong>Home:</strong> {{ live?.home_name || '—' }}</div>
        <div><strong>Room:</strong> {{ live?.room_name || '—' }}</div>
        <div><strong>Recorded:</strong> {{ live?.recorded_at || '—' }}</div>
        <div><strong>Received:</strong> {{ live?.received_at || '—' }}</div>
      </div>
    </template>
  </UCard>
</template>
