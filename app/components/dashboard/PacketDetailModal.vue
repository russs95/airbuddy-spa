<script setup lang="ts">
import { formatPacketValue } from '~/lib/format'

const {
  packetModalOpen, activePacket, deletePending, deleteError,
  closePacketModal, deleteTelemetryReading,
} = useDashboard()

const open = computed({
  get: () => packetModalOpen.value,
  set: (v: boolean) => { if (!v) closePacketModal() },
})

const raw = computed(() => activePacket.value?.raw)

const sections = computed(() => {
  const r = raw.value
  if (!r) return []
  return [
    {
      head: 'Air Quality',
      rows: [
        ['ENS CO₂', formatPacketValue(r.ensEco2, 0, 'ppm')],
        ['SCD CO₂', formatPacketValue(r.scdCo2, 0, 'ppm')],
        ['TVOC', formatPacketValue(r.tvoc, 0, 'ppb')],
      ],
    },
    {
      head: 'Temperature',
      rows: [
        ['AHT Temp', formatPacketValue(r.ahtTemp, 1, '°C')],
        ['SCD Temp', formatPacketValue(r.scdTemp, 1, '°C')],
        ['RTC Temp', formatPacketValue(r.rtcTemp, 1, '°C')],
      ],
    },
    {
      head: 'Humidity',
      rows: [
        ['AHT RH', formatPacketValue(r.ahtHumidity, 1, '%')],
        ['SCD RH', formatPacketValue(r.scdHumidity, 1, '%')],
      ],
    },
    {
      head: 'Battery',
      rows: [
        ['Charge', formatPacketValue(r.inaBattPct, 0, '%')],
        ['Bus V', formatPacketValue(r.inaBusV, 2, 'V')],
        ['Current', formatPacketValue(r.inaCurrentMa, 0, 'mA')],
        ['Power', formatPacketValue(r.inaPowerMw, 0, 'mW')],
      ],
    },
    {
      head: 'GPS',
      rows: [
        ['Lat', r.lat != null ? Number(r.lat).toFixed(6) + '°' : '—'],
        ['Lon', r.lon != null ? Number(r.lon).toFixed(6) + '°' : '—'],
      ],
    },
    {
      head: 'Record',
      rows: [['Telemetry ID', String(activePacket.value?.telemetryId ?? '—')]],
    },
  ]
})
</script>

<template>
  <UModal v-model:open="open" title="Telemetry Reading" :description="activePacket?.timeLabel">
    <template #body>
      <div class="lp:space-y-4">
        <div class="lp:grid lp:grid-cols-1 lp:sm:grid-cols-2 lp:gap-4">
          <div
            v-for="s in sections"
            :key="s.head"
            class="lp:rounded-lg lp:border lp:border-(--ui-border) lp:p-3"
          >
            <div class="lp:text-xs lp:font-semibold lp:text-(--ui-text-muted) lp:mb-1">{{ s.head }}</div>
            <div v-for="row in s.rows" :key="row[0]" class="lp:flex lp:justify-between lp:text-sm lp:py-0.5">
              <span class="lp:text-(--ui-text-muted)">{{ row[0] }}</span>
              <span>{{ row[1] }}</span>
            </div>
          </div>
        </div>

        <USeparator />

        <UAlert v-if="deleteError" color="error" variant="soft" :title="deleteError" />

        <div>
          <UButton
            color="error"
            icon="i-lucide-trash-2"
            :loading="deletePending"
            :disabled="!activePacket?.telemetryId"
            label="Delete Reading"
            @click="deleteTelemetryReading"
          />
        </div>
        <p class="lp:text-xs lp:text-(--ui-text-muted)">Deleting this reading is permanent and cannot be undone.</p>
      </div>
    </template>
  </UModal>
</template>
