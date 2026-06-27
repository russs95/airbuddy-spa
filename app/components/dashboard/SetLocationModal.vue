<script setup lang="ts">
const {
  locationModalOpen, manualLat, manualLon, selectedDeviceUid,
  locationSavePending, locationSaveError, locationSaveOk,
  closeLocationModal, saveDeviceLocation,
} = useDashboard()

const open = computed({
  get: () => locationModalOpen.value,
  set: (v: boolean) => { if (!v) closeLocationModal() },
})
</script>

<template>
  <UModal v-model:open="open" title="Set Device Location" description="Manually pin a fixed location for this device">
    <template #body>
      <div class="lp:space-y-4">
        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          Use this for devices without GPS. Enter coordinates below and the backend will store them as the
          device's fixed location, returning them whenever telemetry has no GPS reading.
        </p>

        <UFormField label="Latitude">
          <UInput v-model="manualLat" type="number" step="any" min="-90" max="90" placeholder="e.g. 48.8566" class="lp:w-full" />
        </UFormField>

        <UFormField label="Longitude">
          <UInput v-model="manualLon" type="number" step="any" min="-180" max="180" placeholder="e.g. 2.3522" class="lp:w-full" />
        </UFormField>

        <UAlert v-if="locationSaveError" color="error" variant="soft" :title="locationSaveError" />
        <UAlert v-if="locationSaveOk" color="success" variant="soft" title="Location saved." />

        <div>
          <UButton
            color="primary"
            icon="i-lucide-map-pin"
            :loading="locationSavePending"
            :disabled="!selectedDeviceUid"
            label="Set Location"
            @click="saveDeviceLocation"
          />
        </div>
        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          The backend should store this on the device record so it persists regardless of future telemetry.
        </p>
      </div>
    </template>
  </UModal>
</template>
