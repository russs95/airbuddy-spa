<script setup lang="ts">
import LocationMap from '~/components/LocationMap.vue'
import { ROUTE_SLIDER_STEPS } from '~/lib/trendConfig'

const {
  selectedDeviceUid, live, livePending, gpsMode, mapExpanded,
  routeCoords, routePending, routeSliderIndex, openLocationModal,
} = useDashboard()

const colorMode = useColorMode()
const chartTheme = computed<'light' | 'dark'>(() => (colorMode.value === 'dark' ? 'dark' : 'light'))

const sliderMax = ROUTE_SLIDER_STEPS.length - 1
const sliderLabel = computed(() => ROUTE_SLIDER_STEPS[routeSliderIndex.value]?.label ?? '')
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-3' }">
    <template #header>
      <div class="lp:flex lp:items-center lp:justify-between lp:gap-2 lp:flex-wrap">
        <h2 class="lp:text-base lp:font-semibold">
          {{ gpsMode === 'route' ? 'GPS Route' : 'Current Location' }}
        </h2>
        <div class="lp:flex lp:items-center lp:gap-2">
          <UButtonGroup size="xs">
            <UButton
              :color="gpsMode === 'location' ? 'primary' : 'neutral'"
              :variant="gpsMode === 'location' ? 'solid' : 'soft'"
              label="Location"
              @click="gpsMode = 'location'"
            />
            <UButton
              :color="gpsMode === 'route' ? 'primary' : 'neutral'"
              :variant="gpsMode === 'route' ? 'solid' : 'soft'"
              label="Route"
              @click="gpsMode = 'route'"
            />
          </UButtonGroup>
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-settings"
            title="Set device location manually"
            :disabled="!selectedDeviceUid"
            @click="openLocationModal()"
          />
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            :icon="mapExpanded ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            :title="mapExpanded ? 'Collapse map' : 'Expand map'"
            @click="mapExpanded = !mapExpanded"
          />
        </div>
      </div>
    </template>

    <div v-if="!selectedDeviceUid" class="lp:text-sm lp:text-(--ui-text-muted)">
      Select a device to view location.
    </div>
    <div v-else-if="livePending && gpsMode === 'location'" class="lp:text-sm lp:text-(--ui-text-muted)">
      Loading…
    </div>
    <div v-else>
      <div class="lp:relative lp:rounded-lg lp:overflow-hidden">
        <LocationMap
          :lat="live?.last_gps_lat ?? null"
          :lon="live?.last_gps_lon ?? null"
          :height="mapExpanded ? 420 : 180"
          :theme="chartTheme"
          :mode="gpsMode"
          :route-coords="routeCoords"
        />
        <div
          v-if="routePending && gpsMode === 'route'"
          class="lp:absolute lp:top-2 lp:right-2 lp:rounded lp:bg-(--ui-bg-elevated) lp:shadow lp:px-2 lp:py-1 lp:text-xs lp:text-(--ui-text-muted)"
        >
          Updating route…
        </div>
      </div>

      <div class="lp:mt-2 lp:flex lp:flex-wrap lp:gap-x-4 lp:gap-y-1 lp:text-xs lp:text-(--ui-text-muted)">
        <template v-if="gpsMode === 'location'">
          <template v-if="live?.last_gps_lat != null && live?.last_gps_lon != null">
            <span><strong>Lat:</strong> {{ Number(live.last_gps_lat).toFixed(6) }}°</span>
            <span><strong>Lon:</strong> {{ Number(live.last_gps_lon).toFixed(6) }}°</span>
            <span v-if="live?.last_gps_at"><strong>As of:</strong> {{ live.last_gps_at }}</span>
            <span v-if="live?.last_gps_at !== live?.recorded_at">(GPS from earlier reading)</span>
          </template>
          <span v-else>No GPS data found for this device.</span>
        </template>
        <template v-else>
          <span v-if="routeCoords.length">
            <strong>{{ routeCoords.length }}</strong> GPS point{{ routeCoords.length !== 1 ? 's' : '' }} · green = start, blue = latest
          </span>
          <span v-else>No GPS coordinates in this time range.</span>
        </template>
      </div>

      <!-- Route time-range slider -->
      <div
        class="lp:mt-3 lp:transition-opacity"
        :class="gpsMode === 'route' ? 'lp:opacity-100' : 'lp:opacity-40 lp:pointer-events-none'"
      >
        <div class="lp:flex lp:items-center lp:gap-2 lp:mb-1">
          <span class="lp:text-xs lp:text-(--ui-text-muted)">Route range</span>
          <span class="lp:text-xs lp:font-medium">{{ sliderLabel }}</span>
          <span v-if="routePending" class="lp:text-xs lp:text-(--ui-text-muted)">Loading…</span>
        </div>
        <input
          v-model.number="routeSliderIndex"
          type="range"
          min="0"
          :max="sliderMax"
          step="1"
          class="lp:w-full lp:accent-(--ui-primary)"
          aria-label="Route time range"
        />
        <div class="lp:flex lp:justify-between lp:text-xs lp:text-(--ui-text-muted)">
          <span>15m</span><span>3h</span><span>12h</span><span>36h</span><span>72h</span><span>5d</span>
        </div>
      </div>
    </div>
  </UCard>
</template>
