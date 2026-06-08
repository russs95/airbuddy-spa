<template>
  <main class="wrap" :data-theme="theme">
    <header class="header">
      <div class="headerLeft">
        <NuxtLink to="/" class="abIconLink" title="AirBuddy Home">
          <img src="/svgs/ab-icon.svg" alt="AirBuddy" class="abIcon abIconMobile" />
          <img v-if="theme === 'dark'" src="/svgs/airbuddy-logo-dark.svg" alt="AirBuddy" class="abLogo abLogoDesktop" />
          <img v-else src="/svgs/airbuddy-logo-light.svg" alt="AirBuddy" class="abLogo abLogoDesktop" />
        </NuxtLink>
        <div>
          <h1>Lucie's Place</h1>
          <p class="muted">Live air quality — public example</p>
        </div>
      </div>

      <div class="btns">
        <button
            class="btn iconBtn"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          {{ theme === "dark" ? "☀️" : "🌙" }}
        </button>
        <NuxtLink class="btn" to="/">Home</NuxtLink>
        <a class="btn btnGithub" href="https://github.com/russs95/airbuddy_v2" target="_blank" rel="noopener">
          <svg class="githubIcon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Build
        </a>
        <a class="btn" href="/api/auth/login">Login</a>
        <a class="btn primary" href="https://buwana.ecobricks.org/en/signup-1.php?app=airb_ca090536efc8" target="_blank" rel="noopener">Sign Up</a>
      </div>
    </header>

    <!-- Device banner + IAQ strip + latest metrics -->
    <section class="card">
      <div class="sectionHeader">
        <div>
          <h2>{{ live?.device_name || selectedDeviceUid }}</h2>
          <p class="muted tiny">
            {{ live?.home_name || "—" }}<span v-if="live?.room_name"> · {{ live.room_name }}</span>
          </p>
        </div>
        <div v-if="live?.ens_aqi != null" class="aqiBanner">
          <span class="aqiBannerEmoji">{{ aqiEmoji(live.ens_aqi) }}</span>
          <span class="aqiBannerLabel">AQI {{ live.ens_aqi }} —
            <span v-if="live.ens_aqi <= 1">Excellent</span>
            <span v-else-if="live.ens_aqi <= 2">Good</span>
            <span v-else-if="live.ens_aqi <= 3">Moderate</span>
            <span v-else-if="live.ens_aqi <= 4">Poor</span>
            <span v-else>Very Poor</span>
          </span>
        </div>
      </div>

      <!-- IAQ composite score strip -->
      <div v-if="iaqScores.length" class="iaqStrip">
        <div class="iaqStripLeft">
          <div class="iaqStripScore" :style="{ color: iaqLineColor }">{{ iaqCurrentScore != null ? iaqCurrentScore.toFixed(1) : '—' }}</div>
          <div class="iaqStripLabel">{{ iaqScoreLabel }}</div>
          <div class="iaqStripSub">IAQ · 6h trend</div>
        </div>
        <div class="iaqStripChart">
          <svg class="iaqSparkSvg" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="exIaqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="iaqLineColor" stop-opacity="0.28"/>
                <stop offset="100%" :stop-color="iaqLineColor" stop-opacity="0.03"/>
              </linearGradient>
            </defs>
            <path :d="iaqFillD" fill="url(#exIaqGrad)"/>
            <polyline :points="iaqSparkPoints" fill="none" :stroke="iaqLineColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </div>

      <!-- Latest telemetry metric cards -->
      <div v-if="livePending" class="muted">Loading latest telemetry…</div>
      <div v-else-if="liveError" class="error">Latest telemetry failed: {{ liveErrorMessage }}</div>
      <template v-else>
        <div class="metricsGrid">
          <MetricCard label="CO₂" :value="formatMetric(live?.ens_eco2 ?? live?.scd_co2, 0)" unit="ppm" />
          <MetricCard label="Temperature" :value="formatMetric(live?.aht_temp ?? live?.scd_temp, 1)" unit="°C" />
          <MetricCard label="Humidity" :value="formatMetric(live?.aht_humidity ?? live?.scd_humidity, 1)" unit="%" />
          <MetricCard label="AQI" :value="formatMetric(live?.ens_aqi, 0)" />
          <MetricCard v-if="live?.ina_batt_pct != null" label="Battery" :value="formatMetric(live?.ina_batt_pct, 0)" unit="%" />
          <MetricCard v-if="live?.ina_bus_v != null" label="Bus V" :value="formatMetric(live?.ina_bus_v, 2)" unit="V" />
        </div>
        <div class="meta tiny muted">
          <div><strong>Recorded:</strong> {{ live?.recorded_at || "—" }}</div>
          <div><strong>Received:</strong> {{ live?.received_at || "—" }}</div>
        </div>
      </template>
    </section>

    <!-- Air Quality Trends -->
    <section class="card chartsPanel">
      <div class="chartsPanelHead">
        <span class="chartsPanelTitle">Air Quality Trends</span>
        <div class="rangeBar" role="group" aria-label="Time range">
          <button
              v-for="r in trendRangeKeys"
              :key="r"
              class="rangeBtn"
              :class="{ active: universalRange === r }"
              @click="universalRange = r"
          >{{ r }}</button>
        </div>
      </div>

      <div class="chartSubCards">

        <!-- CO₂ -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">CO₂</span>
            <button class="rangeBtn expandBtn" @click="chartExpanded.eco2 = !chartExpanded.eco2" :title="chartExpanded.eco2 ? 'Collapse chart' : 'Expand chart'" :aria-pressed="chartExpanded.eco2">{{ chartExpanded.eco2 ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="co2Series"
              :range="universalRange"
              :theme="theme"
              unit="ppm"
              :decimals="0"
              :height="chartExpanded.eco2 ? 400 : 200"
              :yMin="350"
              :thresholdBands="eco2ThresholdBands"
              :showLegend="co2Series.length > 1"
          />
        </div>

        <!-- Temperature -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Temperature</span>
            <button class="rangeBtn expandBtn" @click="chartExpanded.temp = !chartExpanded.temp" :title="chartExpanded.temp ? 'Collapse chart' : 'Expand chart'" :aria-pressed="chartExpanded.temp">{{ chartExpanded.temp ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="tempSeries"
              :range="universalRange"
              :theme="theme"
              unit="°C"
              :decimals="1"
              :height="chartExpanded.temp ? 440 : 220"
              :yPad="5"
              :thresholdBands="tempThresholdBands"
              :showLegend="tempSeries.length > 1"
          />
        </div>

        <!-- Humidity -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Humidity</span>
            <button class="rangeBtn expandBtn" @click="chartExpanded.humidity = !chartExpanded.humidity" :title="chartExpanded.humidity ? 'Collapse chart' : 'Expand chart'" :aria-pressed="chartExpanded.humidity">{{ chartExpanded.humidity ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="humiditySeries"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="1"
              :height="chartExpanded.humidity ? 400 : 200"
              :thresholdBands="humidityThresholdBands"
              :showLegend="humiditySeries.length > 1"
          />
        </div>

        <!-- TVOC -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">TVOC</span>
            <button class="rangeBtn expandBtn" @click="chartExpanded.tvoc = !chartExpanded.tvoc" :title="chartExpanded.tvoc ? 'Collapse chart' : 'Expand chart'" :aria-pressed="chartExpanded.tvoc">{{ chartExpanded.tvoc ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="tvocSeries"
              :range="universalRange"
              :theme="theme"
              unit="ppb"
              :decimals="0"
              :height="chartExpanded.tvoc ? 400 : 200"
              :yMin="0"
              :thresholdBands="tvocThresholdBands"
          />
        </div>

      </div>
    </section>

    <!-- Battery panel -->
    <section class="card chartsPanel">
      <div class="chartsPanelHead">
        <span class="chartsPanelTitle">Battery</span>
        <div class="rangeBar" role="group" aria-label="Time range">
          <button
              v-for="r in trendRangeKeys"
              :key="r"
              class="rangeBtn"
              :class="{ active: universalRange === r }"
              @click="universalRange = r"
          >{{ r }}</button>
        </div>
      </div>

      <div class="chartSubCards">

        <!-- Charge level -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Charge Level</span>
            <button class="rangeBtn expandBtn" @click="chartExpanded.battery = !chartExpanded.battery" :title="chartExpanded.battery ? 'Collapse chart' : 'Expand chart'" :aria-pressed="chartExpanded.battery">{{ chartExpanded.battery ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!battLevelSeries.length" class="muted chartEmpty">No battery data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="battLevelSeries"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="0"
              :height="chartExpanded.battery ? 400 : 200"
              :yMin="0"
              :yMax="100"
              :thresholdBands="battThresholdBands"
              :showLegend="true"
          />
        </div>

        <!-- Current -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Current (+ charging / − discharging)</span>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="!battCurrentSeries.length" class="muted chartEmpty">No current data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="battCurrentSeries"
              :range="universalRange"
              :theme="theme"
              unit="mA"
              :decimals="0"
              :height="chartExpanded.battery ? 400 : 200"
              :yPad="50"
          />
        </div>

      </div>
    </section>

    <!-- GPS / Location -->
    <section class="card chartsPanel">
      <div class="chartCardHead">
        <span class="chartsPanelTitle">{{ gpsMode === 'route' ? 'GPS Route' : 'Current Location' }}</span>
        <div class="mapControls">
          <div class="rangeBar" role="group" aria-label="Map view">
            <button class="rangeBtn" :class="{ active: gpsMode === 'location' }" @click="gpsMode = 'location'">Location</button>
            <button class="rangeBtn" :class="{ active: gpsMode === 'route' }" @click="gpsMode = 'route'">Route</button>
          </div>
          <button
              class="rangeBtn expandBtn"
              @click="mapExpanded = !mapExpanded"
              :title="mapExpanded ? 'Collapse map' : 'Expand map'"
              :aria-pressed="mapExpanded"
          >{{ mapExpanded ? '⊟' : '⊞' }}</button>
        </div>
      </div>

      <div v-if="livePending && gpsMode === 'location'" class="muted chartEmpty">Loading…</div>
      <div v-else>
        <div class="mapWrapper">
          <LocationMap
              :lat="live?.last_gps_lat ?? null"
              :lon="live?.last_gps_lon ?? null"
              :height="mapExpanded ? 420 : 180"
              :theme="theme"
              :mode="gpsMode"
              :routeCoords="routeCoords"
          />
          <Transition name="mapFade">
            <div v-if="routePending && gpsMode === 'route'" class="mapLoadingOverlay">
              <span class="tiny">Updating route…</span>
            </div>
          </Transition>
        </div>

        <div class="locationMeta tiny muted">
          <template v-if="gpsMode === 'location'">
            <template v-if="live?.last_gps_lat != null && live?.last_gps_lon != null">
              <span class="locationCoord"><strong>Lat:</strong> {{ Number(live.last_gps_lat).toFixed(6) }}°</span>
              <span class="locationCoord"><strong>Lon:</strong> {{ Number(live.last_gps_lon).toFixed(6) }}°</span>
              <span v-if="live?.last_gps_at"><strong>As of:</strong> {{ live.last_gps_at }}</span>
              <span v-if="live?.last_gps_at !== live?.recorded_at" class="locationStale">(GPS from earlier reading)</span>
            </template>
            <span v-else class="muted">No GPS data found for this device.</span>
          </template>
          <template v-else>
            <span v-if="routeCoords.length">
              <strong>{{ routeCoords.length }}</strong> GPS point{{ routeCoords.length !== 1 ? 's' : '' }} · green = start, blue = latest
            </span>
            <span v-else class="muted">No GPS coordinates in this time range.</span>
          </template>
        </div>

        <!-- Route time range slider -->
        <div class="routeSliderWrap" :class="{ routeSliderActive: gpsMode === 'route' }">
          <div class="routeSliderHead">
            <span class="tiny muted">Route range</span>
            <span class="routeSliderValue">{{ routeSliderSteps[routeSliderIndex].label }}</span>
            <span v-if="routePending" class="tiny muted">Loading…</span>
          </div>
          <input
              type="range"
              min="0"
              :max="routeSliderSteps.length - 1"
              step="1"
              v-model.number="routeSliderIndex"
              class="routeSliderInput"
              aria-label="Route time range"
          />
          <div class="routeSliderTicks tiny muted">
            <span>15m</span>
            <span>3h</span>
            <span>12h</span>
            <span>36h</span>
            <span>72h</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest packets -->
    <section class="card">
      <div class="packetHead">
        <div>
          <h2>Latest Packets</h2>
          <span class="tiny muted">{{ allPackets.length }} total · page {{ packetPage + 1 }} of {{ totalPacketPages }}</span>
        </div>
        <div class="packetControls">
          <div class="rangeBar" role="group" aria-label="Time range">
            <button v-for="r in packetRangeKeys" :key="r"
                class="rangeBtn"
                :class="{ active: packetRange === r }"
                @click="packetRange = r"
            >{{ r }}</button>
          </div>
        </div>
      </div>

      <div v-if="packetTrendsPending" class="muted tiny">Loading…</div>
      <div v-else-if="!allPackets.length" class="muted tiny">No packets in this time range.</div>

      <div v-else>
        <div class="packetTableWrap">
          <table class="packetTable">
            <thead>
            <tr>
              <th>Time</th>
              <th>ENS CO₂</th>
              <th>SCD CO₂</th>
              <th>AHT Temp</th>
              <th>SCD Temp</th>
              <th>RTC Temp</th>
              <th>TVOC</th>
              <th>Lat</th>
              <th>Lon</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="pkt in paginatedPackets" :key="pkt.ts">
              <td class="packetTime" :title="pkt.timeLabel">{{ pkt.timeLabelShort }}</td>
              <td>{{ pkt.ensEco2 }}</td>
              <td>{{ pkt.scdCo2 }}</td>
              <td>{{ pkt.ahtTemp }}</td>
              <td>{{ pkt.scdTemp }}</td>
              <td>{{ pkt.rtcTemp }}</td>
              <td>{{ pkt.tvoc }}</td>
              <td class="packetCoord">{{ pkt.raw.lat != null ? Number(pkt.raw.lat).toFixed(4) : '—' }}</td>
              <td class="packetCoord">{{ pkt.raw.lon != null ? Number(pkt.raw.lon).toFixed(4) : '—' }}</td>
            </tr>
            </tbody>
          </table>
        </div>

        <div class="paginationBar">
          <button class="btn" :disabled="packetPage === 0" @click="packetPage--">‹ Prev</button>
          <span class="paginationInfo tiny muted">{{ packetPage + 1 }} / {{ totalPacketPages }}</span>
          <button class="btn" :disabled="packetPage >= totalPacketPages - 1" @click="packetPage++">Next ›</button>
          <div class="rangeBar paginationLimit" role="group" aria-label="Rows per page">
            <button v-for="n in [10, 25, 100]" :key="n"
                class="rangeBtn"
                :class="{ active: packetLimit === n }"
                @click="packetLimit = n"
            >{{ n }}</button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import AirTrendChart from '~/components/charts/AirTrendChart.vue'
import LocationMap from '~/components/LocationMap.vue'
import { scoresFromTrends, iaqColor, iaqLabel as calcIaqLabel, sparklinePoints, sparklineFillPath } from '../lib/iaqScore'

useHead({ title: "AirBuddy | Lucie's Place" })

// ── Theme ────────────────────────────────────────────────────────────────────
const theme = ref("light")
let nowTimer = null
let routeDebounceTimer = null

onMounted(() => {
  const saved = localStorage.getItem("airbuddy-theme")
  if (saved === "dark" || saved === "light") {
    theme.value = saved
  } else {
    theme.value = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  document.documentElement.setAttribute("data-airbuddy-theme", theme.value)
  nowTimer = window.setInterval(() => { nowMs.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer)
  clearTimeout(routeDebounceTimer)
})

watch(theme, (v) => {
  if (process.client) {
    localStorage.setItem("airbuddy-theme", v)
    document.documentElement.setAttribute("data-airbuddy-theme", v)
  }
})

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark"
}

// ── Hardcoded public device ──────────────────────────────────────────────────
const selectedDeviceUid = "lucies place 1"

// ── Chart ranges & threshold bands ──────────────────────────────────────────
const trendRangeKeys = ["15m", "30m", "1h", "3h", "6h", "12h", "24h", "36h", "50h", "72h", "7d", "30d"]
const universalRange = ref("1h")

const chartExpanded = reactive({
  eco2: false,
  temp: false,
  humidity: false,
  tvoc: false,
  battery: false,
})

const mapExpanded = ref(true)
const gpsMode = ref('location')
const packetLimit = ref(10)

const RANGE_FETCH_HOURS = {
  '15m': 1, '30m': 1, '1h': 2, '3h': 4, '6h': 7, '12h': 13, '24h': 25,
  '36h': 37, '50h': 51, '72h': 73, '7d': 169, '30d': 721,
}

const routeSliderSteps = [
  { label: '15m', hours: 0.25 },
  { label: '30m', hours: 0.5 },
  { label: '1h',  hours: 1 },
  { label: '2h',  hours: 2 },
  { label: '3h',  hours: 3 },
  { label: '6h',  hours: 6 },
  { label: '9h',  hours: 9 },
  { label: '12h', hours: 12 },
  { label: '18h', hours: 18 },
  { label: '24h', hours: 24 },
  { label: '36h', hours: 36 },
  { label: '48h', hours: 48 },
  { label: '50h', hours: 50 },
  { label: '72h', hours: 72 },
]
const routeSliderIndex = ref(2)
const routeHoursFetched = ref(1)
watch(routeSliderIndex, (idx) => {
  clearTimeout(routeDebounceTimer)
  routeDebounceTimer = setTimeout(() => {
    routeHoursFetched.value = routeSliderSteps[idx].hours
  }, 400)
})

const eco2ThresholdBands = [
  { label: 'Good',      from: 0,    to: 800,      color: 'rgba(34,197,94,0.10)'  },
  { label: 'OK',        from: 800,  to: 1000,     color: 'rgba(234,179,8,0.12)'  },
  { label: 'Poor',      from: 1000, to: 1400,     color: 'rgba(249,115,22,0.13)' },
  { label: 'Bad',       from: 1400, to: 2000,     color: 'rgba(239,68,68,0.13)'  },
  { label: 'Dangerous', from: 2000, to: Infinity,  color: 'rgba(185,28,28,0.16)'  },
]

const tempThresholdBands = [
  { label: 'Cold',        from: -Infinity, to: 16,       color: 'rgba(99,179,237,0.13)'  },
  { label: 'Cool',        from: 16,        to: 20,       color: 'rgba(56,189,248,0.10)'  },
  { label: 'Comfortable', from: 20,        to: 25,       color: 'rgba(34,197,94,0.10)'   },
  { label: 'Warm',        from: 25,        to: 28,       color: 'rgba(251,191,36,0.12)'  },
  { label: 'Hot',         from: 28,        to: Infinity, color: 'rgba(239,68,68,0.13)'   },
]

const humidityThresholdBands = [
  { label: 'Very Dry',    from: 0,  to: 25,       color: 'rgba(210,180,140,0.18)'  },
  { label: 'Dry',         from: 25, to: 40,       color: 'rgba(230,210,170,0.13)'  },
  { label: 'Comfortable', from: 40, to: 60,       color: 'rgba(34,197,94,0.10)'    },
  { label: 'Humid',       from: 60, to: 70,       color: 'rgba(56,189,248,0.11)'   },
  { label: 'Very Humid',  from: 70, to: Infinity, color: 'rgba(37,99,235,0.14)'    },
]

const tvocThresholdBands = [
  { label: 'Clean',    from: 0,    to: 220,      color: 'rgba(34,197,94,0.10)'   },
  { label: 'Low',      from: 220,  to: 660,      color: 'rgba(234,179,8,0.12)'   },
  { label: 'Moderate', from: 660,  to: 2200,     color: 'rgba(249,115,22,0.13)'  },
  { label: 'High',     from: 2200, to: 5500,     color: 'rgba(239,68,68,0.14)'   },
  { label: 'Danger',   from: 5500, to: Infinity, color: 'rgba(127,0,0,0.18)'     },
]

const battThresholdBands = [
  { label: 'Critical', from: 0,  to: 20,  color: 'rgba(239,68,68,0.14)'   },
  { label: 'Low',      from: 20, to: 40,  color: 'rgba(249,115,22,0.12)'  },
  { label: 'Good',     from: 40, to: 80,  color: 'rgba(234,179,8,0.10)'   },
  { label: 'Full',     from: 80, to: 100, color: 'rgba(34,197,94,0.09)'   },
]

// ── Live telemetry ───────────────────────────────────────────────────────────
const {
  data: live,
  pending: livePending,
  error: liveError,
} = await useFetch("/api/dashboard/device-live", {
  headers: { "Cache-Control": "no-cache" },
  query: { device_uid: selectedDeviceUid },
})

// ── Air quality trends (main charts) ────────────────────────────────────────
const {
  data: trends,
  pending: trendsPending,
  error: trendsError,
} = await useFetch("/api/dashboard/device-trends", {
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid,
    hours: RANGE_FETCH_HOURS[universalRange.value] ?? 25,
  })),
  watch: [universalRange],
  immediate: true,
})

// ── IAQ 6h window for sparkline ──────────────────────────────────────────────
const { data: iaqTrends } = await useFetch("/api/dashboard/device-trends", {
  headers: { "Cache-Control": "no-cache" },
  query: { device_uid: selectedDeviceUid, hours: 7 },
})

// ── Route trends ─────────────────────────────────────────────────────────────
const {
  data: routeTrends,
  pending: routePending,
} = await useFetch("/api/dashboard/device-trends", {
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid,
    hours: routeHoursFetched.value,
  })),
  watch: [routeHoursFetched],
  immediate: true,
})

// ── Packet panel ─────────────────────────────────────────────────────────────
const packetRangeKeys = ["1h", "3h", "6h", "12h", "24h", "50h", "7d", "30d"]
const PACKET_RANGE_HOURS = {
  '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24, '50h': 50, '7d': 168, '30d': 720,
}
const packetRange = ref("24h")
const packetPage = ref(0)
watch([packetLimit, packetRange], () => { packetPage.value = 0 })

const {
  data: packetTrends,
  pending: packetTrendsPending,
} = await useFetch("/api/dashboard/device-trends", {
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid,
    hours: PACKET_RANGE_HOURS[packetRange.value] ?? 24,
  })),
  watch: [packetRange],
  immediate: true,
})

// ── IAQ composite score ──────────────────────────────────────────────────────
const iaqScores = computed(() => scoresFromTrends(iaqTrends.value))
const iaqCurrentScore = computed(() => {
  const s = iaqScores.value
  return s.length ? s[s.length - 1] : null
})
const iaqLineColor = computed(() => iaqCurrentScore.value != null ? iaqColor(iaqCurrentScore.value) : '#94a3b8')
const iaqScoreLabel = computed(() => iaqCurrentScore.value != null ? calcIaqLabel(iaqCurrentScore.value) : '—')
const iaqSparkPoints = computed(() => sparklinePoints(iaqScores.value, 600, 56))
const iaqFillD = computed(() => sparklineFillPath(iaqScores.value, 600, 56))

// ── Route coords ─────────────────────────────────────────────────────────────
const routeCoords = computed(() => {
  const lats = routeTrends.value?.lats ?? []
  const lons = routeTrends.value?.lons ?? []
  const pairs = []
  for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
    const lat = Number(lats[i])
    const lon = Number(lons[i])
    if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
      pairs.push([lat, lon])
    }
  }
  return pairs
})

// ── Error messages ───────────────────────────────────────────────────────────
const liveErrorMessage = computed(() => {
  const e = liveError.value
  return e?.data?.message || e?.message || String(e || "")
})

const trendsErrorMessage = computed(() => {
  const e = trendsError.value
  return e?.data?.message || e?.message || String(e || "")
})

// ── Telemetry helpers ────────────────────────────────────────────────────────
const nowMs = ref(Date.now())

function formatMetric(value, decimals = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "--"
  return n.toFixed(decimals)
}

function formatPacketTime(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(n * 1000))
}

function formatPacketTimeShort(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(n * 1000))
}

function formatPacketValue(value, decimals = 0, unit = "") {
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(decimals)}${unit ? ` ${unit}` : ""}`
}

function aqiEmoji(aqi) {
  const n = Number(aqi)
  if (!Number.isFinite(n)) return ""
  if (n <= 1) return "😄"
  if (n <= 2) return "🙂"
  if (n <= 3) return "😐"
  if (n <= 4) return "😟"
  return "😰"
}

// ── Chart series ─────────────────────────────────────────────────────────────
function hasData(arr) {
  return Array.isArray(arr) && arr.some(v => v !== null && Number.isFinite(Number(v)))
}

const co2Series = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.ensEco2s)) series.push({ name: 'ENS eCO₂', color: '#6a1b9a', values: t.ensEco2s })
  if (hasData(t?.scdCo2s))  series.push({ name: 'SCD CO₂',  color: '#00796b', values: t.scdCo2s })
  return series
})

const tempSeries = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.ahtTemps)) series.push({ name: 'AHT Temp', color: '#c62828', values: t.ahtTemps })
  if (hasData(t?.scdTemps)) series.push({ name: 'SCD Temp', color: '#1565c0', values: t.scdTemps })
  if (hasData(t?.rtcTemps)) series.push({ name: 'RTC Temp', color: '#2e7d32', values: t.rtcTemps })
  return series
})

const humiditySeries = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.ahtHumidities)) series.push({ name: 'AHT RH', color: '#1565c0', values: t.ahtHumidities })
  if (hasData(t?.scdHumidities)) series.push({ name: 'SCD RH', color: '#00838f', values: t.scdHumidities })
  return series
})

const tvocSeries = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.ensTvocs)) series.push({ name: 'TVOC', color: '#ef6c00', values: t.ensTvocs })
  return series
})

const battLevelSeries = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.inaBattPcts)) series.push({ name: 'Battery %', color: '#f59e0b', values: t.inaBattPcts })
  if (hasData(t?.inaBusVs)) {
    const scaled = t.inaBusVs.map(v => v == null ? null : +Math.max(0, Math.min(100, (v - 3.30) / (4.20 - 3.30) * 100)).toFixed(1))
    series.push({ name: 'Bus V (scaled)', color: '#fbbf24', values: scaled })
  }
  return series
})

const battCurrentSeries = computed(() => {
  const t = trends.value
  const series = []
  if (hasData(t?.inaCurrentMas)) series.push({ name: 'Current (mA)', color: '#3b82f6', values: t.inaCurrentMas })
  return series
})

// ── Packets table ─────────────────────────────────────────────────────────────
const allPackets = computed(() => {
  const d             = packetTrends.value
  const telemetryIds  = Array.isArray(d?.telemetryIds)   ? d.telemetryIds  : []
  const ts            = Array.isArray(d?.timestamps)      ? d.timestamps    : []
  const ensEco2s      = Array.isArray(d?.ensEco2s)        ? d.ensEco2s      : []
  const scdCo2s       = Array.isArray(d?.scdCo2s)         ? d.scdCo2s       : []
  const ahtTemps      = Array.isArray(d?.ahtTemps)        ? d.ahtTemps      : []
  const scdTemps      = Array.isArray(d?.scdTemps)        ? d.scdTemps      : []
  const rtcTemps      = Array.isArray(d?.rtcTemps)        ? d.rtcTemps      : []
  const ahtHumidities = Array.isArray(d?.ahtHumidities)   ? d.ahtHumidities : []
  const scdHumidities = Array.isArray(d?.scdHumidities)   ? d.scdHumidities : []
  const ensTvocs      = Array.isArray(d?.ensTvocs)        ? d.ensTvocs      : []
  const inaBusVs      = Array.isArray(d?.inaBusVs)        ? d.inaBusVs      : []
  const inaCurrentMas = Array.isArray(d?.inaCurrentMas)   ? d.inaCurrentMas : []
  const inaPowerMws   = Array.isArray(d?.inaPowerMws)     ? d.inaPowerMws   : []
  const inaBattPcts   = Array.isArray(d?.inaBattPcts)     ? d.inaBattPcts   : []
  const lats          = Array.isArray(d?.lats)            ? d.lats          : []
  const lons          = Array.isArray(d?.lons)            ? d.lons          : []

  return ts
      .map((t, i) => ({
        ts:             Number(t) || i,
        timeLabel:      formatPacketTime(t),
        timeLabelShort: formatPacketTimeShort(t),
        ensEco2:        formatPacketValue(ensEco2s[i],  0, "ppm"),
        scdCo2:         formatPacketValue(scdCo2s[i],   0, "ppm"),
        ahtTemp:        formatPacketValue(ahtTemps[i],  1, "°C"),
        scdTemp:        formatPacketValue(scdTemps[i],  1, "°C"),
        rtcTemp:        formatPacketValue(rtcTemps[i],  1, "°C"),
        tvoc:           formatPacketValue(ensTvocs[i],  0, "ppb"),
        raw: {
          lat: lats[i] ?? null,
          lon: lons[i] ?? null,
        },
      }))
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => b.ts - a.ts)
})

const totalPacketPages = computed(() => Math.max(1, Math.ceil(allPackets.value.length / packetLimit.value)))

const paginatedPackets = computed(() => {
  const start = packetPage.value * packetLimit.value
  return allPackets.value.slice(start, start + packetLimit.value)
})
</script>

<style scoped>
/* ── CSS vars / theme ───────────────────────────────────────────────────────── */
.wrap {
  --bg: #f7f8fb;
  --panel: rgba(0, 0, 0, 0.04);
  --panel-strong: rgba(0, 0, 0, 0.06);
  --border: rgba(0, 0, 0, 0.10);
  --text: #111827;
  --muted: rgba(17, 24, 39, 0.72);
  --btn-bg: rgba(0, 0, 0, 0.04);
  --btn-hover: rgba(0, 0, 0, 0.07);
  --input-bg: #ffffff;
  --tableHead: rgba(0, 0, 0, 0.04);
  --tableRow: rgba(0, 0, 0, 0.02);
  --card-bg: rgba(255, 255, 255, 0.55);
  --card-hover: rgba(255, 255, 255, 0.82);
  --divider: rgba(0, 0, 0, 0.08);
  --pre-bg: rgba(0, 0, 0, 0.06);

  max-width: 980px;
  margin: 0 auto;
  padding: 28px 18px 60px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans";
  color: var(--text);
  background: var(--bg);
}

.wrap[data-theme="dark"] {
  --bg: #061327;
  --panel: rgba(255, 255, 255, 0.055);
  --panel-strong: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.12);
  --text: #eef2f7;
  --muted: rgba(238, 242, 247, 0.72);
  --btn-bg: rgba(255, 255, 255, 0.06);
  --btn-hover: rgba(255, 255, 255, 0.12);
  --input-bg: rgba(255, 255, 255, 0.08);
  --tableHead: rgba(255, 255, 255, 0.06);
  --tableRow: rgba(255, 255, 255, 0.025);
  --card-bg: rgba(255, 255, 255, 0.04);
  --card-hover: rgba(255, 255, 255, 0.08);
  --divider: rgba(255, 255, 255, 0.09);
  --pre-bg: rgba(255, 255, 255, 0.06);
}

/* ── Layout ──────────────────────────────────────────────────────────────────── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.sectionHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

/* ── Buttons ────────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  text-decoration: none;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn:hover {
  background: var(--btn-hover);
}

.btn.primary {
  background: #1f7a3a;
  color: white;
  border-color: #1f7a3a;
}

.btnGithub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.githubIcon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.iconBtn {
  min-width: 40px;
  padding: 8px 10px;
  font-size: 18px;
  line-height: 1;
}

.abIconLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 4px;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.abIconLink:hover {
  opacity: 0.75;
}

.abIcon {
  width: 36px;
  height: 36px;
  display: block;
}

.abIconMobile {
  display: block;
}

.abLogoDesktop {
  display: none;
}

.abLogo {
  height: 36px;
  width: auto;
}

@media (min-width: 641px) {
  .abIconMobile {
    display: none;
  }
  .abLogoDesktop {
    display: block;
  }
}

/* ── Cards ──────────────────────────────────────────────────────────────────── */
.card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  overflow: hidden;
}

.card h2 {
  margin: 0 0 4px;
  font-size: 18px;
}

/* ── Utility ────────────────────────────────────────────────────────────────── */
.muted {
  color: var(--muted);
}

.tiny {
  font-size: 12px;
}

.error {
  color: #d96767;
}

/* ── AQI banner ──────────────────────────────────────────────────────────────── */
.aqiBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
}

.aqiBannerEmoji {
  font-size: 28px;
  line-height: 1;
}

.aqiBannerLabel {
  font-size: 15px;
  font-weight: 600;
}

/* ── IAQ strip ───────────────────────────────────────────────────────────────── */
.iaqStrip {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: var(--card-bg, rgba(0,0,0,0.04));
  border: 1px solid var(--border, rgba(0,0,0,0.08));
}
[data-theme="dark"] .iaqStrip {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}
.iaqStripLeft {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 6rem;
  flex-shrink: 0;
}
.iaqStripScore {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.iaqStripLabel {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  margin-top: 0.2rem;
}
.iaqStripSub {
  font-size: 0.68rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 0.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.iaqStripChart {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.iaqSparkSvg {
  width: 100%;
  height: 56px;
  display: block;
  overflow: visible;
}

/* ── Latest telemetry metrics ────────────────────────────────────────────────── */
.metricsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.meta {
  display: grid;
  gap: 6px;
  margin-top: 14px;
}

/* ── Charts panel ────────────────────────────────────────────────────────────── */
.chartsPanel {
  padding: 16px 16px 12px;
}

.chartsPanelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.chartsPanelTitle {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.88;
}

.chartSubCards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chartSubCard {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.chartSubCard:first-child {
  border-top: none;
  padding-top: 0;
}

.chartCardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.expandBtn {
  min-width: 32px;
  font-size: 15px;
  padding: 5px 9px;
}

.chartCardTitle {
  font-size: 15px;
  font-weight: 600;
  opacity: 0.88;
}

.chartEmpty {
  padding: 24px 0;
}

.rangeBar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rangeBtn {
  min-height: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rangeBtn:hover {
  background: var(--btn-hover);
}

.rangeBtn.active {
  background: var(--panel-strong);
  border-color: rgba(49, 130, 206, 0.45);
  box-shadow: inset 0 0 0 1px rgba(49, 130, 206, 0.2);
}

/* ── Location panel ─────────────────────────────────────────────────────────── */
.mapControls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapWrapper {
  position: relative;
}

.mapLoadingOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 12px;
  z-index: 10;
  color: #fff;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.mapFade-enter-active,
.mapFade-leave-active {
  transition: opacity 0.3s ease;
}
.mapFade-enter-from,
.mapFade-leave-to {
  opacity: 0;
}

.locationStale {
  font-style: italic;
  opacity: 0.7;
}

/* ── Route slider ────────────────────────────────────────────────────────────── */
.routeSliderWrap {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.routeSliderWrap.routeSliderActive {
  opacity: 1;
}

.routeSliderHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.routeSliderValue {
  font-size: 13px;
  font-weight: 600;
  min-width: 32px;
}

.routeSliderInput {
  width: 100%;
  accent-color: #3b82f6;
  cursor: pointer;
  height: 4px;
}

.routeSliderTicks {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  padding: 0 2px;
}

.locationMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  padding: 0 2px;
}

.locationCoord {
  white-space: nowrap;
}

/* ── Latest packets ─────────────────────────────────────────────────────────── */
.packetHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.packetHead h2 {
  margin: 0 0 2px;
  font-size: 18px;
}

.packetControls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.packetTime {
  white-space: nowrap;
  font-size: 12px;
  cursor: default;
}

.packetCoord {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
  white-space: nowrap;
  color: var(--muted);
}

.packetTableWrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.packetTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.packetTable thead th {
  text-align: left;
  padding: 10px 12px;
  background: var(--tableHead);
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.packetTable tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.packetTable tbody tr:nth-child(even) {
  background: var(--tableRow);
}

.packetTable tbody tr:last-child td {
  border-bottom: none;
}

.paginationBar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 0 2px;
  flex-wrap: wrap;
}

.paginationInfo {
  min-width: 60px;
  text-align: center;
}

.paginationLimit {
  margin-left: 6px;
  border-left: 1px solid var(--border);
  padding-left: 10px;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .header {
    flex-wrap: wrap;
  }

  .rangeBar {
    justify-content: flex-start;
  }

  .chartsPanel {
    padding: 12px 12px 8px;
  }

  .chartsPanelHead {
    flex-direction: column;
    align-items: flex-start;
  }

  .packetHead {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
}

html[data-airbuddy-theme="light"],
html[data-airbuddy-theme="light"] body {
  background: #f7f8fb;
}

html[data-airbuddy-theme="dark"],
html[data-airbuddy-theme="dark"] body {
  background: #061327;
}
</style>
