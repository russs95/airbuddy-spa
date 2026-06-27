<script setup lang="ts">
const { session } = useDashboard()
const { me } = session
const user = computed(() => me.value?.user)

const fullName = computed(() => {
  const u = user.value
  if (!u) return '—'
  return u.full_name
    || [u.given_name || u.first_name, u.family_name || u.last_name].filter(Boolean).join(' ')
    || u.username
    || '—'
})
</script>

<template>
  <UCard v-if="me?.ok">
    <template #header>
      <h2 class="lp:text-base lp:font-semibold">Account</h2>
    </template>

    <dl class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:gap-x-6 lp:gap-y-3">
      <div v-if="user?.earthling_emoji" class="lp:text-2xl lp:sm:col-span-2">{{ user.earthling_emoji }}</div>

      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Name</dt>
        <dd>{{ fullName }}</dd>
      </div>
      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Email</dt>
        <dd>{{ user?.email || '—' }}</dd>
      </div>
      <div>
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Buwana ID</dt>
        <dd>{{ user?.buwana_id || '—' }}</dd>
      </div>
      <div v-if="user?.buwana_sub">
        <dt class="lp:text-xs lp:text-(--ui-text-muted)">Buwana Sub</dt>
        <dd class="lp:text-xs lp:text-(--ui-text-muted) lp:break-all">{{ user.buwana_sub }}</dd>
      </div>

      <template v-if="user?.country">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Country</dt>
          <dd>{{ user.country }}</dd>
        </div>
      </template>
      <template v-if="user?.language">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Language</dt>
          <dd>{{ user.language }}</dd>
        </div>
      </template>
      <template v-if="user?.role">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Role</dt>
          <dd>{{ user.role }}</dd>
        </div>
      </template>
      <template v-if="user?.community">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Community</dt>
          <dd>{{ user.community }}</dd>
        </div>
      </template>
      <template v-if="user?.continent">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Continent</dt>
          <dd>{{ user.continent }}</dd>
        </div>
      </template>
      <template v-if="user?.location_full">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Location</dt>
          <dd>{{ user.location_full }}</dd>
        </div>
      </template>
      <template v-if="user?.watershed_name">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Watershed</dt>
          <dd>
            {{ user.watershed_name }}<span v-if="user?.location_watershed" class="lp:text-(--ui-text-muted)"> · {{ user.location_watershed }}</span>
          </dd>
        </div>
      </template>
      <template v-if="user?.location_lat && user?.location_long">
        <div>
          <dt class="lp:text-xs lp:text-(--ui-text-muted)">Coordinates</dt>
          <dd class="lp:text-xs lp:text-(--ui-text-muted)">{{ user.location_lat }}, {{ user.location_long }}</dd>
        </div>
      </template>
    </dl>
  </UCard>
</template>
