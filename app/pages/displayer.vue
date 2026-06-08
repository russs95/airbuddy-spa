<script setup lang="ts">
import { scoresFromTrends, sparklinePoints, sparklineFillPath, iaqColor, iaqLabel as calcIaqLabel } from '../lib/iaqScore'

definePageMeta({ layout: false })

useHead({
  bodyAttrs: { style: 'overflow:hidden;margin:0;padding:0;' },
})

// ── Auth ─────────────────────────────────────────────────────────────────────
const { data: me } = await useFetch('/api/me', {
  credentials: 'include',
  headers: { 'Cache-Control': 'no-cache' },
})

// ── Devices ──────────────────────────────────────────────────────────────────
const { data: devicesData } = await useFetch('/api/dashboard/devices', {
  credentials: 'include',
  headers: { 'Cache-Control': 'no-cache' },
  default: () => ({ ok: true, devices: [] }),
})
const devices = computed<any[]>(() => (devicesData.value as any)?.devices ?? [])

// ── Device selection (persisted to localStorage) ─────────────────────────────
const selectedDeviceUid = ref('')

watch(
  devices,
  (list) => {
    if (!list.length) { selectedDeviceUid.value = ''; return }
    if (selectedDeviceUid.value && list.some((d: any) => d.device_uid === selectedDeviceUid.value)) return
    const saved = process.client ? localStorage.getItem('airbuddy-displayer-device') : null
    if (saved && list.some((d: any) => d.device_uid === saved)) {
      selectedDeviceUid.value = saved
    } else {
      selectedDeviceUid.value = list[0].device_uid
    }
  },
  { immediate: true },
)

watch(selectedDeviceUid, (uid) => {
  if (process.client && uid) localStorage.setItem('airbuddy-displayer-device', uid)
})

// ── Display settings (persisted to localStorage) ─────────────────────────────
const show = reactive({
  location: true,
  time: true,
  gps: true,
  temp: true,
  humidity: true,
  co2: true,
  tvoc: true,
  aqi: true,
})

if (process.client) {
  try {
    const saved = localStorage.getItem('airbuddy-displayer-show')
    if (saved) Object.assign(show, JSON.parse(saved))
  } catch {}
}

watch(
  () => ({ ...show }),
  (val) => { if (process.client) localStorage.setItem('airbuddy-displayer-show', JSON.stringify(val)) },
  { deep: true },
)

// ── Screen wake lock ──────────────────────────────────────────────────────────
let wakeLock: any = null

async function acquireWakeLock() {
  if (!process.client || !('wakeLock' in navigator)) return
  try { wakeLock = await (navigator as any).wakeLock.request('screen') } catch {}
}

// ── Fullscreen ────────────────────────────────────────────────────────────────
const isFullscreen = ref(false)

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen()
  }
}

// ── Connection state ──────────────────────────────────────────────────────────
const pollFailCount = ref(0)
const isOffline = computed(() => pollFailCount.value >= 2)

// ── Live telemetry ────────────────────────────────────────────────────────────
const live = ref<any>(null)
const liveLoading = ref(false)

async function fetchLive() {
  if (!selectedDeviceUid.value) return
  try {
    liveLoading.value = true
    live.value = await $fetch('/api/dashboard/device-live', {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      query: { device_uid: selectedDeviceUid.value },
    })
    pollFailCount.value = 0
  } catch (e) {
    pollFailCount.value++
    console.error('[displayer] live fetch failed', e)
  } finally {
    liveLoading.value = false
  }
}

watch(selectedDeviceUid, () => {
  live.value = null
  fetchLive()
})

// ── IAQ composite score — 6-hour sparkline ────────────────────────────────────
const iaqTrends = ref<any>(null)
let iaqPollInterval: ReturnType<typeof setInterval> | null = null

async function fetchIaqTrends() {
  if (!selectedDeviceUid.value) return
  try {
    iaqTrends.value = await $fetch('/api/dashboard/device-trends', {
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      query: { device_uid: selectedDeviceUid.value, hours: 7 },
    })
  } catch (e) {
    console.error('[displayer] IAQ trends fetch failed', e)
  }
}

watch(selectedDeviceUid, () => {
  iaqTrends.value = null
  fetchIaqTrends()
})

const iaqScores = computed(() => scoresFromTrends(iaqTrends.value))
const iaqCurrentScore = computed<number | null>(() => {
  const s = iaqScores.value
  return s.length ? s[s.length - 1] : null
})
const iaqSparkColor = computed(() => iaqCurrentScore.value != null ? iaqColor(iaqCurrentScore.value) : '#94a3b8')
const iaqLinePoints = computed(() => sparklinePoints(iaqScores.value, 600, 56))
const iaqFillPath = computed(() => sparklineFillPath(iaqScores.value, 600, 56))

let pollInterval: ReturnType<typeof setInterval> | null = null
let clockInterval: ReturnType<typeof setInterval> | null = null

const now = ref(new Date())

onMounted(() => {
  fetchLive()
  fetchIaqTrends()
  acquireWakeLock()
  pollInterval = setInterval(fetchLive, 30_000)
  iaqPollInterval = setInterval(fetchIaqTrends, 5 * 60_000)
  clockInterval = setInterval(() => { now.value = new Date() }, 1000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') acquireWakeLock()
  })
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })
})

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval)
  if (iaqPollInterval) clearInterval(iaqPollInterval)
  if (clockInterval) clearInterval(clockInterval)
  wakeLock?.release()
})

// ── Settings modal ────────────────────────────────────────────────────────────
const settingsOpen = ref(false)

function onDeviceChange() {
  settingsOpen.value = false
  live.value = null
  fetchLive()
}

// ── Derived metric values ─────────────────────────────────────────────────────
const tempValue = computed<number | null>(() => {
  const v = live.value?.aht_temp ?? live.value?.scd_temp ?? live.value?.bme_temp
  return v != null ? Number(v) : null
})
const co2Value = computed<number | null>(() => {
  const v = live.value?.ens_eco2 ?? live.value?.scd_co2
  return v != null ? Number(v) : null
})
const humidityValue = computed<number | null>(() => {
  const v = live.value?.aht_humidity ?? live.value?.scd_humidity ?? live.value?.bme_humidity
  return v != null ? Number(v) : null
})
const tvocValue = computed<number | null>(() => {
  const v = live.value?.ens_tvoc
  return v != null ? Number(v) : null
})
const aqiValue = computed<number | null>(() => {
  const v = live.value?.ens_aqi
  return v != null ? Number(v) : null
})

// ── Freshness ─────────────────────────────────────────────────────────────────
const isFresh = computed(() => {
  const r = live.value?.recorded_at
  if (!r) return false
  return Date.now() - new Date(r).getTime() < 5 * 60 * 1000
})

// ── GPS — only update the displayed map if coordinates actually move ──────────
const displayedGps = ref<{ lat: number; lon: number } | null>(null)

watch(live, (liveVal) => {
  if (!liveVal) return
  const lat = Number(liveVal.last_gps_lat)
  const lon = Number(liveVal.last_gps_lon)
  if (!isFinite(lat) || !isFinite(lon) || (lat === 0 && lon === 0)) return
  if (
    !displayedGps.value ||
    Math.abs(lat - displayedGps.value.lat) > 0.00005 ||
    Math.abs(lon - displayedGps.value.lon) > 0.00005
  ) {
    displayedGps.value = { lat, lon }
  }
})

const hasGps = computed(() => displayedGps.value !== null)

const gpsEmbedUrl = computed(() => {
  if (!displayedGps.value) return ''
  const { lat, lon } = displayedGps.value
  const d = 0.008
  return `https://www.openstreetmap.org/export/embed.html?bbox=${lon - d},${lat - d},${lon + d},${lat + d}&layer=mapnik&marker=${lat},${lon}`
})

// ── Trend buffer (rolling window per metric, drives direction arrows) ─────────
const TREND_SIZE = 6
const trendBuffer = reactive<Record<string, number[]>>({ temp: [], co2: [], humidity: [], tvoc: [] })

watch(live, (liveVal) => {
  if (!liveVal) return
  const push = (key: string, v: any) => {
    if (v == null) return
    const buf = trendBuffer[key]
    buf.push(Number(v))
    if (buf.length > TREND_SIZE) buf.shift()
  }
  push('temp', liveVal.aht_temp ?? liveVal.scd_temp ?? liveVal.bme_temp)
  push('co2', liveVal.ens_eco2 ?? liveVal.scd_co2)
  push('humidity', liveVal.aht_humidity ?? liveVal.scd_humidity ?? liveVal.bme_humidity)
  push('tvoc', liveVal.ens_tvoc)
})

function trendArrow(buf: number[]): '▲' | '▼' | '→' | '' {
  if (buf.length < 2) return ''
  const first = buf[0], last = buf[buf.length - 1]
  if (Math.abs(last - first) / (Math.abs(first) || 1) < 0.015) return '→'
  return last > first ? '▲' : '▼'
}

// goodDir: 1 = rising is healthy, -1 = falling is healthy, 0 = neutral
function trendClass(buf: number[], goodDir: 1 | -1 | 0 = 0): string {
  const a = trendArrow(buf)
  if (!a || a === '→') return 'trendFlat'
  if (goodDir === 0) return 'trendNeutral'
  return ((a === '▲') === (goodDir === 1)) ? 'trendGood' : 'trendWarn'
}

// ── Color helpers ─────────────────────────────────────────────────────────────
function tempBgClass(t: number | null): string {
  if (t == null) return 'bgNeutral'
  if (t >= 18 && t <= 25) return 'bgGood'
  if ((t >= 14 && t < 18) || (t > 25 && t <= 28)) return 'bgModerate'
  if ((t >= 8 && t < 14) || (t > 28 && t <= 32)) return 'bgPoor'
  return 'bgBad'
}

function co2BgClass(ppm: number | null): string {
  if (ppm == null) return 'bgNeutral'
  if (ppm < 800) return 'bgCo2Good'
  if (ppm < 1000) return 'bgModerate'
  if (ppm < 1400) return 'bgPoor'
  return 'bgBad'
}

function humidityBgStyle(h: number | null): Record<string, string> {
  if (h == null) return { background: '#1e293b' }
  const v = Math.max(0, Math.min(100, h))
  // 0% = straw yellow, 50% = sky blue, 100% = deep blue
  const straw = [120, 80,   0]
  const sky   = [  3, 105, 161]
  const deep  = [ 30,  58, 138]
  const [from, to, t] = v <= 50
    ? [straw, sky,  v / 50]
    : [sky,   deep, (v - 50) / 50]
  const r = Math.round(from[0] + (to[0] - from[0]) * t)
  const g = Math.round(from[1] + (to[1] - from[1]) * t)
  const b = Math.round(from[2] + (to[2] - from[2]) * t)
  return { background: `rgb(${r},${g},${b})` }
}

function tvocBgClass(ppb: number | null): string {
  if (ppb == null) return 'bgNeutral'
  if (ppb < 150) return 'bgGood'
  if (ppb < 500) return 'bgModerate'
  if (ppb < 1500) return 'bgPoor'
  return 'bgBad'
}

function aqiBgClass(aqi: number | null): string {
  if (aqi == null) return 'bgNeutral'
  if (aqi <= 1) return 'bgGood'
  if (aqi <= 2) return 'bgGoodMid'
  if (aqi <= 3) return 'bgModerate'
  if (aqi <= 4) return 'bgPoor'
  return 'bgBad'
}

function aqiEmoji(aqi: number | null): string {
  if (aqi == null) return '❓'
  if (aqi <= 1) return '🌱'
  if (aqi <= 2) return '😊'
  if (aqi <= 3) return '😐'
  if (aqi <= 4) return '😷'
  return '☠️'
}

function aqiLabel(aqi: number | null): string {
  if (aqi == null) return 'No data'
  if (aqi <= 1) return 'Excellent air quality'
  if (aqi <= 2) return 'Good air quality'
  if (aqi <= 3) return 'Moderate air quality'
  if (aqi <= 4) return 'Poor air quality'
  return 'Hazardous air quality!'
}

// ── Formatters ────────────────────────────────────────────────────────────────
function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
}

function formatLastReading(recorded: string | null | undefined): string {
  if (!recorded) return '—'
  const d = new Date(recorded)
  if (isNaN(d.getTime())) return recorded
  return d.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function formatCoords(lat: any, lon: any): string {
  const la = Number(lat)
  const lo = Number(lon)
  if (!isFinite(la) || !isFinite(lo) || (la === 0 && lo === 0)) return ''
  return `${la.toFixed(4)}°, ${lo.toFixed(4)}°`
}

function doLogin() {
  window.location.href = '/api/auth/login'
}
</script>

<template>
  <!-- ── Login wall ──────────────────────────────────────────────────────── -->
  <div v-if="!me?.ok" class="loginWall">
    <div class="loginCard">
      <div class="loginIcon">🌬️</div>
      <h2>AirBuddy Kiosk Display</h2>
      <p>Log in to view your air quality data.</p>
      <button class="loginBtn" @click="doLogin">Log in with Buwana</button>
    </div>
  </div>

  <!-- ── No devices ─────────────────────────────────────────────────────── -->
  <div v-else-if="!devices.length" class="loginWall">
    <div class="loginCard">
      <div class="loginIcon">📡</div>
      <h2>No Devices Found</h2>
      <p>Add an AirBuddy device from the dashboard to use the kiosk display.</p>
      <NuxtLink to="/dashboard" class="loginBtn">Go to Dashboard</NuxtLink>
    </div>
  </div>

  <!-- ── Kiosk ───────────────────────────────────────────────────────────── -->
  <div v-else class="kiosk">

    <!-- Offline toast -->
    <Transition name="toast">
      <div v-if="isOffline" class="offlineToast" role="alert">
        ⚠ Connection lost — retrying…
      </div>
    </Transition>

    <!-- Settings modal -->
    <Teleport to="body">
      <div v-if="settingsOpen" class="modalBackdrop" @click.self="settingsOpen = false">
        <div class="settingsModal">

          <div class="settingsHeader">
            <h3>Kiosk Settings</h3>
            <button class="closeBtn" type="button" @click="settingsOpen = false">✕</button>
          </div>

          <div class="settingsBody">

            <div class="settingsSection">
              <div class="settingsSectionTitle">AirBuddy Device</div>
              <select class="deviceSelect" v-model="selectedDeviceUid" @change="onDeviceChange">
                <option
                  v-for="d in devices"
                  :key="d.device_uid"
                  :value="d.device_uid"
                >{{ d.device_name || d.device_uid }}{{ d.home_name ? ' — ' + d.home_name : '' }}{{ d.room_name ? ' / ' + d.room_name : '' }}</option>
              </select>
            </div>

            <div class="settingsSection">
              <div class="settingsSectionTitle">Visible Tiles</div>
              <div class="toggleList">

                <label class="toggleRow">
                  <span class="toggleLabel">Clock &amp; last reading</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.time" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">Temperature</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.temp" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">CO₂</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.co2" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">Humidity</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.humidity" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">GPS Map</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.gps" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">TVOC</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.tvoc" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">Air Quality Index (AQI)</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.aqi" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

                <label class="toggleRow">
                  <span class="toggleLabel">GPS coordinates (in device tile)</span>
                  <span class="toggleSwitch">
                    <input type="checkbox" v-model="show.location" />
                    <span class="toggleTrack"><span class="toggleThumb"></span></span>
                  </span>
                </label>

              </div>
            </div>

            <div class="settingsFooter">
              <NuxtLink to="/dashboard" class="dashLink">← Back to Dashboard</NuxtLink>
            </div>

          </div>
        </div>
      </div>
    </Teleport>

    <!-- ── Kiosk grid ──────────────────────────────────────────────────── -->
    <div class="grid">

      <!-- Clock tile — top-left, half screen width -->
      <div v-if="show.time" class="tile tileClock">
        <div class="clockTime">{{ formatTime(now) }}</div>
        <div class="clockDate">{{ formatDate(now) }}</div>
        <div class="clockLast">
          <span>{{ isFresh ? '🟢' : '🔴' }}</span>
          <span>Last reading: {{ formatLastReading(live?.recorded_at) }}</span>
        </div>
      </div>

      <!-- Device tile — top-right, half screen width -->
      <div class="tile tileDevice" :class="aqiBgClass(aqiValue)">
        <div class="tileActions">
          <NuxtLink class="actionBtn" to="/dashboard" title="Back to Dashboard">🏠</NuxtLink>
          <button class="actionBtn" type="button" @click="toggleFullscreen" :title="isFullscreen ? 'Exit fullscreen' : 'Go fullscreen'">{{ isFullscreen ? '⊡' : '⛶' }}</button>
          <button class="actionBtn" type="button" @click="settingsOpen = true" title="Kiosk settings">⚙️</button>
        </div>
        <div class="deviceName">{{ live?.device_name || selectedDeviceUid || '—' }}</div>
        <div v-if="live?.room_name" class="deviceDetail">{{ live.room_name }}</div>
        <div v-if="live?.home_name" class="deviceDetail deviceHome">{{ live.home_name }}</div>
        <div
          v-if="show.location && live?.last_gps_lat && formatCoords(live.last_gps_lat, live.last_gps_lon)"
          class="deviceDetail deviceGps"
        >📍 {{ formatCoords(live.last_gps_lat, live.last_gps_lon) }}</div>
        <span v-if="liveLoading" class="spinnerDot" aria-hidden="true">↻</span>
      </div>

      <!-- Temperature tile — row 2, left third -->
      <div v-if="show.temp" class="tile tileTemp" :class="tempBgClass(tempValue)">
        <div class="metricValue">{{ tempValue != null ? tempValue.toFixed(1) : '—' }}</div>
        <div class="metricUnit">°C</div>
        <div v-if="trendArrow(trendBuffer.temp)" class="trendArrow" :class="trendClass(trendBuffer.temp, 0)">{{ trendArrow(trendBuffer.temp) }}</div>
        <div class="tileLabel">Temperature</div>
      </div>

      <!-- CO₂ tile — row 2, center third -->
      <div v-if="show.co2" class="tile tileCo2" :class="co2BgClass(co2Value)">
        <div class="metricValue">{{ co2Value != null ? Math.round(co2Value) : '—' }}</div>
        <div class="metricUnit">ppm</div>
        <div v-if="trendArrow(trendBuffer.co2)" class="trendArrow" :class="trendClass(trendBuffer.co2, -1)">{{ trendArrow(trendBuffer.co2) }}</div>
        <div class="tileLabel">CO₂</div>
      </div>

      <!-- Humidity tile — row 2, right third -->
      <div v-if="show.humidity" class="tile tileHumidity" :style="humidityBgStyle(humidityValue)">
        <div class="metricValue">{{ humidityValue != null ? Math.round(humidityValue) : '—' }}</div>
        <div class="metricUnit">%</div>
        <div v-if="trendArrow(trendBuffer.humidity)" class="trendArrow" :class="trendClass(trendBuffer.humidity, 0)">{{ trendArrow(trendBuffer.humidity) }}</div>
        <div class="tileLabel">Humidity</div>
      </div>

      <!-- GPS map tile — row 3, left third -->
      <div v-if="show.gps" class="tile tileGps">
        <template v-if="hasGps">
          <iframe
            :key="gpsEmbedUrl"
            :src="gpsEmbedUrl"
            class="mapFrame"
            frameborder="0"
            scrolling="no"
            title="Device location"
          />
        </template>
        <template v-else>
          <div class="noGpsIcon">📡</div>
          <div class="noGpsText">No GPS data</div>
        </template>
      </div>

      <!-- TVOC tile — row 3, center third -->
      <div v-if="show.tvoc" class="tile tileTvoc" :class="tvocBgClass(tvocValue)">
        <div class="metricValue tvocNum">{{ tvocValue != null ? Math.round(tvocValue) : '—' }}</div>
        <div class="metricUnit">ppb</div>
        <div v-if="trendArrow(trendBuffer.tvoc)" class="trendArrow" :class="trendClass(trendBuffer.tvoc, -1)">{{ trendArrow(trendBuffer.tvoc) }}</div>
        <div class="tileLabel">TVOC</div>
      </div>

      <!-- AQI tile — row 3, right third -->
      <div v-if="show.aqi" class="tile tileAqi" :class="aqiBgClass(aqiValue)">
        <div class="aqiMain">
          <div class="aqiEmoji">{{ aqiEmoji(aqiValue) }}</div>
          <div class="aqiInterpretation">{{ aqiLabel(aqiValue) }}</div>
          <div class="tileLabel">Air Quality Index</div>
        </div>
        <div class="aqiSparkWrap">
          <svg v-if="iaqLinePoints" class="aqiSparkSvg" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="iaqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="iaqSparkColor" stop-opacity="0.38"/>
                <stop offset="100%" :stop-color="iaqSparkColor" stop-opacity="0.04"/>
              </linearGradient>
            </defs>
            <path :d="iaqFillPath" fill="url(#iaqGrad)"/>
            <polyline :points="iaqLinePoints" fill="none" :stroke="iaqSparkColor" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
          <div class="aqiSparkMeta">
            <span class="aqiScore">{{ iaqCurrentScore != null ? iaqCurrentScore.toFixed(1) : '—' }}</span>
            <span class="aqiScoreLabel">IAQ score</span>
            <span class="aqiScoreRange">6h trend</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
/* ── Kiosk shell ─────────────────────────────────────────────────────────────*/
.kiosk {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0d1117;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* ── Grid — 6 equal columns lets rows 1, 2, 3 all divide cleanly ─────────────
   Row 1 (2 tiles): clock spans cols 1-3, device spans cols 4-6
   Row 2 (3 tiles): temp, co2, humidity each span 2 cols
   Row 3 (3 tiles): gps, tvoc, aqi each span 2 cols               */
.grid {
  width: 100vw;
  height: 100vh;
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-template-rows: 30vh 35vh 35vh;
  grid-template-areas:
    "clock    clock    clock    device   device   device"
    "temp     temp     co2      co2      humidity humidity"
    "gps      gps      tvoc     tvoc     aqi      aqi";
  gap: 4px;
  background: #0d1117;
  overflow: hidden;
}

/* ── Base tile ───────────────────────────────────────────────────────────────*/
.tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: clamp(0.75rem, 2vw, 1.5rem);
  overflow: hidden;
  position: relative;
  color: #fff;
}

/* ── Grid area assignments ───────────────────────────────────────────────────*/
.tileClock    { grid-area: clock; }
.tileDevice   { grid-area: device; }
.tileTemp     { grid-area: temp; }
.tileCo2      { grid-area: co2; }
.tileHumidity { grid-area: humidity; }
.tileGps      { grid-area: gps; }
.tileTvoc     { grid-area: tvoc; }
.tileAqi      { grid-area: aqi; }

/* ── Color states ────────────────────────────────────────────────────────────*/
.bgGood     { background: #14532d; }   /* AQI forest green */
.bgGoodMid  { background: #166534; }
.bgCo2Good  { background: #134e4a; }   /* CO₂ teal green — distinct from AQI */
.bgModerate { background: #713f12; }
.bgPoor     { background: #7c2d12; }
.bgBad      { background: #450a0a; }
.bgNeutral  { background: #1e293b; }

/* ── Clock tile — left half of top row ───────────────────────────────────────*/
.tileClock {
  background: #0f172a;
  align-items: flex-start;
  justify-content: flex-end;
  padding-bottom: clamp(1.2rem, 3vh, 2rem);
  padding-left: clamp(1.2rem, 3vw, 2.5rem);
}

.clockTime {
  font-size: clamp(2rem, 5.5vw, 5rem);
  font-weight: 700;
  color: #f1f5f9;
  letter-spacing: 0.04em;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.clockDate {
  font-size: clamp(1rem, 2.4vw, 2rem);
  font-weight: 400;
  color: rgba(241, 245, 249, 0.72);
  margin-top: 0.35rem;
  line-height: 1.2;
}
.clockLast {
  font-size: clamp(0.6rem, 1.2vw, 0.9rem);
  color: rgba(241, 245, 249, 0.48);
  margin-top: 0.65rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-variant-numeric: tabular-nums;
}

/* ── Device tile — right half of top row ────────────────────────────────────*/
.tileDevice {
  align-items: flex-end;
  justify-content: flex-end;
  padding-bottom: clamp(1.2rem, 3vh, 2rem);
  padding-right: clamp(1.2rem, 3vw, 2.5rem);
  text-align: right;
  filter: brightness(1.1) saturate(1.1);
}

.tileActions {
  position: absolute;
  top: clamp(0.5rem, 1.5vh, 0.9rem);
  right: clamp(0.5rem, 1.5vw, 0.9rem);
  display: flex;
  gap: 0.45rem;
  align-items: center;
}
.actionBtn {
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 50%;
  width: clamp(2rem, 3.5vw, 3rem);
  height: clamp(2rem, 3.5vw, 3rem);
  font-size: clamp(0.9rem, 1.6vw, 1.4rem);
  cursor: pointer;
  color: rgba(255, 255, 255, 0.85);
  display: grid;
  place-items: center;
  transition: background 0.2s;
}
.actionBtn:hover { background: rgba(255, 255, 255, 0.26); }

.deviceName {
  font-size: clamp(1.1rem, 3vw, 2.5rem);
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.15;
  word-break: break-word;
}
.deviceDetail {
  font-size: clamp(0.6rem, 1.3vw, 1rem);
  color: rgba(241, 245, 249, 0.5);
  margin-top: 0.25rem;
  line-height: 1.3;
}
.deviceHome { color: rgba(241, 245, 249, 0.4); }
.deviceGps  { font-variant-numeric: tabular-nums; font-size: clamp(0.55rem, 1.05vw, 0.8rem); }

.spinnerDot {
  position: absolute;
  bottom: 0.6rem;
  left: 0.85rem;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.35);
  animation: spin 1.2s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Metric tiles (temp / co₂ / humidity) ────────────────────────────────────*/
.metricValue {
  font-size: clamp(3rem, 7.5vw, 7rem);
  font-weight: 800;
  line-height: 1;
  color: #fff;
  font-variant-numeric: tabular-nums;
}
.metricUnit {
  font-size: clamp(0.9rem, 2.2vw, 1.8rem);
  font-weight: 400;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 0.15rem;
}
.tileLabel {
  font-size: clamp(0.55rem, 1.1vw, 0.82rem);
  font-weight: 500;
  color: rgba(255, 255, 255, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.13em;
  margin-top: 0.6rem;
}

/* ── GPS tile ─────────────────────────────────────────────────────────────────*/
.tileGps {
  background: #1e293b;
  padding: 0;
  overflow: hidden;
}

.mapFrame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  filter: saturate(0.85) brightness(0.9);
}

.noGpsIcon { font-size: clamp(2rem, 4vw, 3.5rem); opacity: 0.4; }
.noGpsText {
  font-size: clamp(0.75rem, 1.5vw, 1.1rem);
  color: rgba(255, 255, 255, 0.4);
  margin-top: 0.5rem;
}

/* ── TVOC tile ───────────────────────────────────────────────────────────────*/
.tvocNum {
  font-size: clamp(3.5rem, 8.5vw, 8rem);
}

/* ── AQI tile ────────────────────────────────────────────────────────────────*/
.tileAqi {
  justify-content: space-between;
  align-items: stretch;
}
.aqiMain {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
}
.aqiEmoji {
  font-size: clamp(2.5rem, 6.5vw, 5.5rem);
  line-height: 1;
}
.aqiInterpretation {
  font-size: clamp(0.75rem, 1.7vw, 1.25rem);
  font-weight: 600;
  color: rgba(255, 255, 255, 0.92);
  text-align: center;
  margin-top: 0.4rem;
  line-height: 1.3;
}
.aqiSparkWrap {
  width: 100%;
  padding-top: 0.4rem;
  flex-shrink: 0;
}
.aqiSparkSvg {
  width: 100%;
  height: clamp(2rem, 4.5vh, 3.5rem);
  display: block;
  overflow: visible;
}
.aqiSparkMeta {
  display: flex;
  align-items: baseline;
  gap: 0.4rem;
  margin-top: 0.2rem;
  padding: 0 0.1rem;
}
.aqiScore {
  font-size: clamp(0.9rem, 2vw, 1.3rem);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #fff;
}
.aqiScoreLabel {
  font-size: clamp(0.55rem, 1.05vw, 0.78rem);
  color: rgba(255, 255, 255, 0.55);
}
.aqiScoreRange {
  font-size: clamp(0.5rem, 0.95vw, 0.7rem);
  color: rgba(255, 255, 255, 0.32);
  margin-left: auto;
}

/* ── Login / empty wall ──────────────────────────────────────────────────────*/
.loginWall {
  width: 100vw;
  height: 100vh;
  display: grid;
  place-items: center;
  background: #0d1117;
  font-family: system-ui, -apple-system, sans-serif;
}
.loginCard {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.25rem;
  padding: 3rem 2.5rem;
  text-align: center;
  color: #f1f5f9;
  max-width: 420px;
  width: calc(100% - 2rem);
}
.loginIcon { font-size: 3.5rem; margin-bottom: 0.75rem; }
.loginCard h2 { font-size: 1.6rem; font-weight: 700; margin: 0 0 0.75rem; color: #f1f5f9; }
.loginCard p  { color: rgba(241, 245, 249, 0.6); margin: 0 0 1.75rem; font-size: 1rem; }
.loginBtn {
  display: inline-block;
  padding: 0.75rem 2rem;
  background: #0ea5e9;
  color: #fff;
  border: none;
  border-radius: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-decoration: none;
  transition: background 0.2s;
}
.loginBtn:hover { background: #0284c7; }

/* ── Settings modal ──────────────────────────────────────────────────────────*/
.modalBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: grid;
  place-items: center;
  z-index: 1000;
}
.settingsModal {
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1.25rem;
  width: min(100% - 2rem, 520px);
  max-height: 90vh;
  overflow-y: auto;
  color: #f1f5f9;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.6);
}
.settingsHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 1.75rem 1.1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}
.settingsHeader h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 700;
  color: #f1f5f9;
}
.closeBtn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #f1f5f9;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 0.85rem;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background 0.2s;
  flex-shrink: 0;
}
.closeBtn:hover { background: rgba(255, 255, 255, 0.16); }

.settingsBody { padding: 1.25rem 1.75rem 1.5rem; }

.settingsSection { margin-bottom: 1.6rem; }
.settingsSectionTitle {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: rgba(241, 245, 249, 0.45);
  margin-bottom: 0.75rem;
}

.deviceSelect {
  width: 100%;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.6rem;
  color: #f1f5f9;
  padding: 0.65rem 0.9rem;
  font-size: 0.95rem;
  cursor: pointer;
}
.deviceSelect option { background: #1e293b; }

/* ── Toggle switch rows ──────────────────────────────────────────────────────*/
.toggleList { display: flex; flex-direction: column; gap: 0.15rem; }

.toggleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0.5rem;
  border-radius: 0.4rem;
  cursor: pointer;
  transition: background 0.15s;
}
.toggleRow:hover { background: rgba(255, 255, 255, 0.05); }

.toggleLabel {
  font-size: 0.95rem;
  color: rgba(241, 245, 249, 0.82);
  user-select: none;
}

/* Pill toggle */
.toggleSwitch {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
}
.toggleSwitch input[type="checkbox"] {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
}
.toggleTrack {
  width: 44px;
  height: 24px;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 12px;
  position: relative;
  transition: background 0.22s;
  cursor: pointer;
}
.toggleSwitch input:checked + .toggleTrack {
  background: #0ea5e9;
}
.toggleThumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.22s;
  pointer-events: none;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}
.toggleSwitch input:checked + .toggleTrack .toggleThumb {
  transform: translateX(20px);
}

.settingsFooter {
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
}
.dashLink {
  font-size: 0.85rem;
  color: rgba(241, 245, 249, 0.45);
  text-decoration: none;
  transition: color 0.15s;
}
.dashLink:hover { color: #0ea5e9; }

/* ── Danger pulse — draws the eye when a tile hits a bad threshold ────────────*/
@keyframes dangerPulse {
  0%, 100% { background: #450a0a; }
  50%       { background: #991b1b; }
}
@keyframes warnPulse {
  0%, 100% { background: #7c2d12; }
  50%       { background: #c2410c; }
}
.bgBad  { animation: dangerPulse 2s ease-in-out infinite; }
.bgPoor { animation: warnPulse   3s ease-in-out infinite; }

/* ── Trend arrows ────────────────────────────────────────────────────────────*/
.trendArrow {
  font-size: clamp(0.75rem, 1.6vw, 1.2rem);
  font-weight: 700;
  margin-top: 0.25rem;
  line-height: 1;
  letter-spacing: -0.02em;
}
.trendGood    { color: rgba(134, 239, 172, 0.9); }
.trendWarn    { color: rgba(252, 165, 165, 0.9); }
.trendNeutral { color: rgba(255, 255, 255, 0.55); }
.trendFlat    { color: rgba(255, 255, 255, 0.28); }

/* ── Offline toast ───────────────────────────────────────────────────────────*/
.offlineToast {
  position: fixed;
  top: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(120, 40, 10, 0.92);
  border: 1px solid rgba(250, 100, 30, 0.4);
  color: #fed7aa;
  font-size: clamp(0.75rem, 1.5vw, 1rem);
  font-weight: 600;
  padding: 0.6rem 1.75rem;
  border-radius: 2rem;
  backdrop-filter: blur(8px);
  z-index: 900;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}
.toast-enter-active, .toast-leave-active {
  transition: opacity 0.35s, transform 0.35s;
}
.toast-enter-from, .toast-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-0.6rem);
}
</style>
