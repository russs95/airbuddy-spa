<script setup lang="ts">
const {
  addRoomModalOpen, newRoomName, addRoomPending, addRoomError,
  closeAddRoomModal, submitAddRoom, selectedHome,
} = useManageHome()

const open = computed({
  get: () => addRoomModalOpen.value,
  set: (v: boolean) => { if (!v) closeAddRoomModal() },
})
</script>

<template>
  <UModal v-model:open="open" title="Add Room" :description="`Create a new room in ${selectedHome?.home_name || 'this home'}`">
    <template #body>
      <form class="lp:space-y-4" @submit.prevent="submitAddRoom">
        <UFormField label="Room Name">
          <UInput v-model.trim="newRoomName" placeholder="Bedroom" class="lp:w-full" autofocus />
        </UFormField>

        <div class="lp:flex lp:items-center lp:gap-2">
          <UButton type="submit" color="primary" :loading="addRoomPending" :disabled="!newRoomName.trim()" label="Add Room" />
        </div>

        <UAlert v-if="addRoomError" color="error" variant="soft" :title="addRoomError" />
      </form>
    </template>
  </UModal>
</template>
