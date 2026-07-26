<script setup lang="ts">
import HomeInfoPanel from '~/components/manage-home/HomeInfoPanel.vue'
import RoomCard from '~/components/manage-home/RoomCard.vue'
import AddRoomCard from '~/components/manage-home/AddRoomCard.vue'
import UnassignedDevicesCard from '~/components/manage-home/UnassignedDevicesCard.vue'
import AddRoomModal from '~/components/manage-home/AddRoomModal.vue'
import ComfortTargetModal from '~/components/manage-home/ComfortTargetModal.vue'

definePageMeta({ layout: 'dashboard' })
useHead({ title: 'AirBuddy | Manage Home' })

const { isAuthed, login } = useSession()
const mh = provideManageHome()
const {
  homes, bootstrapPending, bootstrapError, bootstrapErrorMessage, refreshBootstrap,
  selectedHomeId, selectedHome, unassignedDevices, openAddRoomModal,
} = mh

const homeItems = computed(() =>
  homes.value.map(h => ({ label: h.home_name, value: String(h.home_id) })))
</script>

<template>
  <UDashboardPanel id="manage-home">
    <template #header>
      <UDashboardNavbar title="Manage Home" icon="i-lucide-house">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
        <template #right>
          <UButton
            v-if="isAuthed"
            color="neutral"
            variant="ghost"
            icon="i-lucide-user"
            label="Profile"
            to="/profile"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-layout-dashboard"
            label="Dashboard"
            to="/dashboard"
          />
          <USelect
            v-if="homes.length > 1"
            v-model="selectedHomeId"
            :items="homeItems"
            value-key="value"
            class="lp:w-44"
          />
          <UButton
            color="primary"
            variant="solid"
            icon="i-lucide-plus-circle"
            label="Add Room"
            :disabled="!selectedHome"
            @click="openAddRoomModal()"
          />
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-refresh-cw"
            :loading="bootstrapPending"
            @click="refreshBootstrap()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Logged out -->
      <div v-if="!isAuthed" class="lp:max-w-md lp:mx-auto lp:mt-16">
        <UCard>
          <div class="lp:flex lp:flex-col lp:items-center lp:text-center lp:gap-4 lp:py-6">
            <UIcon name="i-lucide-lock" class="lp:size-10 lp:text-(--ui-text-muted)" />
            <div>
              <h2 class="lp:text-lg lp:font-semibold">Sign in to AirBuddy</h2>
              <p class="lp:text-sm lp:text-(--ui-text-muted) lp:mt-1">
                Log in with your Buwana account to manage your home and rooms.
              </p>
            </div>
            <UButton color="primary" icon="i-lucide-log-in" label="Login with Buwana" @click="login()" />
          </div>
        </UCard>
      </div>

      <template v-else>
        <div v-if="bootstrapPending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading your home…</div>

        <UAlert
          v-else-if="bootstrapError"
          color="error"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :title="`Could not load homes/rooms: ${bootstrapErrorMessage}`"
        />

        <div v-else-if="!homes.length" class="lp:max-w-md lp:mx-auto lp:mt-16">
          <UCard>
            <div class="lp:flex lp:flex-col lp:items-center lp:text-center lp:gap-4 lp:py-6">
              <UIcon name="i-lucide-house" class="lp:size-10 lp:text-(--ui-text-muted)" />
              <div>
                <h2 class="lp:text-lg lp:font-semibold">No home yet</h2>
                <p class="lp:text-sm lp:text-(--ui-text-muted) lp:mt-1">
                  Add your first device from the Dashboard to create a home and room automatically.
                </p>
              </div>
              <UButton color="primary" icon="i-lucide-layout-dashboard" label="Go to Dashboard" to="/dashboard" />
            </div>
          </UCard>
        </div>

        <div v-else class="lp:flex lp:flex-col lp:gap-6">
          <section id="home-info" class="lp:scroll-mt-20">
            <HomeInfoPanel />
          </section>

          <section id="rooms" class="lp:scroll-mt-20 lp:flex lp:flex-col lp:gap-4">
            <div class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:lg:grid-cols-3 lp:gap-4">
              <RoomCard
                v-for="room in selectedHome?.rooms || []"
                :key="room.room_id"
                :room="room"
                :all-rooms="selectedHome?.rooms || []"
              />
              <AddRoomCard />
            </div>
          </section>

          <section id="unassigned" class="lp:scroll-mt-20">
            <UnassignedDevicesCard v-if="unassignedDevices.length" :all-rooms="selectedHome?.rooms || []" />
          </section>
        </div>
      </template>
    </template>
  </UDashboardPanel>

  <AddRoomModal />
  <ComfortTargetModal />
</template>
