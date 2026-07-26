<script setup lang="ts">
import type { Room } from '~/types/airbuddy'
import DeviceChip from '~/components/manage-home/DeviceChip.vue'

defineProps<{ allRooms: Room[] }>()

const { unassignedDevices, dragOverTargetId, onDropOnUnassigned } = useManageHome()

const isDragOver = computed(() => dragOverTargetId.value === 'unassigned')
function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOverTargetId.value = 'unassigned'
}
function onDragLeave() {
  if (dragOverTargetId.value === 'unassigned') dragOverTargetId.value = null
}
</script>

<template>
  <UCard
    v-if="unassignedDevices.length"
    class="lp:transition"
    :class="isDragOver ? 'lp:ring-2 lp:ring-primary lp:border-primary' : ''"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDropOnUnassigned()"
  >
    <template #header>
      <h3 class="lp:font-semibold">Unassigned Devices</h3>
      <p class="lp:text-xs lp:text-(--ui-text-muted)">Not yet placed in a room — drag into a room card above.</p>
    </template>
    <div class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:lg:grid-cols-3 lp:gap-1.5">
      <DeviceChip
        v-for="device in unassignedDevices"
        :key="device.device_id"
        :device="device"
        :rooms="allRooms"
        :current-room-id="null"
      />
    </div>
  </UCard>
</template>
