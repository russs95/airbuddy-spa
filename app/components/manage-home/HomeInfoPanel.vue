<script setup lang="ts">
const { selectedHome } = useManageHome()
const { me } = useSession()
const user = computed(() => me.value?.user)

const ownerName = computed(() => {
  const u = user.value
  if (!u) return '—'
  return u.full_name
    || [u.given_name || u.first_name, u.family_name || u.last_name].filter(Boolean).join(' ')
    || u.username
    || '—'
})

const roomCount = computed(() => selectedHome.value?.rooms?.length || 0)
const deviceCount = computed(() => {
  const rooms = selectedHome.value?.rooms || []
  const unassigned = selectedHome.value?.unassigned_devices?.length || 0
  return rooms.reduce((sum, r) => sum + (r.devices?.length || 0), 0) + unassigned
})
</script>

<template>
  <UCard v-if="selectedHome">
    <template #header>
      <h2 class="lp:text-base lp:font-semibold">{{ selectedHome.home_name }}</h2>
    </template>

    <dl class="lp:grid lp:grid-cols-2 lp:sm:grid-cols-4 lp:gap-x-6 lp:gap-y-3">
      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Owner</dt>
        <dd>{{ ownerName }}</dd>
      </div>
      <div v-if="user?.community">
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Community</dt>
        <dd>{{ user.community }}</dd>
      </div>
      <div v-if="user?.location_full">
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Location</dt>
        <dd>{{ user.location_full }}</dd>
      </div>
      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Rooms</dt>
        <dd>{{ roomCount }}</dd>
      </div>
      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Devices</dt>
        <dd>{{ deviceCount }}</dd>
      </div>
    </dl>
  </UCard>
</template>
