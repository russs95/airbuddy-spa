<template>
  <div class="mapOuter" :style="{ height: height + 'px' }">
    <div v-if="!hasCoords" class="mapEmpty muted">No GPS location received yet.</div>
    <div v-else ref="mapEl" class="mapEl" />
  </div>
</template>

<script setup>
const props = defineProps({
  lat:    { type: Number, default: null },
  lon:    { type: Number, default: null },
  height: { type: Number, default: 180 },
  theme:  { type: String, default: 'light' },
})

const mapEl = ref(null)
let L      = null
let mapObj = null
let marker = null

const hasCoords = computed(() =>
  props.lat != null && props.lon != null &&
  Number.isFinite(props.lat) && Number.isFinite(props.lon)
)

async function loadLeaflet() {
  if (L) return
  L = (await import('leaflet')).default
  await import('leaflet/dist/leaflet.css')
  // Fix bundler stripping of default icon paths
  delete L.Icon.Default.prototype._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  })
}

async function initMap() {
  if (!hasCoords.value || !mapEl.value) return
  await loadLeaflet()

  if (!mapObj) {
    mapObj = L.map(mapEl.value, { zoomControl: true, scrollWheelZoom: false })
      .setView([props.lat, props.lon], 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapObj)
    marker = L.marker([props.lat, props.lon])
      .addTo(mapObj)
      .bindPopup(`<b>AirBuddy</b><br>${props.lat.toFixed(6)}, ${props.lon.toFixed(6)}`)
  } else {
    mapObj.setView([props.lat, props.lon], mapObj.getZoom())
    marker?.setLatLng([props.lat, props.lon])
      .setPopupContent(`<b>AirBuddy</b><br>${props.lat.toFixed(6)}, ${props.lon.toFixed(6)}`)
  }
}

onMounted(async () => {
  await nextTick()
  if (hasCoords.value) await initMap()
})

watch(hasCoords, async (v) => {
  if (v) { await nextTick(); await initMap() }
})

watch(() => props.height, async () => {
  await nextTick()
  mapObj?.invalidateSize()
})

watch(() => [props.lat, props.lon], async ([lat, lon]) => {
  if (!mapObj || lat == null || lon == null) return
  await nextTick()
  mapObj.setView([lat, lon], mapObj.getZoom())
  marker?.setLatLng([lat, lon])
    .setPopupContent(`<b>AirBuddy</b><br>${lat.toFixed(6)}, ${lon.toFixed(6)}`)
})

onBeforeUnmount(() => {
  mapObj?.remove()
  mapObj = null
  marker = null
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
