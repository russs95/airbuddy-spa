<template>
  <div class="mapOuter" :style="{ height: height + 'px' }">
    <div v-if="!hasContent" class="mapEmpty muted">
      {{ mode === 'route' ? 'No GPS route data in recent readings.' : 'No GPS location received yet.' }}
    </div>
    <div v-else ref="mapEl" class="mapEl" />
  </div>
</template>

<script setup>
const props = defineProps({
  lat:         { type: Number, default: null },
  lon:         { type: Number, default: null },
  height:      { type: Number, default: 180 },
  theme:       { type: String, default: 'light' },
  mode:        { type: String, default: 'location' },
  routeCoords: { type: Array,  default: () => [] },
})

const mapEl = ref(null)
let L             = null
let mapObj        = null
let marker        = null
let routeLine     = null
let routeMarkers  = []

function formatWaypointTime(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).format(new Date(n * 1000))
}

const hasContent = computed(() => {
  if (props.mode === 'route') return props.routeCoords.length > 0
  return props.lat != null && props.lon != null &&
    Number.isFinite(props.lat) && Number.isFinite(props.lon)
})

async function loadLeaflet() {
  if (L) return
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

function clearRouteLayers() {
  routeLine?.remove()
  routeLine = null
  routeMarkers.forEach(m => m.remove())
  routeMarkers = []
}

function clearLocationLayer() {
  marker?.remove()
  marker = null
}

async function render() {
  if (!hasContent.value || !mapEl.value) return
  await loadLeaflet()

  if (!mapObj) {
    const center = props.mode === 'route'
      ? props.routeCoords[props.routeCoords.length - 1]
      : [props.lat, props.lon]
    mapObj = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: false })
      .setView(center, 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapObj)
  }

  clearRouteLayers()
  clearLocationLayer()

  if (props.mode === 'route') {
    const coords = props.routeCoords
    const latLons = coords.map(c => [c[0], c[1]])
    routeLine = L.polyline(latLons, { color: '#3b82f6', weight: 3, opacity: 0.85 }).addTo(mapObj)

    for (let i = 0; i < coords.length; i++) {
      const [lat, lon, ts] = coords[i]
      const isFirst = i === 0 && coords.length > 1
      const isLast  = i === coords.length - 1

      const label = isFirst ? 'Start' : isLast ? 'Latest' : `Waypoint ${i + 1}`
      const timeStr = formatWaypointTime(ts)
      const popup = `<div style="font-size:12px;line-height:1.6"><b>${label}</b><br>${timeStr}<br>${lat.toFixed(6)}°, ${lon.toFixed(6)}°</div>`

      const m = L.circleMarker([lat, lon], {
        radius:      isFirst ? 6 : isLast ? 7 : 4,
        fillColor:   isFirst ? '#22c55e' : isLast ? '#3b82f6' : '#94a3b8',
        fillOpacity: isFirst || isLast ? 1 : 0.75,
        color:       '#fff',
        weight:      2,
        className:   'routeWaypoint',
      }).addTo(mapObj).bindPopup(popup)
      routeMarkers.push(m)
    }

    mapObj.fitBounds(routeLine.getBounds(), { padding: [24, 24] })
  } else {
    mapObj.setView([props.lat, props.lon], mapObj.getZoom() || 15)
    marker = L.marker([props.lat, props.lon])
      .addTo(mapObj)
      .bindPopup(`<b>AirBuddy</b><br>${props.lat.toFixed(6)}, ${props.lon.toFixed(6)}`)
  }
}

onMounted(async () => {
  await nextTick()
  if (hasContent.value) await render()
})

watch(hasContent, async (v) => {
  if (v) {
    await nextTick()
    await render()
  } else {
    mapObj?.remove()
    mapObj = null
    marker = null
    routeLine = null
    routeMarkers = []
  }
})

watch(() => props.mode, async () => {
  await nextTick()
  await render()
})

watch(() => props.height, async () => {
  await nextTick()
  mapObj?.invalidateSize()
})

watch(() => [props.lat, props.lon], async ([lat, lon]) => {
  if (props.mode !== 'location' || !mapObj || lat == null || lon == null) return
  await nextTick()
  clearRouteLayers()
  mapObj.setView([lat, lon], mapObj.getZoom())
  if (!marker) {
    marker = L.marker([lat, lon]).addTo(mapObj)
  }
  marker.setLatLng([lat, lon])
    .setPopupContent(`<b>AirBuddy</b><br>${lat.toFixed(6)}, ${lon.toFixed(6)}`)
})

watch(() => props.routeCoords, async () => {
  if (props.mode !== 'route') return
  await nextTick()
  await render()
})

onBeforeUnmount(() => {
  mapObj?.remove()
  mapObj = null
  marker = null
  routeLine = null
  routeMarkers = []
})
</script>

<style scoped>
.mapOuter {
  position: relative;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  transition: height 0.25s ease;
}

.mapEl {
  width: 100%;
  height: 100%;
}

.mapEmpty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 13px;
}
</style>
