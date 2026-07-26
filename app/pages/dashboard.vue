<script setup lang="ts">
import DeviceGrid from '~/components/dashboard/DeviceGrid.vue'
import IaqScoreStrip from '~/components/dashboard/IaqScoreStrip.vue'
import AirTrendsPanel from '~/components/dashboard/AirTrendsPanel.vue'
import BatteryPanel from '~/components/dashboard/BatteryPanel.vue'
import LocationPanel from '~/components/dashboard/LocationPanel.vue'
import PacketsTable from '~/components/dashboard/PacketsTable.vue'
import TelemetryMetrics from '~/components/dashboard/TelemetryMetrics.vue'
import AccountCard from '~/components/dashboard/AccountCard.vue'
import HomesRoomsCard from '~/components/dashboard/HomesRoomsCard.vue'
import SessionCard from '~/components/dashboard/SessionCard.vue'
import AddDeviceModal from '~/components/dashboard/AddDeviceModal.vue'
import DeviceDetailModal from '~/components/dashboard/DeviceDetailModal.vue'
import PacketDetailModal from '~/components/dashboard/PacketDetailModal.vue'
import SetLocationModal from '~/components/dashboard/SetLocationModal.vue'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'AirBuddy | Dashboard' })

const dash = provideDashboard()
const { isAuthed, login } = dash.session
const { refreshDevices, devicesPending, selectedDeviceUid } = dash

// Open the kiosk Displayer for the device currently selected in the dashboard.
// The displayer reads its initial device from this localStorage key.
function openDisplayer() {
  if (import.meta.client && selectedDeviceUid.value) {
    localStorage.setItem('airbuddy-displayer-device', selectedDeviceUid.value)
  }
  navigateTo('/displayer')
}
</script>

<template>
  <UDashboardPanel id="dashboard">
    <template #header>
      <UDashboardNavbar title="Dashboard" icon="i-lucide-layout-dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="isAuthed"
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            label="Profile"
            to="/profile"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-house"
            label="Manage Home"
            to="/manage_home"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-layout-dashboard"
            label="Legacy"
            to="/dashboard-legacy"
          />
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-monitor"
            label="Displayer"
            :disabled="!isAuthed"
            @click="openDisplayer()"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            :loading="devicesPending"
            :disabled="!isAuthed"
            @click="refreshDevices()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Logged out -->
      <div v-if="!isAuthed" class="lp:max-w-md lp:mx-auto lp:mt-16">
        <UCard>
          <div class="lp:flex lp:flex-col lp:items-center lp:text-center lp:gap-4 lp:py-6">
            <UIcon name="i-lucide-lock" class="lp:size-10 lp:text-(--ui-text-muted)" />
            <div>
              <h2 class="lp:text-lg lp:font-semibold">Sign in to AirBuddy</h2>
              <p class="lp:text-sm lp:text-(--ui-text-muted) lp:mt-1">
                Log in with your Buwana account to view your devices and air quality data.
              </p>
            </div>
            <UButton color="primary" icon="i-lucide-log-in" label="Login with Buwana" @click="login()" />
          </div>
        </UCard>
      </div>

      <!-- Authenticated dashboard -->
      <div v-else class="lp:flex lp:flex-col lp:gap-6">
        <section id="devices" class="lp:scroll-mt-20 lp:flex lp:flex-col lp:gap-4">
          <DeviceGrid />
          <IaqScoreStrip />
        </section>

        <section id="trends" class="lp:scroll-mt-20">
          <AirTrendsPanel />
        </section>

        <section id="battery" class="lp:scroll-mt-20">
          <BatteryPanel />
        </section>

        <section id="location" class="lp:scroll-mt-20">
          <LocationPanel />
        </section>

        <section id="packets" class="lp:scroll-mt-20">
          <PacketsTable />
        </section>

        <TelemetryMetrics />

        <section id="account" class="lp:scroll-mt-20 lp:flex lp:flex-col lp:gap-6">
          <AccountCard />
          <HomesRoomsCard />
          <SessionCard />
        </section>
      </div>

      <!-- Modals -->
      <AddDeviceModal />
      <DeviceDetailModal />
      <PacketDetailModal />
      <SetLocationModal />
    </template>
  </UDashboardPanel>
</template>
