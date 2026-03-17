<template>
  <main class="wrap" :data-theme="theme">
    <header class="header">
      <div class="brandBlock">
        <img class="logo" src="/airbuddy-logo.svg" alt="AirBuddy" />

        <div class="brandText">
          <p class="sub">Home-first air intelligence • air2 staging</p>

          <div class="authline">
            <template v-if="mePending">
              <span class="muted">Auth: checking…</span>
            </template>

            <template v-else-if="meOk">
              <span class="okline">
                Signed in as <strong>{{ meName }}</strong>
                <span class="muted tiny">({{ meEmail }})</span>
              </span>
            </template>

            <template v-else>
              <span class="muted">Signed out</span>
            </template>
          </div>

          <div class="brandPills">
            <div class="pill" :data-ok="status === 'ok'">
              <span class="dot" />
              <span class="label">{{ statusLabel }}</span>
            </div>

            <div class="pill" :data-ok="deviceActive">
              <span class="dot" />
              <span class="label">{{ deviceActiveLabel }}</span>
            </div>
          </div>

          <div class="brandLinks">
            <a class="repoLink" href="https://github.com/russs95/airbuddy-online" target="_blank" rel="noopener noreferrer">AB-online ↗</a>
            <a class="repoLink" href="https://github.com/russs95/airbuddy_v2" target="_blank" rel="noopener noreferrer">AB 2.0 ↗</a>
            <a class="repoLink" href="https://github.com/russs95/airbuddy-spa" target="_blank" rel="noopener noreferrer">AB SPA ↗</a>
          </div>
        </div>
      </div>

      <div class="right">
        <div class="authBtns">
          <button
              class="btn iconBtn"
              @click="toggleTheme"
              :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
          >
            {{ theme === "dark" ? "☀️" : "🌙" }}
          </button>

          <a v-if="!meOk" class="btn" href="/api/auth/login">Login</a>

          <NuxtLink class="btn" to="/dashboard">Dashboard</NuxtLink>

          <button
              v-if="meOk"
              class="btn danger"
              @click="logout"
              :disabled="logoutPending"
          >
            {{ logoutPending ? "Logging out..." : "Logout" }}
          </button>
        </div>
      </div>
    </header>

    <section class="card">
      <h2>Device Selection</h2>

      <div v-if="!meOk" class="muted">
        Log in to load your registered devices.
      </div>

      <div v-else-if="bootstrapPending" class="muted">
        Loading devices…
      </div>

      <div v-else-if="bootstrapError" class="error">
        Could not load your homes/devices: {{ bootstrapErrorMessage }}
      </div>

      <div v-else-if="!deviceOptions.length" class="muted">
        No registered devices yet. Add one from the dashboard.
      </div>

      <div v-else class="selectorBlock">
        <label class="tiny muted" for="device-select">Choose device</label>

        <select id="device-select" v-model="selectedDeviceUid" class="select">
          <option
              v-for="d in deviceOptions"
              :key="d.device_uid"
              :value="d.device_uid"
          >
            {{ d.label }}
          </option>
        </select>

        <div class="muted tiny">
          Selected:
          <strong>{{ selectedDeviceLabel }}</strong>
        </div>
      </div>
    </section>

    <!-- eCO₂ chart card — migrated to AirTrendChart (ECharts) -->
    <section class="card chartTopCard">
      <div class="chartCardHead">
        <span class="chartCardTitle">eCO₂</span>
        <div class="chartCardControls">
          <div class="rangeBar" role="group" aria-label="eCO₂ time range">
            <button
                v-for="r in trendRangeKeys"
                :key="r"
                class="rangeBtn"
                :class="{ active: chartRanges.eco2 === r }"
                @click="chartRanges.eco2 = r"
            >{{ r }}</button>
          </div>
          <button
              class="rangeBtn expandBtn"
              @click="chartExpanded.eco2 = !chartExpanded.eco2"
              :title="chartExpanded.eco2 ? 'Collapse chart' : 'Expand chart'"
              :aria-pressed="chartExpanded.eco2"
          >{{ chartExpanded.eco2 ? '⊟' : '⊞' }}</button>
        </div>
      </div>
      <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
      <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
      <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
      <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
      <AirTrendChart
          v-else
          :timestamps="trends.timestamps"
          :series="[{ name: 'eCO₂', color: '#6a1b9a', values: trends.eco2s }]"
          :range="chartRanges.eco2"
          :theme="theme"
          unit="ppm"
          :decimals="0"
          :height="chartExpanded.eco2 ? 400 : 200"
          :yMin="350"
          :thresholdBands="eco2ThresholdBands"
      />
    </section>

    <!-- Temperature chart card -->
    <section class="card chartTopCard">
      <div class="chartCardHead">
        <span class="chartCardTitle">Temperature</span>
        <div class="chartCardControls">
          <div class="rangeBar" role="group" aria-label="Temperature time range">
            <button
                v-for="r in trendRangeKeys"
                :key="r"
                class="rangeBtn"
                :class="{ active: chartRanges.temp === r }"
                @click="chartRanges.temp = r"
            >{{ r }}</button>
          </div>
          <button
              class="rangeBtn expandBtn"
              @click="chartExpanded.temp = !chartExpanded.temp"
              :title="chartExpanded.temp ? 'Collapse chart' : 'Expand chart'"
              :aria-pressed="chartExpanded.temp"
          >{{ chartExpanded.temp ? '⊟' : '⊞' }}</button>
        </div>
      </div>
      <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
      <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
      <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
      <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
      <AirTrendChart
          v-else
          :timestamps="trends.timestamps"
          :series="[
            { name: 'Sensor', color: '#c62828', values: trends.temps },
            { name: 'RTC',    color: '#2e7d32', values: trends.rtcTemps },
          ]"
          :range="chartRanges.temp"
          :theme="theme"
          unit="°C"
          :decimals="1"
          :height="chartExpanded.temp ? 440 : 220"
          :yPad="5"
          :thresholdBands="tempThresholdBands"
          :showLegend="true"
      />
    </section>

    <!-- Humidity chart card -->
    <section class="card chartTopCard">
      <div class="chartCardHead">
        <span class="chartCardTitle">Humidity</span>
        <div class="chartCardControls">
          <div class="rangeBar" role="group" aria-label="Humidity time range">
            <button
                v-for="r in trendRangeKeys"
                :key="r"
                class="rangeBtn"
                :class="{ active: chartRanges.humidity === r }"
                @click="chartRanges.humidity = r"
            >{{ r }}</button>
          </div>
          <button
              class="rangeBtn expandBtn"
              @click="chartExpanded.humidity = !chartExpanded.humidity"
              :title="chartExpanded.humidity ? 'Collapse chart' : 'Expand chart'"
              :aria-pressed="chartExpanded.humidity"
          >{{ chartExpanded.humidity ? '⊟' : '⊞' }}</button>
        </div>
      </div>
      <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
      <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
      <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
      <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
      <AirTrendChart
          v-else
          :timestamps="trends.timestamps"
          :series="[{ name: 'Humidity', color: '#1565c0', values: trends.rhs }]"
          :range="chartRanges.humidity"
          :theme="theme"
          unit="%"
          :decimals="1"
          :height="chartExpanded.humidity ? 400 : 200"
          :thresholdBands="humidityThresholdBands"
      />
    </section>

    <!-- TVOC chart card -->
    <section class="card chartTopCard">
      <div class="chartCardHead">
        <span class="chartCardTitle">TVOC</span>
        <div class="chartCardControls">
          <div class="rangeBar" role="group" aria-label="TVOC time range">
            <button
                v-for="r in trendRangeKeys"
                :key="r"
                class="rangeBtn"
                :class="{ active: chartRanges.tvoc === r }"
                @click="chartRanges.tvoc = r"
            >{{ r }}</button>
          </div>
          <button
              class="rangeBtn expandBtn"
              @click="chartExpanded.tvoc = !chartExpanded.tvoc"
              :title="chartExpanded.tvoc ? 'Collapse chart' : 'Expand chart'"
              :aria-pressed="chartExpanded.tvoc"
          >{{ chartExpanded.tvoc ? '⊟' : '⊞' }}</button>
        </div>
      </div>
      <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
      <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
      <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
      <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
      <AirTrendChart
          v-else
          :timestamps="trends.timestamps"
          :series="[{ name: 'TVOC', color: '#ef6c00', values: trends.tvocs }]"
          :range="chartRanges.tvoc"
          :theme="theme"
          unit="ppb"
          :decimals="0"
          :height="chartExpanded.tvoc ? 400 : 200"
          :yMin="0"
          :thresholdBands="tvocThresholdBands"
      />
    </section>

    <!-- Latest packets card -->
    <section class="card">
      <div class="packetHead">
        <h2>Latest 10 Packets</h2>
        <span class="tiny muted">{{ latestPackets.length }} shown</span>
      </div>

      <div v-if="!selectedDeviceUid" class="muted tiny">Select a device to view packets.</div>
      <div v-else-if="trendsPending" class="muted tiny">Loading…</div>
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

    <section class="card">
      <h2>Latest Telemetry</h2>

      <div v-if="!selectedDeviceUid" class="muted">
        Select a device to view live telemetry.
      </div>

      <div v-else-if="livePending" class="muted">
        Loading latest telemetry…
      </div>

      <div v-else-if="liveError" class="error">
        Latest telemetry failed: {{ liveErrorMessage }}
      </div>

      <template v-else>
        <div class="grid">
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

const router = useRouter()

const theme = ref("light")
const logoutPending = ref(false)
const selectedDeviceUid = ref("")
const nowMs = ref(Date.now())
const trendRangeKeys = ["15m", "30m", "1h", "3h", "6h", "12h", "24h"]

const chartRanges = reactive({
  eco2: "1h",
  temp: "1h",
  humidity: "1h",
  tvoc: "1h",
})

const chartExpanded = reactive({
  eco2: false,
  temp: false,
  humidity: false,
  tvoc: false,
})

// eCO₂ threshold bands — passed to AirTrendChart as background safety zones.
// Colors use low-opacity RGBA so they stay subtle behind the data line.
const eco2ThresholdBands = [
  { label: 'Good',      from: 0,    to: 800,      color: 'rgba(34,197,94,0.10)'  }, // soft green
  { label: 'OK',        from: 800,  to: 1000,     color: 'rgba(234,179,8,0.12)'  }, // soft yellow
  { label: 'Poor',      from: 1000, to: 1400,     color: 'rgba(249,115,22,0.13)' }, // soft orange
  { label: 'Bad',       from: 1400, to: 2000,     color: 'rgba(239,68,68,0.13)'  }, // soft red-orange
  { label: 'Dangerous', from: 2000, to: Infinity,  color: 'rgba(185,28,28,0.16)'  }, // soft deep red
]

// Temperature comfort bands (°C) — human comfort zones.
const tempThresholdBands = [
  { label: 'Cold',        from: -Infinity, to: 16,       color: 'rgba(99,179,237,0.13)'  }, // icy blue
  { label: 'Cool',        from: 16,        to: 20,       color: 'rgba(56,189,248,0.10)'  }, // light blue
  { label: 'Comfortable', from: 20,        to: 25,       color: 'rgba(34,197,94,0.10)'   }, // soft green
  { label: 'Warm',        from: 25,        to: 28,       color: 'rgba(251,191,36,0.12)'  }, // soft amber
  { label: 'Hot',         from: 28,        to: Infinity, color: 'rgba(239,68,68,0.13)'   }, // soft red
]

// Humidity comfort bands (% RH).
const humidityThresholdBands = [
  { label: 'Very Dry',    from: 0,  to: 25,       color: 'rgba(210,180,140,0.18)'  }, // warm beige
  { label: 'Dry',         from: 25, to: 40,       color: 'rgba(230,210,170,0.13)'  }, // light tan
  { label: 'Comfortable', from: 40, to: 60,       color: 'rgba(34,197,94,0.10)'    }, // soft green
  { label: 'Humid',       from: 60, to: 70,       color: 'rgba(56,189,248,0.11)'   }, // light blue
  { label: 'Very Humid',  from: 70, to: Infinity, color: 'rgba(37,99,235,0.14)'    }, // deeper blue
]

// TVOC threshold bands (ppb) — based on indoor air quality guidelines.
const tvocThresholdBands = [
  { label: 'Clean',    from: 0,    to: 220,      color: 'rgba(34,197,94,0.10)'   }, // soft green
  { label: 'Low',      from: 220,  to: 660,      color: 'rgba(234,179,8,0.12)'   }, // soft yellow
  { label: 'Moderate', from: 660,  to: 2200,     color: 'rgba(249,115,22,0.13)'  }, // soft orange
  { label: 'High',     from: 2200, to: 5500,     color: 'rgba(239,68,68,0.14)'   }, // soft red
  { label: 'Danger',   from: 5500, to: Infinity, color: 'rgba(127,0,0,0.18)'     }, // deep red
]

let nowTimer = null

onMounted(() => {
  const saved = localStorage.getItem("airbuddy-theme")
  if (saved === "dark" || saved === "light") {
    theme.value = saved
  } else {
    theme.value = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }

  document.documentElement.setAttribute("data-airbuddy-theme", theme.value)

  nowTimer = window.setInterval(() => {
    nowMs.value = Date.now()
  }, 1000)
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

const {
  data: health,
  pending,
  error,
} = await useFetch("/api/health", {
  method: "GET",
  headers: { "Cache-Control": "no-cache" },
  credentials: "include",
})

const {
  data: me,
  pending: mePending,
  refresh: refreshMe,
} = await useFetch("/api/me", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
})

const meOk = computed(() => me.value?.ok === true)

// Redirect authenticated users to the dashboard
watch(meOk, (ok) => {
  if (ok) router.replace('/dashboard')
}, { immediate: true })
const meName = computed(
    () =>
        me.value?.user?.full_name ||
        me.value?.user?.username ||
        me.value?.user?.first_name ||
        "User"
)
const meEmail = computed(() => me.value?.user?.email || "")

const {
  data: bootstrap,
  pending: bootstrapPending,
  error: bootstrapError,
} = await useFetch("/api/dashboard/bootstrap", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  default: () => ({
    ok: true,
    homes: [],
  }),
})

const bootstrapErrorMessage = computed(() => {
  const e = bootstrapError.value
  return e?.data?.message || e?.message || String(e || "")
})

const deviceOptions = computed(() => {
  const homes = bootstrap.value?.homes || []
  const out = []

  for (const home of homes) {
    for (const room of home.rooms || []) {
      for (const device of room.devices || []) {
        out.push({
          device_uid: device.device_uid,
          label: `${device.device_name || device.device_uid} — ${home.home_name} / ${room.room_name}`,
        })
      }
    }

    for (const device of home.unassigned_devices || []) {
      out.push({
        device_uid: device.device_uid,
        label: `${device.device_name || device.device_uid} — ${home.home_name} / Unassigned`,
      })
    }
  }

  return out
})

watch(
    deviceOptions,
    (list) => {
      if (!list.length) {
        selectedDeviceUid.value = ""
        return
      }

      if (!selectedDeviceUid.value || !list.some((d) => d.device_uid === selectedDeviceUid.value)) {
        selectedDeviceUid.value = list[0].device_uid
      }
    },
    { immediate: true }
)

const selectedDeviceLabel = computed(() => {
  return deviceOptions.value.find((d) => d.device_uid === selectedDeviceUid.value)?.label || "None"
})

const {
  data: live,
  pending: livePending,
  error: liveError,
} = await useFetch("/api/dashboard/device-live", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
  })),
  watch: [selectedDeviceUid],
  immediate: true,
})

const {
  data: trends,
  pending: trendsPending,
  error: trendsError,
} = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
    hours: 24,
  })),
  watch: [selectedDeviceUid],
  immediate: true,
})

const status = computed(() => {
  if (pending.value) return "checking"
  if (error.value) return "down"
  return "ok"
})

const statusLabel = computed(() => "API")

const liveErrorMessage = computed(() => {
  const e = liveError.value
  return e?.data?.message || e?.message || String(e || "")
})

const trendsErrorMessage = computed(() => {
  const e = trendsError.value
  return e?.data?.message || e?.message || String(e || "")
})

function parseApiTimeToMs(value) {
  if (!value) return null
  const ms = Date.parse(value)
  return Number.isFinite(ms) ? ms : null
}

const latestTelemetryMs = computed(() => {
  return parseApiTimeToMs(live.value?.received_at) ?? parseApiTimeToMs(live.value?.recorded_at)
})

const deviceAgeSec = computed(() => {
  if (!latestTelemetryMs.value) return null
  return Math.floor((nowMs.value - latestTelemetryMs.value) / 1000)
})

const deviceActive = computed(() => {
  if (!selectedDeviceUid.value) return false
  if (livePending.value || liveError.value) return false
  if (deviceAgeSec.value == null) return false
  return deviceAgeSec.value <= 181
})

const selectedDeviceName = computed(() => {
  if (!selectedDeviceUid.value) return "Device"
  const opt = deviceOptions.value.find((d) => d.device_uid === selectedDeviceUid.value)
  if (!opt) return "Device"
  return opt.label.split(" — ")[0] || "Device"
})

const deviceActiveLabel = computed(() => selectedDeviceName.value)

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

  const rows = ts.map((t, i) => ({
    ts: Number(t) || i,
    timeLabel: formatPacketTime(t),
    eco2: formatPacketValue(eco2s[i], 0, "ppm"),
    temp: formatPacketValue(temps[i], 1, "°C"),
    rh: formatPacketValue(rhs[i], 1, "%"),
    tvoc: formatPacketValue(tvocs[i], 0, "ppb"),
    rtcTemp: formatPacketValue(rtcTemps[i], 1, "°C"),
  }))

  return rows
      .filter((r) => Number.isFinite(r.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10)
})

async function logout() {
  try {
    logoutPending.value = true
    await $fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    })
    await refreshMe()
    await router.push("/")
  } catch (e) {
    console.error("logout failed:", e)
  } finally {
    logoutPending.value = false
  }
}
</script>

<style scoped>
.wrap {
  --bg: #f7f8fb;
  --panel: rgba(0, 0, 0, 0.04);
  --panel-strong: rgba(0, 0, 0, 0.06);
  --border: rgba(0, 0, 0, 0.1);
  --text: #111827;
  --muted: rgba(17, 24, 39, 0.72);
  --btn-bg: rgba(0, 0, 0, 0.04);
  --btn-hover: rgba(0, 0, 0, 0.07);
  --input-bg: #ffffff;
  --tableHead: rgba(0, 0, 0, 0.04);
  --tableRow: rgba(0, 0, 0, 0.02);

  width: 100vw;
  max-width: 100vw;
  min-height: 100vh;
  margin-left: calc(50% - 50vw);
  padding: 4px 16px 14px;
  box-sizing: border-box;
  color: var(--text);
  background: var(--bg);
  overflow-x: hidden;
  font-family:
      system-ui,
      -apple-system,
      Segoe UI,
      Roboto,
      Ubuntu,
      Cantarell,
      "Helvetica Neue",
      Arial,
      "Noto Sans",
      "Apple Color Emoji",
      "Segoe UI Emoji";
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
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.brandBlock {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
  flex: 1 1 auto;
}

.logo {
  display: block;
  height: 38px;
  width: auto;
  object-fit: contain;
  flex: 0 0 auto;
  margin-top: 2px;
}

.brandText {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sub {
  margin: 0;
  opacity: 0.84;
}

.authline {
  margin: 0;
}

.okline {
  display: inline-flex;
  gap: 8px;
  align-items: baseline;
  flex-wrap: wrap;
}

.brandPills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.brandLinks {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.authBtns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

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
  transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
}

.btn:hover {
  background: var(--btn-hover);
}

.btn.danger {
  border-color: rgba(180, 35, 24, 0.35);
}

.iconBtn {
  min-width: 40px;
  padding: 8px 10px;
  font-size: 18px;
  line-height: 1;
}

.repoLink {
  font-size: 13px;
  color: var(--muted);
  text-decoration: none;
  white-space: nowrap;
}

.repoLink:hover {
  text-decoration: underline;
  color: var(--text);
}

.card {
  margin-top: 10px;
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

.muted {
  color: var(--muted);
}

.tiny {
  font-size: 12px;
}

.error {
  color: #d96767;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--panel);
  border: 1px solid var(--border);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #9aa0a6;
}

.pill[data-ok="true"] .dot {
  background: #1f7a3a;
}

.pill[data-ok="false"] .dot {
  background: #8b949e;
}

.label {
  font-size: 13px;
  opacity: 0.92;
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

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 12px;
}

/* Top-level chart cards */
.chartTopCard {
  padding: 16px 16px 12px;
}

.chartCardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.chartCardControls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
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

.meta {
  display: grid;
  gap: 6px;
  margin-top: 14px;
}

.selectorBlock {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.select {
  width: 100%;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  padding: 10px 12px;
  font: inherit;
}

@media (max-width: 980px) {
  .authBtns,
  .brandPills,
  .rangeBar {
    justify-content: flex-start;
  }

  .right {
    align-items: flex-start;
  }

  .header {
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .logo {
    height: 32px;
  }

  .wrap {
    padding: 8px 10px 20px;
  }

  .card {
    padding: 12px;
  }

  .chartTopCard {
    padding: 12px 12px 8px;
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
