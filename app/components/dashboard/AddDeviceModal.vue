<script setup lang="ts">
const {
  addDeviceModalOpen, nextDeviceUid, form, homes, selectedHomeRooms,
  submitPending, submitMessage, submitError, closeAddDeviceModal, submitDevice,
} = useDashboard()

const open = computed({
  get: () => addDeviceModalOpen.value,
  set: (v: boolean) => { if (!v) closeAddDeviceModal() },
})

const modeItems = computed(() => [
  { label: 'Use existing', value: 'existing' },
  { label: 'Create new', value: 'new' },
])

const homeItems = computed(() =>
  homes.value.map(h => ({ label: h.home_name, value: String(h.home_id) })))
const roomItems = computed(() =>
  selectedHomeRooms.value.map(r => ({ label: r.room_name, value: String(r.room_id) })))
</script>

<template>
  <UModal v-model:open="open" title="Add Device" description="Register a new AirBuddy device to your account">
    <template #body>
      <form class="lp:space-y-4" @submit.prevent="submitDevice">
        <UFormField label="Device UID" help="Auto-assigned based on your account — you can edit it before saving.">
          <UInput v-model.trim="nextDeviceUid" placeholder="Fetching suggested ID…" class="lp:w-full" />
        </UFormField>

        <UFormField label="Device Name">
          <UInput v-model.trim="form.device_name" placeholder="Bedroom AirBuddy" class="lp:w-full" />
        </UFormField>

        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          A secure device key will be generated automatically after registration.
        </p>

        <USeparator />

        <UFormField label="Home">
          <URadioGroup v-model="form.home_mode" :items="modeItems" orientation="horizontal" />
        </UFormField>

        <UFormField v-if="form.home_mode === 'existing' && homes.length" label="Choose Home">
          <USelect v-model="form.home_id" :items="homeItems" value-key="value" placeholder="Select a home" class="lp:w-full" />
        </UFormField>

        <UFormField v-if="form.home_mode === 'new' || !homes.length" label="New Home Name">
          <UInput v-model.trim="form.new_home_name" placeholder="My Home" class="lp:w-full" />
        </UFormField>

        <USeparator />

        <UFormField label="Room">
          <URadioGroup v-model="form.room_mode" :items="modeItems" orientation="horizontal" />
        </UFormField>

        <UFormField v-if="form.room_mode === 'existing' && selectedHomeRooms.length" label="Choose Room">
          <USelect v-model="form.room_id" :items="roomItems" value-key="value" placeholder="Select a room" class="lp:w-full" />
        </UFormField>

        <UFormField v-if="form.room_mode === 'new' || !selectedHomeRooms.length" label="New Room Name">
          <UInput v-model.trim="form.new_room_name" placeholder="Bedroom" class="lp:w-full" />
        </UFormField>

        <div class="lp:flex lp:items-center lp:gap-2">
          <UButton type="submit" color="primary" :loading="submitPending" :disabled="!nextDeviceUid" label="Add Device" />
        </div>

        <UAlert v-if="submitMessage" color="success" variant="soft" :title="submitMessage" />
        <UAlert v-if="submitError" color="error" variant="soft" :title="submitError" />
      </form>
    </template>
  </UModal>
</template>
