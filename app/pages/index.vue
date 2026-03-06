<template>
  <main class="wrap">
    <header class="header">
      <div>
        <h1>AirBuddy</h1>
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
      </div>

      <div class="right">
        <div class="pill" :data-ok="status === 'ok'">
          <span class="dot" />
          <span class="label">{{ statusLabel }}</span>
        </div>

        <div class="authBtns">
          <a class="btn" href="/api/auth/login">Login</a>
          <a class="btn" href="/dashboard">Dashboard</a>
          <a class="btn danger" href="/api/auth/logout">Logout</a>
        </div>
      </div>
    </header>

    <section class="card">
      <h2>API Health</h2>

      <div v-if="pending" class="muted">Checking…</div>

      <div v-else-if="error" class="error">
        <div><strong>API call failed</strong></div>
        <div class="muted">{{ errorMessage }}</div>
        <div class="muted tiny">Tried: GET /api/health</div>
      </div>

      <div v-else class="ok">
        <div class="muted tiny">Response</div>
        <pre>{{ pretty(health) }}</pre>
      </div>
    </section>

    <section class="card">
      <h2>Auth Debug</h2>
      <div class="muted tiny">GET /api/me</div>

      <div v-if="mePending" class="muted">Loading…</div>

      <div v-else>
        <pre>{{ pretty(me) }}</pre>
      </div>
    </section>

    <section class="card">
      <h2>Trends</h2>

      <div v-if="trendsPending" class="muted">Loading trends…</div>
      <div v-else-if="trendsError" class="error">Trends failed: {{ trendsError?.message || trendsError }}</div>

      <div v-else class="charts">
        <TimeSeriesCanvas
            title="eCO₂"
            :timestamps="trends.timestamps"
            :series="[{ name: 'eCO₂', color: '#6a1b9a', values: trends.eco2s, width: 2, pointRadius: 3 }]"
            :yLabelFmt="(v) => v.toFixed(0) + ' ppm'"
        />

        <TimeSeriesCanvas
            title="Temperature"
            :timestamps="trends.timestamps"
            :series="[
            { name: 'Temp', color: '#c62828', values: trends.temps, width: 2, pointRadius: 3 },
            { name: 'RTC',  color: '#2e7d32', values: trends.rtcTemps, width: 2, pointRadius: 3 }
          ]"
            :yLabelFmt="(v) => v.toFixed(1) + '°C'"
        />

        <TimeSeriesCanvas
            title="Humidity"
            :timestamps="trends.timestamps"
            :series="[{ name: 'Humidity', color: '#1565c0', values: trends.rhs, width: 2, pointRadius: 3 }]"
            :yLabelFmt="(v) => v.toFixed(1) + ' %'"
        />

        <TimeSeriesCanvas
            title="TVOC"
            :timestamps="trends.timestamps"
            :series="[{ name: 'TVOC', color: '#ef6c00', values: trends.tvocs, width: 2, pointRadius: 3 }]"
            :yLabelFmt="(v) => v.toFixed(0) + ' ppb'"
        />
      </div>
    </section>

    <section class="card">
      <h2>Latest Telemetry</h2>

      <div class="grid">
        <MetricCard label="CO₂" :value="latest?.eco2_ppm ?? '--'" unit="ppm" />
        <MetricCard label="Temperature" :value="latest?.temp_c ?? '--'" unit="°C" />
        <MetricCard label="Humidity" :value="latest?.humidity ?? '--'" unit="%" />
        <MetricCard label="AQI" :value="latest?.aqi ?? '--'" />
      </div>
    </section>
  </main>
</template>

<script setup>
const { data: health, pending, error } = await useFetch("/api/health", {
  method: "GET",
  headers: { "Cache-Control": "no-cache" },
  credentials: "include",
});

const { data: latest } = await useFetch("/api/live", {
  credentials: "include",
});

// Auth: /api/me
const { data: me, pending: mePending, refresh: refreshMe } = await useFetch("/api/me", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
});

const meOk = computed(() => me?.value?.ok === true);
const meName = computed(() => me?.value?.user?.full_name || me?.value?.user?.username || me?.value?.user?.first_name || "User");
const meEmail = computed(() => me?.value?.user?.email || "");

const status = computed(() => {
  if (pending.value) return "checking";
  if (error.value) return "down";
  return "ok";
});

const statusLabel = computed(() => {
  if (status.value === "checking") return "API: checking";
  if (status.value === "down") return "API: down";
  return "API: ok";
});

const errorMessage = computed(() => {
  const e = error.value;
  if (!e) return "";
  return e?.data?.message || e?.message || String(e);
});

const { data: trends, pending: trendsPending, error: trendsError } = await useFetch("/api/v1/trends", {
  credentials: "include",
});

function pretty(v) {
  return JSON.stringify(v ?? null, null, 2);
}
</script>

<style scoped>
.wrap {
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 18px 60px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji";
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
}

h1 { margin: 0; font-size: 34px; letter-spacing: -0.02em; }
.sub { margin: 6px 0 0; opacity: 0.75; }

.authline { margin-top: 10px; }
.okline { display: inline-flex; gap: 8px; align-items: baseline; }

.authBtns { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid rgba(0,0,0,0.14);
  background: rgba(0,0,0,0.04);
  text-decoration: none;
  color: inherit;
  font-size: 13px;
}
.btn:hover { background: rgba(0,0,0,0.07); }
.btn.danger { border-color: rgba(180,35,24,0.35); }

.card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.08);
}
pre {
  margin: 10px 0 0;
  padding: 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.06);
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
}

.muted { opacity: 0.75; }
.tiny { font-size: 12px; }
.error { color: #7a1d1d; }
.ok { color: inherit; }

.pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(0,0,0,0.05);
  border: 1px solid rgba(0,0,0,0.10);
}
.dot {
  width: 10px; height: 10px; border-radius: 999px;
  background: #999;
}
.pill[data-ok="true"] .dot { background: #1f7a3a; }
.pill[data-ok="false"] .dot { background: #b42318; }
.label { font-size: 13px; opacity: 0.85; }

.grid{
  display:grid;
  grid-template-columns: repeat(auto-fit,minmax(140px,1fr));
  gap:14px;
  margin-top:12px;
}

.charts{
  display:grid;
  grid-template-columns: 1fr;
  gap: 14px;
  margin-top: 12px;
}
@media (min-width: 980px){
  .charts{ grid-template-columns: 1fr 1fr; }
}
</style>