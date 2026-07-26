<script setup lang="ts">
const {
  comfortModalOpen, comfortRoom, comfortTemp, comfortHumidity,
  comfortPending, comfortError, closeComfortModal, saveComfortTarget,
} = useManageHome()

const open = computed({
  get: () => comfortModalOpen.value,
  set: (v: boolean) => { if (!v) closeComfortModal() },
})
</script>

<template>
  <UModal
    v-model:open="open"
    title="Room Comfort Target"
    :description="`Personalise the ideal temperature and humidity for ${comfortRoom?.room_name || 'this room'}`"
  >
    <template #body>
      <form class="lp:space-y-4" @submit.prevent="saveComfortTarget">
        <UFormField label="Ideal Temperature (°C)" help="Leave blank to use the global default (21.5°C).">
          <UInput v-model.trim="comfortTemp" type="number" step="0.1" placeholder="21.5" class="lp:w-full" />
        </UFormField>

        <UFormField label="Ideal Humidity (%)" help="Leave blank to use the global default (50%).">
          <UInput v-model.trim="comfortHumidity" type="number" step="1" placeholder="50" class="lp:w-full" />
        </UFormField>

        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          A room's IAQ score is measured against this target instead of the whole-house
          default — useful for spaces like a nursery or garage with different comfort needs.
        </p>

        <div class="lp:flex lp:items-center lp:gap-2">
          <UButton type="submit" color="primary" :loading="comfortPending" label="Save Target" />
        </div>

        <UAlert v-if="comfortError" color="error" variant="soft" :title="comfortError" />
      </form>
    </template>
  </UModal>
</template>
