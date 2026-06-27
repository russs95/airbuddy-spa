<script setup lang="ts">
import { aqiEmoji } from '~/lib/format'
import type { Device } from '~/types/airbuddy'

const {
  devices, devicesPending, devicesError, devicesErrorMessage,
  selectedDeviceUid, compareDeviceUid, live,
  selectDevice, selectCompareDevice, isDeviceRecent,
  openAddDeviceModal, refreshDevices, openDeviceModal,
} = useDashboard()
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-4' }">
    <template #header>
      <div class="lp:flex lp:items-center lp:justify-between lp:gap-2">
        <div>
          <h2 class="lp:text-base lp:font-semibold">Your Devices</h2>
          <p class="lp:text-xs lp:text-(--ui-text-muted)">Devices connected to your account</p>
        </div>
        <div class="lp:flex lp:items-center lp:gap-2">
          <UButton size="sm" color="primary" icon="i-lucide-plus" label="Add" @click="openAddDeviceModal()" />
          <UButton
            size="sm"
            color="neutral"
            variant="soft"
            icon="i-lucide-refresh-cw"
            label="Refresh"
            :loading="devicesPending"
            @click="refreshDevices()"
          />
        </div>
      </div>
    </template>

    <div v-if="devicesPending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading devices…</div>
    <UAlert
      v-else-if="devicesError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="`Could not load devices: ${devicesErrorMessage}`"
    />
    <div v-else-if="!devices.length" class="lp:text-sm lp:text-(--ui-text-muted)">
      No devices connected yet. Click <strong>Add</strong> to register your first device.
    </div>

    <div v-else class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:lg:grid-cols-3 lp:gap-3">
      <div
        v-for="device in devices"
        :key="device.device_id"
        class="lp:rounded-lg lp:border lp:p-3 lp:cursor-pointer lp:transition lp:flex lp:flex-col lp:gap-1"
        :class="[
          selectedDeviceUid === device.device_uid
            ? 'lp:border-primary lp:ring-1 lp:ring-primary lp:bg-primary/5'
            : 'lp:border-(--ui-border) lp:hover:border-(--ui-border-accented)',
          compareDeviceUid === device.device_uid ? 'lp:ring-1 lp:ring-info' : '',
        ]"
        role="button"
        tabindex="0"
        @click="selectDevice(device)"
        @keydown.enter.space.prevent="selectDevice(device)"
      >
        <div class="lp:flex lp:items-center lp:justify-between lp:gap-2">
          <div class="lp:font-medium lp:truncate">{{ device.device_name || device.device_uid }}</div>
          <div class="lp:flex lp:items-center lp:gap-1.5">
            <span
              v-if="selectedDeviceUid === device.device_uid && live?.ens_aqi != null"
              :title="`AQI ${live.ens_aqi}`"
            >{{ aqiEmoji(live.ens_aqi) }}</span>
            <span
              class="lp:inline-block lp:size-2 lp:rounded-full"
              :class="isDeviceRecent(device) ? 'lp:bg-success' : 'lp:bg-(--ui-bg-muted) lp:ring-1 lp:ring-(--ui-border)'"
              :title="isDeviceRecent(device) ? 'Active — reported in the last 5 minutes' : 'No recent data'"
            />
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-settings"
              title="Device settings & key"
              @click.stop="openDeviceModal(device)"
            />
          </div>
        </div>
        <div class="lp:text-xs lp:text-(--ui-text-muted) lp:truncate">{{ device.device_uid }}</div>
        <div class="lp:text-xs lp:text-(--ui-text-muted) lp:truncate">
          {{ device.home_name || 'No home' }}<span v-if="device.room_name"> · {{ device.room_name }}</span>
        </div>
        <UButton
          v-if="selectedDeviceUid && selectedDeviceUid !== device.device_uid"
          class="lp:mt-1 lp:self-start"
          size="xs"
          :color="compareDeviceUid === device.device_uid ? 'info' : 'neutral'"
          :variant="compareDeviceUid === device.device_uid ? 'solid' : 'soft'"
          :label="compareDeviceUid === device.device_uid ? 'Comparing ✕' : 'Compare'"
          @click.stop="selectCompareDevice(device)"
        />
      </div>
    </div>
  </UCard>
</template>
