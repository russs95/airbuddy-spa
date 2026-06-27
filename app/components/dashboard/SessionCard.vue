<script setup lang="ts">
import { pretty } from '~/lib/format'

const { session } = useDashboard()
const { me, pending } = session
const user = computed(() => me.value?.user)
</script>

<template>
  <UCard>
    <template #header>
      <h2 class="lp:text-base lp:font-semibold">Session</h2>
    </template>

    <div v-if="pending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading…</div>
    <div v-else-if="me?.ok" class="lp:space-y-3">
      <div class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:gap-x-6 lp:gap-y-3">
        <div v-if="user?.earthling_emoji" class="lp:text-2xl lp:sm:col-span-2">{{ user.earthling_emoji }}</div>
        <div v-if="user?.given_name || user?.first_name">
          <div class="lp:text-xs lp:text-(--ui-text-muted)">First name</div>
          <div>{{ user.given_name || user.first_name }}</div>
        </div>
        <div v-if="user?.buwana_id">
          <div class="lp:text-xs lp:text-(--ui-text-muted)">Buwana ID</div>
          <div>{{ user.buwana_id }}</div>
        </div>
        <div v-if="user?.community">
          <div class="lp:text-xs lp:text-(--ui-text-muted)">Community</div>
          <div>{{ user.community }}</div>
        </div>
        <div v-if="user?.continent">
          <div class="lp:text-xs lp:text-(--ui-text-muted)">Continent</div>
          <div>{{ user.continent }}</div>
        </div>
      </div>

      <UCollapsible>
        <UButton
          color="neutral"
          variant="ghost"
          size="sm"
          trailing-icon="i-lucide-chevron-down"
          label="Raw session data"
        />
        <template #content>
          <pre class="lp:mt-2 lp:overflow-x-auto lp:rounded-lg lp:bg-(--ui-bg-muted) lp:p-3 lp:text-xs">{{ pretty(me) }}</pre>
        </template>
      </UCollapsible>
    </div>
    <pre v-else class="lp:overflow-x-auto lp:rounded-lg lp:bg-(--ui-bg-muted) lp:p-3 lp:text-xs">{{ pretty(me) }}</pre>
  </UCard>
</template>
