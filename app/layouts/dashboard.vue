<script setup lang="ts">
// Dashboard shell — Nuxt UI sidebar + slot for the page's UDashboardPanel.
const { me, isAuthed, login, logout } = useSession()

const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleDark() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const sectionsByPath: Record<string, { id: string, label: string, icon: string }[]> = {
  '/dashboard': [
    { id: 'devices',  label: 'Devices',    icon: 'i-lucide-cpu' },
    { id: 'trends',   label: 'Air Trends', icon: 'i-lucide-activity' },
    { id: 'battery',  label: 'Battery',    icon: 'i-lucide-battery-charging' },
    { id: 'location', label: 'Location',   icon: 'i-lucide-map-pin' },
    { id: 'packets',  label: 'Telemetry',  icon: 'i-lucide-table' },
    { id: 'account',  label: 'Account',    icon: 'i-lucide-user' },
  ],
  '/manage_home': [
    { id: 'home-info',  label: 'Home Info',          icon: 'i-lucide-info' },
    { id: 'rooms',      label: 'Rooms',               icon: 'i-lucide-door-open' },
    { id: 'unassigned', label: 'Unassigned Devices',  icon: 'i-lucide-cpu' },
  ],
}

const route = useRoute()
const sections = computed(() => sectionsByPath[route.path] || [])

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const navItems = computed(() => sections.value.map(s => ({
  label: s.label,
  icon: s.icon,
  onSelect: (e: Event) => { e.preventDefault(); scrollTo(s.id) },
})))

const logoutPending = ref(false)
async function doLogout() {
  logoutPending.value = true
  await logout()
  logoutPending.value = false
}

const displayName = computed(() =>
  me.value?.user?.given_name || me.value?.user?.first_name || me.value?.user?.full_name || 'AirBuddy')
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :min-size="14" :default-size="16" :max-size="22">
      <template #header="{ collapsed }">
        <NuxtLink to="/" class="lp:flex lp:items-center lp:gap-2">
          <img v-if="collapsed" src="/svgs/ab-icon.svg" alt="AirBuddy" class="lp:h-7 lp:w-7" />
          <img v-else-if="isDark" src="/svgs/airbuddy-logo-dark.svg" alt="AirBuddy" class="lp:h-7 lp:w-auto" />
          <img v-else src="/svgs/airbuddy-logo-light.svg" alt="AirBuddy" class="lp:h-7 lp:w-auto" />
        </NuxtLink>
      </template>

      <template #default>
        <UNavigationMenu
          orientation="vertical"
          :items="navItems"
          :ui="{ link: 'lp:cursor-pointer' }"
        />
      </template>

      <template #footer>
        <div class="lp:flex lp:flex-col lp:gap-2 lp:w-full">
          <UButton
            block
            color="neutral"
            variant="ghost"
            :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
            :label="isDark ? 'Dark mode' : 'Light mode'"
            @click="toggleDark"
          />
          <UButton
            to="/"
            block
            color="neutral"
            variant="ghost"
            icon="i-lucide-home"
            label="Home"
          />
          <template v-if="isAuthed">
            <div class="lp:px-2 lp:text-xs lp:text-(--ui-text-muted) lp:truncate">
              {{ displayName }}
            </div>
            <UButton
              block
              color="error"
              variant="soft"
              icon="i-lucide-log-out"
              :loading="logoutPending"
              label="Logout"
              @click="doLogout"
            />
          </template>
          <UButton
            v-else
            block
            color="primary"
            variant="solid"
            icon="i-lucide-log-in"
            label="Login"
            @click="login()"
          />
        </div>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
