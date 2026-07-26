<script setup lang="ts">
import type { Room } from '~/types/airbuddy'
import { sparklineFillPath, sparklinePoints } from '~/lib/iaqScore'
import DeviceChip from '~/components/manage-home/DeviceChip.vue'

const props = defineProps<{
  room: Room
  allRooms: Room[]
}>()

const {
  roomIaqScore, roomIaqColor, roomIaqLabel, roomSparklines,
  renamingRoomId, renameRoomValue, renameRoomPending, renameRoomError,
  startRenameRoom, cancelRenameRoom, saveRoomName,
  deleteRoomPending, deleteRoom,
  openComfortModal,
  dragOverTargetId, onDropOnRoom,
} = useManageHome()

const isRenaming = computed(() => renamingRoomId.value === String(props.room.room_id))
const isDeleting = computed(() => deleteRoomPending.value === String(props.room.room_id))
const isDragOver = computed(() => dragOverTargetId.value === String(props.room.room_id))

const score = computed(() => roomIaqScore(props.room))
const color = computed(() => roomIaqColor(props.room))
const label = computed(() => roomIaqLabel(props.room))
const sparkline = computed(() => roomSparklines.value[String(props.room.room_id)] || [])

const hasComfortTarget = computed(() =>
  props.room.target_temp_c != null || props.room.target_humidity_pct != null)

function onDragOver(e: DragEvent) {
  e.preventDefault()
  dragOverTargetId.value = String(props.room.room_id)
}
function onDragLeave() {
  if (dragOverTargetId.value === String(props.room.room_id)) dragOverTargetId.value = null
}
</script>

<template>
  <UCard
    class="lp:transition"
    :class="isDragOver ? 'lp:ring-2 lp:ring-primary lp:border-primary' : ''"
    :ui="{ body: 'lp:space-y-3' }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDropOnRoom(room)"
  >
    <template #header>
      <div class="lp:flex lp:items-start lp:justify-between lp:gap-2">
        <div class="lp:flex-1 lp:min-w-0">
          <div v-if="isRenaming" class="lp:flex lp:items-center lp:gap-1.5">
            <UInput
              v-model.trim="renameRoomValue"
              size="sm"
              autofocus
              class="lp:w-full"
              @keydown.enter="saveRoomName(room)"
              @keydown.escape="cancelRenameRoom()"
            />
            <UButton size="xs" color="primary" variant="soft" icon="i-lucide-check" :loading="renameRoomPending" @click="saveRoomName(room)" />
            <UButton size="xs" color="neutral" variant="ghost" icon="i-lucide-x" @click="cancelRenameRoom()" />
          </div>
          <h3 v-else class="lp:font-semibold lp:truncate lp:cursor-pointer" title="Click to rename" @click="startRenameRoom(room)">
            {{ room.room_name }}
          </h3>
          <p v-if="renameRoomError && isRenaming" class="lp:text-xs lp:text-error">{{ renameRoomError }}</p>
          <p class="lp:text-xs lp:text-(--ui-text-muted)">
            {{ room.devices?.length || 0 }} device<span v-if="(room.devices?.length || 0) !== 1">s</span>
          </p>
        </div>

        <div class="lp:flex lp:items-center lp:gap-1 lp:shrink-0">
          <UButton
            size="xs" color="neutral" variant="ghost" icon="i-lucide-thermometer"
            :title="hasComfortTarget ? 'Edit comfort target' : 'Set comfort target'"
            :class="hasComfortTarget ? 'lp:text-primary' : ''"
            @click="openComfortModal(room)"
          />
          <UButton
            size="xs" color="error" variant="ghost" icon="i-lucide-trash-2"
            title="Delete room" :loading="isDeleting" @click="deleteRoom(room)"
          />
        </div>
      </div>
    </template>

    <!-- AQI at-a-glance -->
    <div class="lp:flex lp:items-center lp:gap-3">
      <div class="lp:shrink-0 lp:text-center lp:w-14">
        <div class="lp:text-2xl lp:font-bold lp:leading-none" :style="{ color }">
          {{ score != null ? score.toFixed(0) : '—' }}
        </div>
        <div class="lp:text-[11px] lp:text-(--ui-text-muted) lp:mt-0.5 lp:truncate">{{ label }}</div>
      </div>
      <div class="lp:flex-1 lp:h-10">
        <svg v-if="sparkline.length > 1" class="lp:w-full lp:h-full" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient :id="`roomGrad-${room.room_id}`" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="color" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="color" stop-opacity="0.03" />
            </linearGradient>
          </defs>
          <path :d="sparklineFillPath(sparkline, 600, 56)" :fill="`url(#roomGrad-${room.room_id})`" />
          <polyline
            :points="sparklinePoints(sparkline, 600, 56)"
            fill="none" :stroke="color" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
          />
        </svg>
        <div v-else class="lp:h-full lp:flex lp:items-center lp:text-xs lp:text-(--ui-text-muted)">
          No trend data yet
        </div>
      </div>
    </div>

    <UBadge v-if="hasComfortTarget" color="neutral" variant="subtle" size="sm" class="lp:w-fit">
      Target
      <span v-if="room.target_temp_c != null">{{ Number(room.target_temp_c).toFixed(1) }}°C</span>
      <span v-if="room.target_temp_c != null && room.target_humidity_pct != null"> · </span>
      <span v-if="room.target_humidity_pct != null">{{ Number(room.target_humidity_pct).toFixed(0) }}% RH</span>
    </UBadge>

    <!-- Devices -->
    <div v-if="room.devices?.length" class="lp:space-y-1.5">
      <DeviceChip
        v-for="device in room.devices"
        :key="device.device_id"
        :device="device"
        :rooms="allRooms"
        :current-room-id="room.room_id"
      />
    </div>
    <div
      v-else
      class="lp:rounded-md lp:border lp:border-dashed lp:border-(--ui-border) lp:p-3 lp:text-center lp:text-xs lp:text-(--ui-text-muted)"
    >
      No AirBuddy here yet — drag a device in, or
      <NuxtLink to="/dashboard" class="lp:text-primary lp:underline">add one</NuxtLink>.
    </div>
  </UCard>
</template>
