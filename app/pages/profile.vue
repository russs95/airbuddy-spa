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
          <h1>Your Profile</h1>
          <p class="muted">Your AirBuddy identity is set from your Buwana account. Manage it here.</p>
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
        <NuxtLink class="btn" to="/dashboard">Dashboard</NuxtLink>
        <button v-if="!me?.ok" class="btn" @click="doLogin">Login</button>
      </div>
    </header>

    <!-- Not logged in -->
    <section v-if="!me?.ok" class="card">
      <p class="muted">Please log in to view and edit your profile.</p>
      <div class="actions" style="margin-top: 12px">
        <button class="btn primary" @click="doLogin">Log in with Buwana</button>
      </div>
    </section>

    <template v-else>
      <!-- Buwana account card -->
      <section class="card">
        <div class="sectionHeader">
          <div>
            <h2>
              <span aria-hidden="true">{{ display.emoji }}</span>
              Buwana account
            </h2>
            <p class="muted tiny">Location, community &amp; watershed used across AirBuddy</p>
          </div>
          <div class="btnGroup">
            <button v-if="editable && !editMode" class="btn" @click="startEdit">
              <i class="fa-solid fa-pen" aria-hidden="true"></i> Edit
            </button>
            <a v-else-if="!editable" class="btn" @click.prevent="doLogin" href="#" title="Re-authenticate to enable editing">
              Log in to edit
            </a>
          </div>
        </div>

        <!-- Could not load Buwana profile -->
        <p v-if="!editable" class="message errMsg" role="status">
          Your Buwana account couldn’t be loaded, so location, community &amp; language are blank.
          <template v-if="profileErrorCode === 'token_expired' || profileErrorCode === 'no_token'">
            Your session expired — please log in again to refresh it.
          </template>
          <template v-else>
            ({{ profileErrorCode }}) Please try again shortly.
          </template>
        </p>

        <!-- VIEW MODE -->
        <dl v-if="!editMode" class="readonlyGrid">
          <div class="roField"><dt><i class="fa-solid fa-user" aria-hidden="true"></i> Name</dt><dd>{{ display.fullName }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-envelope" aria-hidden="true"></i> Email</dt><dd>{{ display.email }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Location</dt><dd>{{ display.locationFull }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-droplet" aria-hidden="true"></i> Watershed</dt><dd>{{ display.watershed }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-crosshairs" aria-hidden="true"></i> Coordinates</dt><dd>{{ display.coords }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-people-group" aria-hidden="true"></i> Community</dt><dd>{{ display.community }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-earth-americas" aria-hidden="true"></i> Continent</dt><dd>{{ display.continent }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-flag" aria-hidden="true"></i> Country</dt><dd>{{ display.country }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-language" aria-hidden="true"></i> Language</dt><dd>{{ display.language }}</dd></div>
          <div class="roField"><dt><i class="fa-solid fa-clock" aria-hidden="true"></i> Time zone</dt><dd>{{ display.timezone }}</dd></div>
        </dl>

        <!-- EDIT MODE -->
        <form v-else class="editForm" @submit.prevent="save">
          <p class="muted tiny">
            Country &amp; continent are set automatically from your location. Name, email and community
            stay managed by the main Buwana registry.
          </p>

          <label class="field">
            <span class="label">Earthling emoji</span>
            <input class="input" v-model="form.earthling_emoji" maxlength="8" />
          </label>

          <label class="field">
            <span class="label">Location</span>
            <div class="locWrap">
              <input
                  class="input"
                  v-model="form.location_full"
                  autocomplete="off"
                  placeholder="Search your location…"
                  @input="onLocInput"
              />
              <span v-if="locSearching" class="locSpinner" aria-hidden="true"></span>
            </div>
            <div v-if="locSuggestions.length" class="locSuggestions">
              <button
                  v-for="(item, i) in locSuggestions"
                  :key="i"
                  type="button"
                  class="locSuggestion"
                  @click="pickLocation(item)"
              >{{ item.display_name }}</button>
            </div>
          </label>

          <label class="field">
            <span class="label">Watershed</span>
            <input class="input" v-model="form.location_watershed" />
          </label>

          <label class="field">
            <span class="label">Preferred language</span>
            <select class="input" v-model="form.language_id">
              <option v-for="l in reference.languages" :key="l.language_id" :value="l.language_id">
                {{ l.languages_native_name || l.language_name_en || l.language_id }}
              </option>
            </select>
          </label>

          <label class="field">
            <span class="label">Time zone</span>
            <select class="input" v-model="form.time_zone">
              <option v-for="(label, value) in reference.timezones" :key="value" :value="value">{{ label }}</option>
            </select>
          </label>

          <div class="formActions">
            <button class="btn primary" type="submit" :disabled="saving">
              {{ saving ? "Saving…" : "Save Buwana account" }}
            </button>
            <button class="btn" type="button" @click="cancelEdit" :disabled="saving">Cancel</button>
          </div>
        </form>

        <p v-if="feedback.msg" class="message" :class="feedback.type === 'error' ? 'errMsg' : 'okMsg'" role="status">
          {{ feedback.msg }}
        </p>
      </section>

      <!-- Out-of-the-way account links -->
      <section class="bottomActions">
        <a class="btn" :href="buwanaEditUrl" target="_blank" rel="noreferrer">Update Buwana Account</a>
        <a class="btn" :href="buwanaSupportUrl" target="_blank" rel="noreferrer">Bugs &amp; Support</a>
      </section>
    </template>
  </main>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'

const BUWANA_BASE = 'https://buwana.ecobricks.org'
const BUWANA_APP = 'airb_ca090536efc8' // AirBuddy Buwana client/app id

// ── Theme (mirrors dashboard.vue) ─────────────────────────────────────────────
const theme = ref('light')
onMounted(() => {
  const saved = localStorage.getItem('airbuddy-theme')
  if (saved === 'light' || saved === 'dark') {
    theme.value = saved
  } else {
    theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  document.documentElement.setAttribute('data-airbuddy-theme', theme.value)
})
watch(theme, (v) => {
  if (import.meta.client) {
    localStorage.setItem('airbuddy-theme', v)
    document.documentElement.setAttribute('data-airbuddy-theme', v)
  }
})
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
}
function doLogin() {
  window.location.href = `/api/auth/login?mode=${encodeURIComponent(theme.value)}`
}

// ── Session + profile data ────────────────────────────────────────────────────
const { data: me } = await useFetch('/api/me', { credentials: 'include' })

const {
  data: profileRes,
  error: profileFetchError,
  refresh: refreshProfile,
} = await useFetch('/api/profile', { credentials: 'include' })

const profile = computed(() => profileRes.value?.profile || null)
const reference = computed(() => profileRes.value?.reference || { languages: [], timezones: {} })
const editable = computed(() => !!profile.value)
const profileErrorCode = computed(() =>
  profile.value ? null : (profileFetchError.value?.data?.error || 'unavailable')
)

// ── Display values (read-only view) ───────────────────────────────────────────
const CONTINENT_NAMES = {
  AF: '🌍 Africa', AN: '🌏 Antarctica', AS: '🌏 Asia', EU: '🌍 Europe',
  NA: '🌎 North America', SA: '🌎 South America', OC: '🌊 Oceania', AU: '🌏 Australia',
}
const display = computed(() => {
  const b = profile.value || {}
  const u = me.value?.user || {}
  const code = (b.continent_code || '').toUpperCase()
  const lat = b.location_lat
  const lon = b.location_long
  return {
    emoji: b.earthling_emoji || u.earthling_emoji || '👤',
    fullName: b.full_name || u.full_name || u.first_name || 'Crew member',
    email: b.email || u.email || '—',
    locationFull: b.location_full || u.location_full || '—',
    watershed: b.location_watershed || u.location_watershed || '—',
    coords: (lat != null && lon != null) ? `${lat}, ${lon}` : '—',
    community: b.community_name || '—',
    continent: b.continent_name || (code ? (CONTINENT_NAMES[code] || code) : '—'),
    country: b.country_name || '—',
    language: b.language_name || '—',
    timezone: b.time_zone || u.time_zone || '—',
  }
})

const buwanaEditUrl = computed(() => `${BUWANA_BASE}/en/edit-profile.php?app=${BUWANA_APP}`)
const buwanaSupportUrl = computed(() => {
  const id = me.value?.user?.buwana_id
  return `${BUWANA_BASE}/en/feedback.php?app=${BUWANA_APP}${id ? `&buwana=${encodeURIComponent(id)}` : ''}`
})

// ── Edit form ─────────────────────────────────────────────────────────────────
const editMode = ref(false)
const saving = ref(false)
const feedback = reactive({ type: '', msg: '' })
const form = reactive({
  earthling_emoji: '',
  location_full: '',
  latitude: '',
  longitude: '',
  location_watershed: '',
  language_id: '',
  time_zone: '',
})

function resetForm(p) {
  form.earthling_emoji = p?.earthling_emoji || ''
  form.location_full = p?.location_full || ''
  form.latitude = p?.location_lat ?? ''
  form.longitude = p?.location_long ?? ''
  form.location_watershed = p?.location_watershed || ''
  form.language_id = p?.language_id ?? ''
  form.time_zone = p?.time_zone || ''
}
watch(profile, (p) => { if (p) resetForm(p) }, { immediate: true })

function startEdit() {
  feedback.msg = ''
  resetForm(profile.value)
  editMode.value = true
}
function cancelEdit() {
  editMode.value = false
  locSuggestions.value = []
}

async function save() {
  saving.value = true
  feedback.msg = ''
  try {
    const res = await $fetch('/api/profile', {
      method: 'POST',
      credentials: 'include',
      body: { ...form },
    })
    // Reflect the fresh, Buwana-derived profile locally.
    profileRes.value = { ok: true, profile: res.profile, reference: reference.value }
    editMode.value = false
    feedback.type = 'success'
    feedback.msg = 'Your Buwana account was updated.'
  } catch (e) {
    const code = e?.data?.error
    feedback.type = 'error'
    feedback.msg = (code === 'token_expired' || code === 'no_token')
      ? 'Your session expired — please log in again to save changes.'
      : (e?.data?.message || 'Update failed. Please try again.')
  } finally {
    saving.value = false
  }
}

// ── Location search (OpenStreetMap Nominatim) ─────────────────────────────────
const locSuggestions = ref([])
const locSearching = ref(false)
let locTimer = null

function onLocInput() {
  clearTimeout(locTimer)
  const q = form.location_full.trim()
  if (q.length < 3) { locSuggestions.value = []; return }
  locTimer = setTimeout(() => searchLocation(q), 300)
}
async function searchLocation(q) {
  locSearching.value = true
  try {
    const data = await $fetch('https://nominatim.openstreetmap.org/search', {
      params: { format: 'json', 'accept-language': 'en', limit: 6, q },
    })
    locSuggestions.value = Array.isArray(data) ? data : []
  } catch {
    locSuggestions.value = []
  } finally {
    locSearching.value = false
  }
}
function pickLocation(item) {
  form.location_full = item.display_name
  form.latitude = item.lat
  form.longitude = item.lon
  locSuggestions.value = []
}
</script>

<style scoped>
/* ── CSS vars / theme (matches dashboard.vue) ───────────────────────────────── */
.wrap {
  --bg: #f7f8fb;
  --panel: rgba(0, 0, 0, 0.04);
  --border: rgba(0, 0, 0, 0.10);
  --text: #111827;
  --muted: rgba(17, 24, 39, 0.72);
  --btn-bg: rgba(0, 0, 0, 0.04);
  --btn-hover: rgba(0, 0, 0, 0.07);
  --input-bg: #ffffff;

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
  --border: rgba(255, 255, 255, 0.12);
  --text: #eef2f7;
  --muted: rgba(238, 242, 247, 0.72);
  --btn-bg: rgba(255, 255, 255, 0.06);
  --btn-hover: rgba(255, 255, 255, 0.12);
  --input-bg: rgba(255, 255, 255, 0.08);
}

.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}
.headerLeft { display: flex; align-items: center; gap: 12px; }
.btns { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
.btnGroup { display: flex; gap: 8px; flex-wrap: wrap; }

.sectionHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
}
.card h2 { margin: 0 0 4px; font-size: 18px; display: flex; align-items: center; gap: 8px; }

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
.btn:hover { background: var(--btn-hover); }
.btn.primary { background: #1f7a3a; color: #fff; border-color: #1f7a3a; }
.btn:disabled { opacity: 0.6; cursor: default; }

.muted { color: var(--muted); }
.tiny { font-size: 12px; }

/* ── Read-only grid ───────────────────────────────────────────────────────────── */
.readonlyGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 10px 18px;
  margin: 12px 0 0;
}
.roField dt {
  font-size: 12px;
  color: var(--muted);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.roField dd { margin: 0; font-size: 14px; }

/* ── Edit form ────────────────────────────────────────────────────────────────── */
.editForm { display: flex; flex-direction: column; gap: 14px; margin-top: 12px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.label { font-size: 13px; font-weight: 600; }
.input {
  width: 100%;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  padding: 10px 12px;
  font: inherit;
}
.formActions { display: flex; gap: 10px; }

/* ── Location autocomplete ────────────────────────────────────────────────────── */
.locWrap { position: relative; display: flex; align-items: center; }
.locSpinner {
  position: absolute;
  right: 12px;
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: #1f7a3a;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.locSuggestions {
  margin-top: 6px;
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  max-height: 240px;
  overflow-y: auto;
}
.locSuggestion {
  display: block;
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: var(--input-bg);
  color: var(--text);
  border: none;
  border-bottom: 1px solid var(--border);
  font: inherit;
  font-size: 13px;
  cursor: pointer;
}
.locSuggestion:last-child { border-bottom: none; }
.locSuggestion:hover { background: var(--btn-hover); }

/* ── Messages ─────────────────────────────────────────────────────────────────── */
.message { padding: 10px 12px; border-radius: 12px; font-size: 14px; margin-top: 12px; }
.okMsg { background: rgba(31, 122, 58, 0.08); color: #1f7a3a; }
.errMsg { background: rgba(180, 35, 24, 0.08); color: #b00; }

.bottomActions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; }
</style>
