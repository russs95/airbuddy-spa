<script setup lang="ts">
const {
  homes, bootstrapPending, bootstrapError, bootstrapErrorMessage,
} = useDashboard()
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="lp:text-base lp:font-semibold">Homes &amp; Rooms</h2>
    </template>

    <div v-if="bootstrapPending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading homes and rooms…</div>
    <UAlert
      v-else-if="bootstrapError"
      color="error"
      variant="soft"
      icon="i-lucide-triangle-alert"
      :title="`Could not load homes/rooms: ${bootstrapErrorMessage}`"
    />
    <div v-else>
      <div v-if="!homes.length" class="lp:text-sm lp:text-(--ui-text-muted)">
        No homes yet. Create your first home and room by adding a device.
      </div>
      <div v-else class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:lg:grid-cols-3 lp:gap-3">
        <div
          v-for="home in homes"
          :key="home.home_id"
          class="lp:rounded-lg lp:border lp:border-(--ui-border) lp:p-3"
        >
          <div class="lp:font-medium">{{ home.home_name }}</div>
          <div class="lp:text-xs lp:text-(--ui-text-muted)">
            {{ home.rooms?.length || 0 }} room<span v-if="(home.rooms?.length || 0) !== 1">s</span>
          </div>
          <ul v-if="home.rooms?.length" class="lp:mt-2 lp:list-disc lp:pl-4 lp:text-sm lp:space-y-0.5">
            <li v-for="room in home.rooms" :key="room.room_id">{{ room.room_name }}</li>
          </ul>
          <div v-if="home.unassigned_devices?.length" class="lp:mt-2 lp:text-xs lp:text-(--ui-text-muted)">
            {{ home.unassigned_devices.length }} unassigned device<span v-if="home.unassigned_devices.length !== 1">s</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>
