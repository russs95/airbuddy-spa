// ── Dashboard state & logic ───────────────────────────────────────────────────
// Centralises everything the old monolithic dashboard.vue kept in page-local
// state: data fetching, device selection, chart series, the packets table, and
// all modal actions. Created once by the page via provideDashboard() and read by
// the section/modal components via useDashboard().

import type {
  BootstrapResponse, DevicesResponse, Device, DeviceOption,
  DeviceTrends, LiveReading, Packet,
} from '~/types/airbuddy'
import { mergeTimestamps, alignSeries } from '~/lib/mergeTimestamps'
import {
  scoresFromTrends, iaqColor, iaqLabel as calcIaqLabel,
  sparklinePoints, sparklineFillPath,
} from '~/lib/iaqScore'
import {
  formatPacketTime, formatPacketTimeShort, formatPacketValue, hasData,
} from '~/lib/format'
import {
  DEVICE1_COLORS, DEVICE2_COLORS, RANGE_FETCH_HOURS,
  PACKET_RANGE_HOURS, ROUTE_SLIDER_STEPS,
} from '~/lib/trendConfig'
// Mirrors the SeriesDef interface exported by AirTrendChart.vue.
interface SeriesDef {
  name: string
  values: Array<number | null>
  color?: string
}

function createDashboard() {
  const api = useAirbuddyApi()
  const session = useSession()

  // ── Core data fetches ──────────────────────────────────────────────────────
  const { data: bootstrap, pending: bootstrapPending, error: bootstrapError, refresh: refreshBootstrap } =
    useFetch<BootstrapResponse>('/api/dashboard/bootstrap', {
      key: 'dashboard-bootstrap',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      default: () => ({ ok: true, homes: [] }),
    })

  const { data: devicesData, pending: devicesPending, error: devicesError, refresh: refreshDevices } =
    useFetch<DevicesResponse>('/api/dashboard/devices', {
      key: 'dashboard-devices',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      default: () => ({ ok: true, devices: [] }),
    })

  const homes = computed(() => bootstrap.value?.homes || [])
  const devices = computed<Device[]>(() => devicesData.value?.devices || [])

  const errorMessage = (e: unknown) =>
    (e as any)?.data?.message || (e as any)?.message || String(e || '')
  const bootstrapErrorMessage = computed(() => errorMessage(bootstrapError.value))
  const devicesErrorMessage = computed(() => errorMessage(devicesError.value))

  // ── Device selection ───────────────────────────────────────────────────────
  const selectedDeviceUid = ref('')
  const compareDeviceUid = ref('')

  const deviceOptions = computed<DeviceOption[]>(() => {
    const out: DeviceOption[] = []
    for (const home of homes.value) {
      for (const room of home.rooms || []) {
        for (const device of room.devices || []) {
          out.push({
            device_uid: device.device_uid,
            label: `${device.device_name || device.device_uid} — ${home.home_name} / ${room.room_name}`,
          })
        }
      }
      for (const device of home.unassigned_devices || []) {
        out.push({
          device_uid: device.device_uid,
          label: `${device.device_name || device.device_uid} — ${home.home_name} / Unassigned`,
        })
      }
    }
    return out
  })

  watch(deviceOptions, (list) => {
    if (!list.length) { selectedDeviceUid.value = ''; compareDeviceUid.value = ''; return }
    if (!selectedDeviceUid.value || !list.some(d => d.device_uid === selectedDeviceUid.value)) {
      const saved = import.meta.client ? localStorage.getItem('airbuddy-selected-device') : null
      selectedDeviceUid.value = (saved && list.some(d => d.device_uid === saved)) ? saved : list[0].device_uid
    }
    if (import.meta.client) {
      const savedCompare = localStorage.getItem('airbuddy-compare-device')
      if (savedCompare && savedCompare !== selectedDeviceUid.value && list.some(d => d.device_uid === savedCompare)) {
        compareDeviceUid.value = savedCompare
      }
    }
  }, { immediate: true })

  const selectedDeviceLabel = computed(() =>
    deviceOptions.value.find(d => d.device_uid === selectedDeviceUid.value)?.label || 'None')

  function selectDevice(device: Device) {
    selectedDeviceUid.value = device.device_uid
    if (import.meta.client) localStorage.setItem('airbuddy-selected-device', device.device_uid)
  }

  function selectCompareDevice(device: Device) {
    if (compareDeviceUid.value === device.device_uid) {
      compareDeviceUid.value = ''
      if (import.meta.client) localStorage.removeItem('airbuddy-compare-device')
      return
    }
    if (device.device_uid === selectedDeviceUid.value) return
    compareDeviceUid.value = device.device_uid
    if (import.meta.client) localStorage.setItem('airbuddy-compare-device', device.device_uid)
  }

  watch(selectedDeviceUid, (uid) => {
    if (uid && uid === compareDeviceUid.value) {
      compareDeviceUid.value = ''
      if (import.meta.client) localStorage.removeItem('airbuddy-compare-device')
    }
  })

  // ── Ranges & expand state ──────────────────────────────────────────────────
  const universalRange = ref('1h')
  const chartExpanded = reactive({ eco2: false, temp: false, humidity: false, tvoc: false, battery: false })
  const mapExpanded = ref(true)
  const gpsMode = ref<'location' | 'route'>('location')
  const packetRange = ref('24h')
  const packetLimit = ref(10)
  const packetPage = ref(0)

  // ── Route slider (debounced fetch) ─────────────────────────────────────────
  const routeSliderIndex = ref(2) // default 1h
  const routeHoursFetched = ref(1)
  let routeDebounceTimer: ReturnType<typeof setTimeout> | undefined
  watch(routeSliderIndex, (idx) => {
    clearTimeout(routeDebounceTimer)
    routeDebounceTimer = setTimeout(() => {
      routeHoursFetched.value = ROUTE_SLIDER_STEPS[idx].hours
    }, 400)
  })

  // ── Trend fetches ──────────────────────────────────────────────────────────
  const { data: trends, pending: trendsPending, error: trendsError, refresh: refreshTrends } =
    useDeviceTrends(selectedDeviceUid, () => RANGE_FETCH_HOURS[universalRange.value] ?? 25, 'trends-main')

  const { data: compareTrends } =
    useDeviceTrends(compareDeviceUid, () => RANGE_FETCH_HOURS[universalRange.value] ?? 25, 'trends-compare')

  const { data: iaqTrends } =
    useDeviceTrends(selectedDeviceUid, () => 7, 'trends-iaq')

  const { data: routeTrends, pending: routePending } =
    useDeviceTrends(selectedDeviceUid, routeHoursFetched, 'trends-route')

  const { data: packetTrends, pending: packetTrendsPending, refresh: refreshPacketTrends } =
    useDeviceTrends(selectedDeviceUid, () => PACKET_RANGE_HOURS[packetRange.value] ?? 24, 'trends-packets')

  const { data: live, pending: livePending, error: liveError, refresh: refreshLive } =
    useFetch<LiveReading>('/api/dashboard/device-live', {
      key: 'device-live',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      query: computed(() => ({ device_uid: selectedDeviceUid.value || undefined })),
      watch: [selectedDeviceUid],
    })

  const liveErrorMessage = computed(() => errorMessage(liveError.value))
  const trendsErrorMessage = computed(() => errorMessage(trendsError.value))

  watch([selectedDeviceUid, packetLimit, packetRange], () => { packetPage.value = 0 })

  // ── Device names / merged timestamps ───────────────────────────────────────
  const primaryDeviceName = computed(() =>
    devices.value.find(d => d.device_uid === selectedDeviceUid.value)?.device_name ?? 'Device 1')
  const compareDeviceName = computed(() =>
    devices.value.find(d => d.device_uid === compareDeviceUid.value)?.device_name ?? 'Device 2')

  const mergedTimestamps = computed<number[]>(() => {
    const primary = trends.value?.timestamps ?? []
    if (!compareDeviceUid.value || !compareTrends.value?.timestamps?.length) return primary
    return mergeTimestamps(primary, compareTrends.value.timestamps)
  })

  const hasCompare = computed(() => !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length)

  // Build a multi-sensor series set for one metric group.
  function buildSeries(
    cols: { key: keyof DeviceTrends; name: string; c1: string; c2: string; transform?: (v: number) => number }[],
  ): SeriesDef[] {
    const series: SeriesDef[] = []
    const t = trends.value
    const mt = mergedTimestamps.value
    const n1 = hasCompare.value ? primaryDeviceName.value + ' ' : ''
    const apply = (arr: (number | null)[] | undefined, transform?: (v: number) => number) =>
      transform ? (arr ?? []).map(v => (v == null ? null : transform(v))) : (arr ?? [])

    for (const col of cols) {
      const arr = t?.[col.key] as (number | null)[] | undefined
      if (hasData(arr)) {
        series.push({ name: n1 + col.name, color: col.c1, values: alignSeries(mt, t!.timestamps!, apply(arr, col.transform)) })
      }
    }
    if (hasCompare.value) {
      const c = compareTrends.value!
      const n2 = compareDeviceName.value + ' '
      for (const col of cols) {
        const arr = c[col.key] as (number | null)[] | undefined
        if (hasData(arr)) {
          series.push({ name: n2 + col.name, color: col.c2, values: alignSeries(mt, c.timestamps!, apply(arr, col.transform)) })
        }
      }
    }
    return series
  }

  const co2Series = computed(() => buildSeries([
    { key: 'ensEco2s', name: 'ENS eCO₂', c1: DEVICE1_COLORS.ensEco2, c2: DEVICE2_COLORS.ensEco2 },
    { key: 'scdCo2s',  name: 'SCD CO₂',  c1: DEVICE1_COLORS.scdCo2,  c2: DEVICE2_COLORS.scdCo2 },
  ]))

  const tempSeries = computed(() => buildSeries([
    { key: 'ahtTemps', name: 'AHT Temp', c1: DEVICE1_COLORS.ahtTemp, c2: DEVICE2_COLORS.ahtTemp },
    { key: 'scdTemps', name: 'SCD Temp', c1: DEVICE1_COLORS.scdTemp, c2: DEVICE2_COLORS.scdTemp },
    { key: 'rtcTemps', name: 'RTC Temp', c1: DEVICE1_COLORS.rtcTemp, c2: DEVICE2_COLORS.rtcTemp },
  ]))

  const humiditySeries = computed(() => buildSeries([
    { key: 'ahtHumidities', name: 'AHT RH', c1: DEVICE1_COLORS.ahtHumidity, c2: DEVICE2_COLORS.ahtHumidity },
    { key: 'scdHumidities', name: 'SCD RH', c1: DEVICE1_COLORS.scdHumidity, c2: DEVICE2_COLORS.scdHumidity },
  ]))

  const tvocSeries = computed(() => buildSeries([
    { key: 'ensTvocs', name: 'TVOC', c1: DEVICE1_COLORS.tvoc, c2: DEVICE2_COLORS.tvoc },
  ]))

  const busVScale = (v: number) => +Math.max(0, Math.min(100, (v - 3.30) / (4.20 - 3.30) * 100)).toFixed(1)

  const battLevelSeries = computed(() => buildSeries([
    { key: 'inaBattPcts', name: 'Battery %',      c1: DEVICE1_COLORS.battPct,  c2: DEVICE2_COLORS.battPct },
    { key: 'inaBusVs',    name: 'Bus V (scaled)', c1: DEVICE1_COLORS.battBusV, c2: DEVICE2_COLORS.battBusV, transform: busVScale },
  ]))

  const battCurrentSeries = computed(() => buildSeries([
    { key: 'inaCurrentMas', name: 'Current (mA)', c1: DEVICE1_COLORS.battCurrent, c2: DEVICE2_COLORS.battCurrent },
  ]))

  // ── IAQ composite score ────────────────────────────────────────────────────
  const iaqScores = computed(() => scoresFromTrends(iaqTrends.value))
  const iaqCurrentScore = computed(() => {
    const s = iaqScores.value
    return s.length ? s[s.length - 1] : null
  })
  const iaqLineColor = computed(() => iaqCurrentScore.value != null ? iaqColor(iaqCurrentScore.value) : '#94a3b8')
  const iaqScoreLabel = computed(() => iaqCurrentScore.value != null ? calcIaqLabel(iaqCurrentScore.value) : '—')
  const iaqSparkPoints = computed(() => sparklinePoints(iaqScores.value, 600, 56))
  const iaqFillD = computed(() => sparklineFillPath(iaqScores.value, 600, 56))

  // ── GPS route ──────────────────────────────────────────────────────────────
  const routeCoords = computed<[number, number, number | null][]>(() => {
    const lats = routeTrends.value?.lats ?? []
    const lons = routeTrends.value?.lons ?? []
    const ts = routeTrends.value?.timestamps ?? []
    const pairs: [number, number, number | null][] = []
    for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
      const lat = Number(lats[i])
      const lon = Number(lons[i])
      if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
        pairs.push([lat, lon, ts[i] ?? null])
      }
    }
    return pairs
  })

  // ── Packets table ──────────────────────────────────────────────────────────
  const allPackets = computed<Packet[]>(() => {
    const d = packetTrends.value
    const col = (k: keyof DeviceTrends) => (Array.isArray(d?.[k]) ? d![k] as any[] : [])
    const ts = col('timestamps')
    const telemetryIds = col('telemetryIds')
    const ensEco2s = col('ensEco2s'), scdCo2s = col('scdCo2s')
    const ahtTemps = col('ahtTemps'), scdTemps = col('scdTemps'), rtcTemps = col('rtcTemps')
    const ahtHumidities = col('ahtHumidities'), scdHumidities = col('scdHumidities')
    const ensTvocs = col('ensTvocs')
    const inaBusVs = col('inaBusVs'), inaCurrentMas = col('inaCurrentMas')
    const inaPowerMws = col('inaPowerMws'), inaBattPcts = col('inaBattPcts')
    const lats = col('lats'), lons = col('lons')

    return ts
      .map((t, i) => ({
        ts: Number(t) || i,
        telemetryId: telemetryIds[i] ?? null,
        timeLabel: formatPacketTime(t),
        timeLabelShort: formatPacketTimeShort(t),
        ensEco2: formatPacketValue(ensEco2s[i], 0, 'ppm'),
        scdCo2: formatPacketValue(scdCo2s[i], 0, 'ppm'),
        ahtTemp: formatPacketValue(ahtTemps[i], 1, '°C'),
        scdTemp: formatPacketValue(scdTemps[i], 1, '°C'),
        rtcTemp: formatPacketValue(rtcTemps[i], 1, '°C'),
        tvoc: formatPacketValue(ensTvocs[i], 0, 'ppb'),
        raw: {
          ensEco2: ensEco2s[i] ?? null, scdCo2: scdCo2s[i] ?? null,
          ahtTemp: ahtTemps[i] ?? null, scdTemp: scdTemps[i] ?? null, rtcTemp: rtcTemps[i] ?? null,
          tvoc: ensTvocs[i] ?? null,
          ahtHumidity: ahtHumidities[i] ?? null, scdHumidity: scdHumidities[i] ?? null,
          inaBusV: inaBusVs[i] ?? null, inaCurrentMa: inaCurrentMas[i] ?? null,
          inaPowerMw: inaPowerMws[i] ?? null, inaBattPct: inaBattPcts[i] ?? null,
          lat: lats[i] ?? null, lon: lons[i] ?? null,
        },
      }))
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => b.ts - a.ts)
  })

  const totalPacketPages = computed(() => Math.max(1, Math.ceil(allPackets.value.length / packetLimit.value)))
  const paginatedPackets = computed(() => {
    const start = packetPage.value * packetLimit.value
    return allPackets.value.slice(start, start + packetLimit.value)
  })

  // ── Packet detail modal ────────────────────────────────────────────────────
  const packetModalOpen = ref(false)
  const activePacket = ref<Packet | null>(null)
  const deletePending = ref(false)
  const deleteError = ref('')

  function openPacketModal(pkt: Packet) {
    activePacket.value = pkt
    packetModalOpen.value = true
    deletePending.value = false
    deleteError.value = ''
  }
  function closePacketModal() {
    packetModalOpen.value = false
    activePacket.value = null
    deleteError.value = ''
  }
  async function deleteTelemetryReading() {
    if (!activePacket.value?.telemetryId) return
    try {
      deletePending.value = true
      deleteError.value = ''
      await api.deleteTelemetry(activePacket.value.telemetryId)
      closePacketModal()
      await refreshPacketTrends()
    } catch (e) {
      deleteError.value = apiErrorMessage(e, 'Could not delete reading.')
    } finally {
      deletePending.value = false
    }
  }

  // ── Packet multi-select & bulk delete ──────────────────────────────────────
  const selectedPacketIds = ref<Set<string | number>>(new Set())
  const bulkDeletePending = ref(false)
  const bulkDeleteError = ref('')
  const packetsManageMode = ref(false)

  const selectedCount = computed(() => selectedPacketIds.value.size)
  const allPageSelected = computed(() =>
    paginatedPackets.value.length > 0 &&
    paginatedPackets.value.filter(p => p.telemetryId).every(p => selectedPacketIds.value.has(p.telemetryId!)))
  const somePageSelected = computed(() =>
    paginatedPackets.value.some(p => p.telemetryId && selectedPacketIds.value.has(p.telemetryId)))
  const selectAllIndeterminate = computed(() => somePageSelected.value && !allPageSelected.value)

  watch([selectedDeviceUid, packetRange], () => { selectedPacketIds.value = new Set() })

  function togglePacket(id: string | number | null) {
    if (!id) return
    const s = new Set(selectedPacketIds.value)
    s.has(id) ? s.delete(id) : s.add(id)
    selectedPacketIds.value = s
  }
  function toggleSelectAll() {
    const s = new Set(selectedPacketIds.value)
    if (allPageSelected.value) paginatedPackets.value.forEach(p => p.telemetryId && s.delete(p.telemetryId))
    else paginatedPackets.value.forEach(p => p.telemetryId && s.add(p.telemetryId))
    selectedPacketIds.value = s
  }
  function clearSelection() {
    selectedPacketIds.value = new Set()
    bulkDeleteError.value = ''
  }
  function toggleManageMode() {
    packetsManageMode.value = !packetsManageMode.value
    if (!packetsManageMode.value) clearSelection()
  }
  async function deleteSelectedPackets() {
    const ids = [...selectedPacketIds.value]
    if (!ids.length) return
    if (!window.confirm(`Delete ${ids.length} reading${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return
    bulkDeletePending.value = true
    bulkDeleteError.value = ''
    let errors = 0
    for (const id of ids) {
      try { await api.deleteTelemetry(id) } catch { errors++ }
    }
    bulkDeletePending.value = false
    selectedPacketIds.value = new Set()
    if (errors > 0) bulkDeleteError.value = `${errors} reading${errors !== 1 ? 's' : ''} could not be deleted.`
    await refreshPacketTrends()
  }

  // ── Add Device modal ───────────────────────────────────────────────────────
  const nextDeviceUid = ref('')
  const form = reactive({
    device_name: '', home_mode: 'new', home_id: '', new_home_name: '',
    room_mode: 'new', room_id: '', new_room_name: '',
  })
  const selectedHome = computed(() =>
    form.home_id ? homes.value.find(h => String(h.home_id) === String(form.home_id)) || null : null)
  const selectedHomeRooms = computed(() => selectedHome.value?.rooms || [])
  const submitPending = ref(false)
  const submitMessage = ref('')
  const submitError = ref('')
  const addDeviceModalOpen = ref(false)

  watch(() => homes.value.length, (count) => {
    if (count > 0 && form.home_mode === 'new' && !form.new_home_name) {
      form.home_mode = 'existing'
      form.home_id = String(homes.value[0].home_id)
    }
  }, { immediate: true })

  watch(() => form.home_id, () => {
    form.room_id = ''
    if (selectedHomeRooms.value.length > 0 && form.room_mode === 'existing') {
      form.room_id = String(selectedHomeRooms.value[0].room_id)
    }
  })

  async function openAddDeviceModal() {
    addDeviceModalOpen.value = true
    submitMessage.value = ''
    submitError.value = ''
    nextDeviceUid.value = ''
    try {
      const res = await api.getNextUid()
      nextDeviceUid.value = res?.next_device_uid || ''
    } catch (e) {
      submitError.value = apiErrorMessage(e, 'Could not fetch next device ID. Please try again.')
    }
  }
  function closeAddDeviceModal() {
    addDeviceModalOpen.value = false
    submitMessage.value = ''
    submitError.value = ''
    form.device_name = ''
    form.new_room_name = ''
    form.room_id = ''
  }
  function resolveHomeNameAfterSubmit(payload: any) {
    if (payload.home_mode === 'new') return payload.new_home_name || '—'
    return homes.value.find(h => String(h.home_id) === String(payload.home_id))?.home_name || '—'
  }
  function resolveRoomNameAfterSubmit(payload: any) {
    if (payload.room_mode === 'new') return payload.new_room_name || '—'
    return selectedHomeRooms.value.find(r => String(r.room_id) === String(payload.room_id))?.room_name || '—'
  }
  async function submitDevice() {
    submitMessage.value = ''
    submitError.value = ''
    const payload = {
      device_uid: nextDeviceUid.value,
      device_name: form.device_name,
      home_mode: form.home_mode as 'new' | 'existing',
      home_id: form.home_mode === 'existing' ? form.home_id : null,
      new_home_name: form.home_mode === 'new' ? form.new_home_name : null,
      room_mode: form.room_mode as 'new' | 'existing',
      room_id: form.room_mode === 'existing' ? form.room_id : null,
      new_room_name: form.room_mode === 'new' ? form.new_room_name : null,
    }
    if (payload.home_mode === 'new' && !payload.new_home_name) { submitError.value = 'Please enter a new home name.'; return }
    if (payload.home_mode === 'existing' && !payload.home_id) { submitError.value = 'Please choose a home.'; return }
    if (payload.room_mode === 'new' && !payload.new_room_name) { submitError.value = 'Please enter a new room name.'; return }
    if (payload.room_mode === 'existing' && !payload.room_id) { submitError.value = 'Please choose a room.'; return }
    try {
      submitPending.value = true
      const res = await api.registerDevice(payload)
      submitMessage.value = res?.message || 'Device added successfully.'
      await refreshBootstrap()
      await refreshDevices()
      closeAddDeviceModal()
      if (res?.device) {
        openDeviceModal({
          ...(res.device as Device),
          device_name: payload.device_name || payload.device_uid,
          home_name: resolveHomeNameAfterSubmit(payload),
          room_name: resolveRoomNameAfterSubmit(payload),
          status: 'active',
        })
        deviceKeyValue.value = res?.device_key || ''
        deviceKeyMessage.value = res?.device_key ? 'New device key generated. Save it now.' : ''
        showDeviceKey.value = false
      }
    } catch (e) {
      submitError.value = apiErrorMessage(e, 'Could not add device.')
    } finally {
      submitPending.value = false
    }
  }

  // ── Device detail modal ────────────────────────────────────────────────────
  const deviceModalOpen = ref(false)
  const activeDevice = ref<Device | null>(null)
  const deviceKeyValue = ref('')
  const deviceKeyError = ref('')
  const deviceKeyMessage = ref('')
  const showDeviceKey = ref(false)
  const resetPending = ref(false)
  const copyPending = ref(false)
  const renamingDevice = ref(false)
  const renameValue = ref('')
  const renamePending = ref(false)
  const renameError = ref('')
  const uidCopied = ref(false)

  function openDeviceModal(device: Device) {
    activeDevice.value = device
    deviceModalOpen.value = true
    deviceKeyError.value = ''
    deviceKeyMessage.value = ''
    showDeviceKey.value = false
    copyPending.value = false
    resetPending.value = false
    renamingDevice.value = false
    renameError.value = ''
    uidCopied.value = false
  }
  function closeDeviceModal() {
    deviceModalOpen.value = false
    activeDevice.value = null
    deviceKeyValue.value = ''
    deviceKeyError.value = ''
    deviceKeyMessage.value = ''
    showDeviceKey.value = false
    copyPending.value = false
    resetPending.value = false
    renamingDevice.value = false
    renameError.value = ''
    uidCopied.value = false
  }
  function startRename() {
    renameValue.value = activeDevice.value?.device_name || ''
    renamingDevice.value = true
    renameError.value = ''
  }
  function cancelRename() {
    renamingDevice.value = false
    renameError.value = ''
  }
  async function saveDeviceName() {
    if (!activeDevice.value?.device_id) return
    const newName = renameValue.value.trim()
    if (!newName) { renameError.value = 'Name cannot be empty.'; return }
    try {
      renamePending.value = true
      renameError.value = ''
      await api.renameDevice(activeDevice.value.device_id, newName)
      activeDevice.value = { ...activeDevice.value, device_name: newName }
      renamingDevice.value = false
      await refreshDevices()
    } catch (e) {
      renameError.value = apiErrorMessage(e, 'Could not rename device.')
    } finally {
      renamePending.value = false
    }
  }
  async function copyDeviceUid() {
    if (!activeDevice.value?.device_uid) return
    try {
      await navigator.clipboard.writeText(activeDevice.value.device_uid)
      uidCopied.value = true
      setTimeout(() => { uidCopied.value = false }, 2000)
    } catch {}
  }
  function toggleShowKey() { showDeviceKey.value = !showDeviceKey.value }
  async function copyDeviceKey() {
    if (!deviceKeyValue.value) return
    try {
      copyPending.value = true
      deviceKeyError.value = ''
      await navigator.clipboard.writeText(deviceKeyValue.value)
      deviceKeyMessage.value = 'Device key copied.'
    } catch {
      deviceKeyError.value = 'Could not copy device key.'
    } finally {
      copyPending.value = false
    }
  }
  async function resetDeviceKey() {
    if (!activeDevice.value?.device_id) return
    try {
      resetPending.value = true
      deviceKeyError.value = ''
      deviceKeyMessage.value = ''
      const res = await api.resetDeviceKey(activeDevice.value.device_id)
      deviceKeyValue.value = res?.device_key || ''
      showDeviceKey.value = false
      deviceKeyMessage.value = res?.message || 'Device key reset successfully.'
      await refreshDevices()
    } catch (e) {
      deviceKeyError.value = apiErrorMessage(e, 'Could not reset device key.')
    } finally {
      resetPending.value = false
    }
  }

  // ── Set Location modal ─────────────────────────────────────────────────────
  const locationModalOpen = ref(false)
  const manualLat = ref('')
  const manualLon = ref('')
  const locationSavePending = ref(false)
  const locationSaveError = ref('')
  const locationSaveOk = ref(false)

  function openLocationModal() {
    locationModalOpen.value = true
    locationSaveError.value = ''
    locationSaveOk.value = false
    manualLat.value = live.value?.last_gps_lat != null ? String(live.value.last_gps_lat) : ''
    manualLon.value = live.value?.last_gps_lon != null ? String(live.value.last_gps_lon) : ''
  }
  function closeLocationModal() {
    locationModalOpen.value = false
    locationSaveError.value = ''
    locationSaveOk.value = false
  }
  async function saveDeviceLocation() {
    const device = devices.value.find(d => d.device_uid === selectedDeviceUid.value)
    if (!device?.device_id) return
    const lat = Number(manualLat.value)
    const lon = Number(manualLon.value)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
      locationSaveError.value = 'Invalid latitude — must be between −90 and 90.'; return
    }
    if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
      locationSaveError.value = 'Invalid longitude — must be between −180 and 180.'; return
    }
    try {
      locationSavePending.value = true
      locationSaveError.value = ''
      await api.setDeviceLocation(device.device_id, lat, lon)
      locationSaveOk.value = true
      await refreshLive()
      setTimeout(() => closeLocationModal(), 1200)
    } catch (e) {
      locationSaveError.value = apiErrorMessage(e, 'Could not set location.')
    } finally {
      locationSavePending.value = false
    }
  }

  // ── Device activity / now timer ────────────────────────────────────────────
  const nowMs = ref(Date.now())
  let nowTimer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    nowTimer = setInterval(() => { nowMs.value = Date.now() }, 1000)
  })
  onBeforeUnmount(() => {
    if (nowTimer) clearInterval(nowTimer)
    clearTimeout(routeDebounceTimer)
  })

  function isDeviceRecent(device: Device): boolean {
    // nowMs is referenced so this re-evaluates each tick.
    void nowMs.value
    if (device.last_seen) {
      return Date.now() - new Date(device.last_seen).getTime() < 5 * 60 * 1000
    }
    if (device.device_uid === selectedDeviceUid.value && live.value?.received_at) {
      return Date.now() - new Date(live.value.received_at).getTime() < 5 * 60 * 1000
    }
    return false
  }

  return {
    session,
    // data
    bootstrap, bootstrapPending, bootstrapError, bootstrapErrorMessage, refreshBootstrap,
    devicesData, devicesPending, devicesError, devicesErrorMessage, refreshDevices,
    homes, devices,
    live, livePending, liveError, liveErrorMessage, refreshLive,
    trends, trendsPending, trendsError, trendsErrorMessage, refreshTrends,
    routeTrends, routePending,
    packetTrends, packetTrendsPending, refreshPacketTrends,
    // selection
    selectedDeviceUid, compareDeviceUid, deviceOptions, selectedDeviceLabel,
    primaryDeviceName, compareDeviceName, selectDevice, selectCompareDevice, isDeviceRecent,
    // ranges & layout
    universalRange, chartExpanded, mapExpanded, gpsMode,
    packetRange, packetLimit, packetPage,
    routeSliderIndex,
    // series
    mergedTimestamps, co2Series, tempSeries, humiditySeries, tvocSeries,
    battLevelSeries, battCurrentSeries,
    // iaq
    iaqScores, iaqCurrentScore, iaqLineColor, iaqScoreLabel, iaqSparkPoints, iaqFillD,
    // gps
    routeCoords,
    // packets
    allPackets, paginatedPackets, totalPacketPages,
    packetModalOpen, activePacket, deletePending, deleteError,
    openPacketModal, closePacketModal, deleteTelemetryReading,
    selectedPacketIds, bulkDeletePending, bulkDeleteError, packetsManageMode,
    selectedCount, allPageSelected, selectAllIndeterminate,
    togglePacket, toggleSelectAll, clearSelection, toggleManageMode, deleteSelectedPackets,
    // add device
    nextDeviceUid, form, selectedHome, selectedHomeRooms,
    submitPending, submitMessage, submitError, addDeviceModalOpen,
    openAddDeviceModal, closeAddDeviceModal, submitDevice,
    // device modal
    deviceModalOpen, activeDevice, deviceKeyValue, deviceKeyError, deviceKeyMessage,
    showDeviceKey, resetPending, copyPending, renamingDevice, renameValue, renamePending,
    renameError, uidCopied,
    openDeviceModal, closeDeviceModal, startRename, cancelRename, saveDeviceName,
    copyDeviceUid, toggleShowKey, copyDeviceKey, resetDeviceKey,
    // location modal
    locationModalOpen, manualLat, manualLon, locationSavePending, locationSaveError,
    locationSaveOk, openLocationModal, closeLocationModal, saveDeviceLocation,
    // misc
    nowMs,
  }
}

export type DashboardContext = ReturnType<typeof createDashboard>

const DashboardKey: InjectionKey<DashboardContext> = Symbol('airbuddy-dashboard')

export function provideDashboard(): DashboardContext {
  const ctx = createDashboard()
  provide(DashboardKey, ctx)
  return ctx
}

export function useDashboard(): DashboardContext {
  const ctx = inject(DashboardKey)
  if (!ctx) throw new Error('useDashboard() called outside of a provideDashboard() scope')
  return ctx
}
