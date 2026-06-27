<script setup lang="ts">
import RangeBar from '~/components/dashboard/RangeBar.vue'
import { PACKET_RANGE_KEYS } from '~/lib/trendConfig'

const {
  selectedDeviceUid, packetTrendsPending, allPackets, paginatedPackets,
  totalPacketPages, packetPage, packetLimit, packetRange,
  packetsManageMode, selectedPacketIds, selectedCount,
  allPageSelected, selectAllIndeterminate, bulkDeletePending, bulkDeleteError,
  togglePacket, toggleSelectAll, clearSelection, toggleManageMode,
  deleteSelectedPackets, openPacketModal,
} = useDashboard()

const cols = ['ENS CO₂', 'SCD CO₂', 'AHT Temp', 'SCD Temp', 'RTC Temp', 'TVOC']
</script>

<template>
  <UCard :ui="{ body: 'lp:space-y-3' }">
    <template #header>
      <div class="lp:flex lp:items-center lp:justify-between lp:gap-3 lp:flex-wrap">
        <div>
          <h2 class="lp:text-base lp:font-semibold">Latest Packets</h2>
          <span class="lp:text-xs lp:text-(--ui-text-muted)">
            {{ allPackets.length }} total · page {{ packetPage + 1 }} of {{ totalPacketPages }}
          </span>
        </div>
        <RangeBar v-model="packetRange" :items="PACKET_RANGE_KEYS" />
      </div>
    </template>

    <div v-if="!selectedDeviceUid" class="lp:text-sm lp:text-(--ui-text-muted)">Select a device to view packets.</div>
    <div v-else-if="packetTrendsPending" class="lp:text-sm lp:text-(--ui-text-muted)">Loading…</div>
    <div v-else-if="!allPackets.length" class="lp:text-sm lp:text-(--ui-text-muted)">No packets in this time range.</div>

    <div v-else>
      <div class="lp:overflow-x-auto lp:-mx-2">
        <table class="lp:w-full lp:text-sm lp:border-collapse">
          <thead>
            <tr class="lp:text-left lp:text-xs lp:text-(--ui-text-muted) lp:border-b lp:border-(--ui-border)">
              <th v-if="packetsManageMode" class="lp:px-2 lp:py-2 lp:w-8">
                <UCheckbox
                  :model-value="allPageSelected"
                  :indeterminate="selectAllIndeterminate"
                  title="Select all on this page"
                  @update:model-value="toggleSelectAll()"
                />
              </th>
              <th class="lp:px-2 lp:py-2">Time</th>
              <th v-for="c in cols" :key="c" class="lp:px-2 lp:py-2 lp:whitespace-nowrap">{{ c }}</th>
              <th class="lp:px-2 lp:py-2">Lat</th>
              <th class="lp:px-2 lp:py-2">Lon</th>
              <th class="lp:px-2 lp:py-2" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="pkt in paginatedPackets"
              :key="pkt.ts"
              class="lp:border-b lp:border-(--ui-border)"
              :class="pkt.telemetryId && selectedPacketIds.has(pkt.telemetryId) ? 'lp:bg-primary/5' : ''"
            >
              <td v-if="packetsManageMode" class="lp:px-2 lp:py-1.5">
                <UCheckbox
                  :model-value="!!(pkt.telemetryId && selectedPacketIds.has(pkt.telemetryId))"
                  :disabled="!pkt.telemetryId"
                  @update:model-value="togglePacket(pkt.telemetryId)"
                />
              </td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap" :title="pkt.timeLabel">{{ pkt.timeLabelShort }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.ensEco2 }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.scdCo2 }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.ahtTemp }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.scdTemp }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.rtcTemp }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.tvoc }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.raw.lat != null ? Number(pkt.raw.lat).toFixed(4) : '—' }}</td>
              <td class="lp:px-2 lp:py-1.5 lp:whitespace-nowrap">{{ pkt.raw.lon != null ? Number(pkt.raw.lon).toFixed(4) : '—' }}</td>
              <td class="lp:px-2 lp:py-1.5">
                <UButton
                  size="xs"
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-settings"
                  title="View details"
                  @click="openPacketModal(pkt)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedCount > 0" class="lp:flex lp:items-center lp:gap-2 lp:flex-wrap lp:pt-1">
        <span class="lp:text-xs lp:text-(--ui-text-muted)">{{ selectedCount }} selected</span>
        <UButton
          color="error"
          size="sm"
          icon="i-lucide-trash-2"
          :loading="bulkDeletePending"
          :label="`Delete ${selectedCount} selected`"
          @click="deleteSelectedPackets()"
        />
        <UButton color="neutral" variant="soft" size="sm" label="Deselect all" @click="clearSelection()" />
        <span v-if="bulkDeleteError" class="lp:text-xs lp:text-error">{{ bulkDeleteError }}</span>
      </div>

      <div class="lp:flex lp:items-center lp:gap-2 lp:flex-wrap lp:pt-2">
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          :icon="packetsManageMode ? 'i-lucide-check' : 'i-lucide-list-checks'"
          :label="packetsManageMode ? 'Done' : 'Manage Telemetry'"
          @click="toggleManageMode()"
        />
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          icon="i-lucide-chevron-left"
          label="Prev"
          :disabled="packetPage === 0"
          @click="packetPage--"
        />
        <span class="lp:text-xs lp:text-(--ui-text-muted)">{{ packetPage + 1 }} / {{ totalPacketPages }}</span>
        <UButton
          color="neutral"
          variant="soft"
          size="sm"
          trailing-icon="i-lucide-chevron-right"
          label="Next"
          :disabled="packetPage >= totalPacketPages - 1"
          @click="packetPage++"
        />
        <div class="lp:ml-auto lp:flex lp:gap-1" role="group" aria-label="Rows per page">
          <UButton
            v-for="n in [10, 25, 100]"
            :key="n"
            size="xs"
            :color="packetLimit === n ? 'primary' : 'neutral'"
            :variant="packetLimit === n ? 'solid' : 'soft'"
            :label="String(n)"
            @click="packetLimit = n"
          />
        </div>
      </div>
    </div>
  </UCard>
</template>
