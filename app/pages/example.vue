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
          <h1>AirBuddy Example</h1>
          <p class="muted">Live air quality data from device AB-0002</p>
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

    <!-- Charts panel — all sensors with shared range controls -->
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

        <!-- eCO₂ -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">eCO₂</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.eco2 = !chartExpanded.eco2"
                :title="chartExpanded.eco2 ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.eco2"
            >{{ chartExpanded.eco2 ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="[{ name: 'eCO₂', color: '#6a1b9a', values: trends.eco2s }]"
              :range="universalRange"
              :theme="theme"
              unit="ppm"
              :decimals="0"
              :height="chartExpanded.eco2 ? 400 : 200"
              :yMin="350"
              :thresholdBands="eco2ThresholdBands"
          />
        </div>

        <!-- Temperature -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Temperature</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.temp = !chartExpanded.temp"
                :title="chartExpanded.temp ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.temp"
            >{{ chartExpanded.temp ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="[
                { name: 'Sensor', color: '#c62828', values: trends.temps },
                { name: 'RTC',    color: '#2e7d32', values: trends.rtcTemps },
              ]"
              :range="universalRange"
              :theme="theme"
              unit="°C"
              :decimals="1"
              :height="chartExpanded.temp ? 440 : 220"
              :yPad="5"
              :thresholdBands="tempThresholdBands"
              :showLegend="true"
          />
        </div>

        <!-- Humidity -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Humidity</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.humidity = !chartExpanded.humidity"
                :title="chartExpanded.humidity ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.humidity"
            >{{ chartExpanded.humidity ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="[{ name: 'Humidity', color: '#1565c0', values: trends.rhs }]"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="1"
              :height="chartExpanded.humidity ? 400 : 200"
              :thresholdBands="humidityThresholdBands"
          />
        </div>

        <!-- TVOC -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">TVOC</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.tvoc = !chartExpanded.tvoc"
                :title="chartExpanded.tvoc ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.tvoc"
            >{{ chartExpanded.tvoc ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="trends.timestamps"
              :series="[{ name: 'TVOC', color: '#ef6c00', values: trends.tvocs }]"
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

    <!-- Latest packets -->
    <section class="card">
      <div class="packetHead">
        <h2>Latest 10 Packets</h2>
        <span class="tiny muted">{{ latestPackets.length }} shown</span>
      </div>

      <div v-if="trendsPending" class="muted tiny">Loading…</div>
      <div v-else-if="!latestPackets.length" class="muted tiny">No recent packets available.</div>

      <div v-else class="packetTableWrap">
        <table class="packetTable">
          <thead>
          <tr>
            <th>Time</th>
            <th>eCO₂</th>
            <th>Temp</th>
            <th>RH</th>
            <th>TVOC</th>
            <th>RTC</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="pkt in latestPackets" :key="pkt.ts">
            <td>{{ pkt.timeLabel }}</td>
            <td>{{ pkt.eco2 }}</td>
            <td>{{ pkt.temp }}</td>
            <td>{{ pkt.rh }}</td>
            <td>{{ pkt.tvoc }}</td>
            <td>{{ pkt.rtcTemp }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Latest telemetry metrics -->
    <section class="card">
      <h2>Latest Telemetry</h2>

      <div v-if="livePending" class="muted">
        Loading latest telemetry…
      </div>

      <div v-else-if="liveError" class="error">
        Latest telemetry failed: {{ liveErrorMessage }}
      </div>

      <template v-else>
        <div class="metricsGrid">
          <MetricCard label="CO₂" :value="formatMetric(live?.eco2_ppm, 0)" unit="ppm" />
          <MetricCard label="Temperature" :value="formatMetric(live?.temp_c, 1)" unit="°C" />
          <MetricCard label="Humidity" :value="formatMetric(live?.rh_pct, 1)" unit="%" />
          <MetricCard label="AQI" :value="formatMetric(live?.aqi, 0)" />
        </div>

        <div class="meta tiny muted">
          <div><strong>Device:</strong> {{ live?.device_name || selectedDeviceUid || "—" }}</div>
          <div><strong>Home:</strong> {{ live?.home_name || "—" }}</div>
          <div><strong>Room:</strong> {{ live?.room_name || "—" }}</div>
          <div><strong>Recorded:</strong> {{ live?.recorded_at || "—" }}</div>
          <div><strong>Received:</strong> {{ live?.received_at || "—" }}</div>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
import AirTrendChart from '~/components/charts/AirTrendChart.vue'

useHead({ title: 'AirBuddy | Example Device' })

// ── Theme ────────────────────────────────────────────────────────────────────
const theme = ref("light")
let nowTimer = null

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

// ── Hardcoded device ─────────────────────────────────────────────────────────
const selectedDeviceUid = ref("AB-0002")

// ── Chart ranges & threshold bands ──────────────────────────────────────────
const trendRangeKeys = ["15m", "30m", "1h", "3h", "6h", "12h", "24h", "36h", "72h", "7d", "30d"]

const universalRange = ref("1h")

const RANGE_FETCH_HOURS = {
  '15m': 1, '30m': 1, '1h': 2, '3h': 4, '6h': 7, '12h': 13, '24h': 25,
  '36h': 37, '72h': 73, '7d': 169, '30d': 721,
}

const chartExpanded = reactive({
  eco2: false,
  temp: false,
  humidity: false,
  tvoc: false,
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

// ── Live telemetry & trends ──────────────────────────────────────────────────
const {
  data: live,
  pending: livePending,
  error: liveError,
} = await useFetch("/api/dashboard/device-live", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: { device_uid: selectedDeviceUid.value },
})

const {
  data: trends,
  pending: trendsPending,
  error: trendsError,
} = await useFetch("/api/example/device-trends", {
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    hours: RANGE_FETCH_HOURS[universalRange.value] ?? 25,
  })),
  watch: [universalRange],
})

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

const latestPackets = computed(() => {
  const ts = Array.isArray(trends.value?.timestamps) ? trends.value.timestamps : []
  const eco2s = Array.isArray(trends.value?.eco2s) ? trends.value.eco2s : []
  const temps = Array.isArray(trends.value?.temps) ? trends.value.temps : []
  const rhs = Array.isArray(trends.value?.rhs) ? trends.value.rhs : []
  const tvocs = Array.isArray(trends.value?.tvocs) ? trends.value.tvocs : []
  const rtcTemps = Array.isArray(trends.value?.rtcTemps) ? trends.value.rtcTemps : []

  return ts
      .map((t, i) => ({
        ts: Number(t) || i,
        timeLabel: formatPacketTime(t),
        eco2: formatPacketValue(eco2s[i], 0, "ppm"),
        temp: formatPacketValue(temps[i], 1, "°C"),
        rh: formatPacketValue(rhs[i], 1, "%"),
        tvoc: formatPacketValue(tvocs[i], 0, "ppb"),
        rtcTemp: formatPacketValue(rtcTemps[i], 1, "°C"),
      }))
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10)
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
  margin: 0 0 10px;
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

/* ── Latest packets ─────────────────────────────────────────────────────────── */
.packetHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.packetHead h2 {
  margin: 0;
  font-size: 18px;
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
