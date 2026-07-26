<script setup lang="ts">
import type { Device, Room } from '~/types/airbuddy'

const props = defineProps<{
  device: Device
  rooms: Room[]
  currentRoomId?: string | number | null
}>()

const {
  isDeviceRecent, assignPendingDeviceId, assignDeviceToRoom,
  draggingDeviceUid, onDeviceDragStart, onDeviceDragEnd,
} = useManageHome()

const isPending = computed(() => assignPendingDeviceId.value === String(props.device.device_id))
const isDragging = computed(() => draggingDeviceUid.value === props.device.device_uid)

const moveItems = computed(() => {
  const items = props.rooms
    .filter(r => String(r.room_id) !== String(props.currentRoomId ?? ''))
    .map(r => ({
      label: r.room_name,
      icon: 'i-lucide-door-open',
      onSelect: () => assignDeviceToRoom(props.device, r.room_id),
    }))
  if (props.currentRoomId != null) {
    items.push({
      label: 'Unassign',
      icon: 'i-lucide-circle-off',
      onSelect: () => assignDeviceToRoom(props.device, null),
    })
  }
  return items
})
</script>

<template>
  <div
    class="lp:flex lp:items-center lp:gap-2 lp:rounded-md lp:border lp:border-(--ui-border) lp:px-2 lp:py-1.5 lp:bg-(--ui-bg) lp:cursor-grab lp:active:cursor-grabbing lp:transition"
    :class="{ 'lp:opacity-40': isDragging, 'lp:opacity-60': isPending }"
    draggable="true"
    @dragstart="onDeviceDragStart(device)"
    @dragend="onDeviceDragEnd()"
  >
    <span
      class="lp:inline-block lp:size-2 lp:shrink-0 lp:rounded-full"
      :class="isDeviceRecent(device) ? 'lp:bg-success' : 'lp:bg-(--ui-bg-muted) lp:ring-1 lp:ring-(--ui-border)'"
      :title="isDeviceRecent(device) ? 'Active — reported in the last 5 minutes' : 'No recent data'"
    />
    <span class="lp:text-sm lp:truncate lp:flex-1">{{ device.device_name || device.device_uid }}</span>
    <UDropdownMenu :items="[moveItems]" :content="{ align: 'end' }">
      <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-more-vertical" :loading="isPending" />
    </UDropdownMenu>
  </div>
</template>
