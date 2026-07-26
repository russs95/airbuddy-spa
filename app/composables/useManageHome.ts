// ── Manage Home page state & logic ────────────────────────────────────────────
// Room-centric view over the same /api/dashboard/bootstrap data the main
// dashboard uses (shared cache key, so no duplicate fetch on navigation),
// plus room CRUD, device-room assignment (incl. drag & drop), a batched
// room-latest poll for at-a-glance AQI, and lightweight per-room sparklines.

import type {
  BootstrapResponse, Device, Room, RoomLatestResponse,
} from '~/types/airbuddy'
import { calcIaqScore, iaqColor, iaqLabel, scoresFromTrends } from '~/lib/iaqScore'

function createManageHome() {
  const api = useAirbuddyApi()

  const { data: bootstrap, pending: bootstrapPending, error: bootstrapError, refresh: refreshBootstrap } =
    useFetch<BootstrapResponse>('/api/dashboard/bootstrap', {
      key: 'dashboard-bootstrap',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      default: () => ({ ok: true, homes: [] }),
    })

  const homes = computed(() => bootstrap.value?.homes || [])

  const errorMessage = (e: unknown) =>
    (e as any)?.data?.message || (e as any)?.message || String(e || '')
  const bootstrapErrorMessage = computed(() => errorMessage(bootstrapError.value))

  // ── Home selector ───────────────────────────────────────────────────────────
  const selectedHomeId = ref('')
  watch(homes, (list) => {
    if (!list.length) { selectedHomeId.value = ''; return }
    if (!selectedHomeId.value || !list.some(h => String(h.home_id) === selectedHomeId.value)) {
      selectedHomeId.value = String(list[0].home_id)
    }
  }, { immediate: true })

  const selectedHome = computed(() =>
    homes.value.find(h => String(h.home_id) === selectedHomeId.value) || null)

  // ── Room-latest (batched at-a-glance readings) ──────────────────────────────
  const { data: roomLatest, refresh: refreshRoomLatest } =
    useFetch<RoomLatestResponse>('/api/dashboard/room-latest', {
      key: 'room-latest',
      credentials: 'include',
      headers: { 'Cache-Control': 'no-cache' },
      default: () => ({ ok: true, devices: [] }),
    })

  const latestByDeviceUid = computed(() => {
    const map = new Map<string, RoomLatestResponse['devices'][number]>()
    for (const d of roomLatest.value?.devices || []) map.set(d.device_uid, d)
    return map
  })

  function isDeviceRecent(device: Device): boolean {
    const seen = device.last_seen || latestByDeviceUid.value.get(device.device_uid)?.last_seen_at
    if (!seen) return false
    return Date.now() - new Date(seen).getTime() < 5 * 60 * 1000
  }

  // Worst (highest-danger) score among a room's devices — a room is only as
  // good as its worst-reporting corner.
  function roomIaqScore(room: Room): number | null {
    const scores = (room.devices || [])
      .map(d => latestByDeviceUid.value.get(d.device_uid))
      .filter((r): r is NonNullable<typeof r> => !!r && (r.co2 != null || r.tvoc != null))
      .map(r => calcIaqScore(
        r.co2, r.tvoc,
        r.temp, r.humidity,
        room.target_temp_c != null ? Number(room.target_temp_c) : null,
        room.target_humidity_pct != null ? Number(room.target_humidity_pct) : null,
      ))
    if (!scores.length) return null
    return Math.max(...scores)
  }
  const roomIaqColor = (room: Room) => {
    const s = roomIaqScore(room)
    return s == null ? '#94a3b8' : iaqColor(s)
  }
  const roomIaqLabel = (room: Room) => {
    const s = roomIaqScore(room)
    return s == null ? 'No data' : iaqLabel(s)
  }

  // ── Per-room 6h sparkline (Suggestion #3) ───────────────────────────────────
  // Not reactive to a single ref like useDeviceTrends — the set of rooms is
  // dynamic, so this fetches once per room's primary device and caches by
  // room_id in a plain reactive map, refreshed alongside the poll below.
  const roomSparklines = ref<Record<string, number[]>>({})
  async function refreshSparklines() {
    const tasks: Promise<void>[] = []
    for (const home of homes.value) {
      for (const room of home.rooms || []) {
        const device = room.devices?.[0]
        if (!device) continue
        tasks.push(
          $fetch<any>('/api/dashboard/device-trends', {
            credentials: 'include',
            headers: { 'Cache-Control': 'no-cache' },
            query: { device_uid: device.device_uid, hours: 6 },
          }).then((trends) => {
            const scores = scoresFromTrends(
              trends,
              room.target_temp_c != null ? Number(room.target_temp_c) : null,
              room.target_humidity_pct != null ? Number(room.target_humidity_pct) : null,
            )
            roomSparklines.value = { ...roomSparklines.value, [String(room.room_id)]: scores }
          }).catch(() => {}),
        )
      }
    }
    await Promise.allSettled(tasks)
  }

  // ── Live polling (Suggestion #2) ────────────────────────────────────────────
  let pollTimer: ReturnType<typeof setInterval> | undefined
  onMounted(() => {
    refreshSparklines()
    pollTimer = setInterval(() => {
      refreshRoomLatest()
      refreshSparklines()
    }, 30_000)
  })
  onBeforeUnmount(() => {
    if (pollTimer) clearInterval(pollTimer)
  })

  // ── Unassigned devices for the selected home ────────────────────────────────
  const unassignedDevices = computed(() => selectedHome.value?.unassigned_devices || [])

  // ── Add Room ─────────────────────────────────────────────────────────────
  const addRoomModalOpen = ref(false)
  const newRoomName = ref('')
  const addRoomPending = ref(false)
  const addRoomError = ref('')

  function openAddRoomModal() {
    newRoomName.value = ''
    addRoomError.value = ''
    addRoomModalOpen.value = true
  }
  function closeAddRoomModal() {
    addRoomModalOpen.value = false
    addRoomError.value = ''
  }
  async function submitAddRoom() {
    if (!selectedHome.value) return
    const name = newRoomName.value.trim()
    if (!name) { addRoomError.value = 'Please enter a room name.'; return }
    try {
      addRoomPending.value = true
      addRoomError.value = ''
      await api.createRoom(selectedHome.value.home_id, name)
      await refreshBootstrap()
      closeAddRoomModal()
    } catch (e) {
      addRoomError.value = apiErrorMessage(e, 'Could not create room.')
    } finally {
      addRoomPending.value = false
    }
  }

  // ── Rename room (inline, per-card) ──────────────────────────────────────
  const renamingRoomId = ref<string | null>(null)
  const renameRoomValue = ref('')
  const renameRoomPending = ref(false)
  const renameRoomError = ref('')

  function startRenameRoom(room: Room) {
    renamingRoomId.value = String(room.room_id)
    renameRoomValue.value = room.room_name
    renameRoomError.value = ''
  }
  function cancelRenameRoom() {
    renamingRoomId.value = null
    renameRoomError.value = ''
  }
  async function saveRoomName(room: Room) {
    const name = renameRoomValue.value.trim()
    if (!name) { renameRoomError.value = 'Name cannot be empty.'; return }
    try {
      renameRoomPending.value = true
      renameRoomError.value = ''
      await api.renameRoom(room.room_id, name)
      renamingRoomId.value = null
      await refreshBootstrap()
    } catch (e) {
      renameRoomError.value = apiErrorMessage(e, 'Could not rename room.')
    } finally {
      renameRoomPending.value = false
    }
  }

  // ── Delete room ──────────────────────────────────────────────────────────
  const deleteRoomPending = ref<string | null>(null)
  async function deleteRoom(room: Room) {
    const deviceCount = room.devices?.length || 0
    const msg = deviceCount
      ? `Delete "${room.room_name}"? ${deviceCount} device${deviceCount !== 1 ? 's' : ''} will become unassigned.`
      : `Delete "${room.room_name}"?`
    if (!window.confirm(msg)) return
    try {
      deleteRoomPending.value = String(room.room_id)
      await api.deleteRoom(room.room_id)
      await refreshBootstrap()
    } catch (e) {
      window.alert(apiErrorMessage(e, 'Could not delete room.'))
    } finally {
      deleteRoomPending.value = null
    }
  }

  // ── Comfort target modal (Suggestion #5) ────────────────────────────────
  const comfortModalOpen = ref(false)
  const comfortRoom = ref<Room | null>(null)
  const comfortTemp = ref('')
  const comfortHumidity = ref('')
  const comfortPending = ref(false)
  const comfortError = ref('')

  function openComfortModal(room: Room) {
    comfortRoom.value = room
    comfortTemp.value = room.target_temp_c != null ? String(room.target_temp_c) : ''
    comfortHumidity.value = room.target_humidity_pct != null ? String(room.target_humidity_pct) : ''
    comfortError.value = ''
    comfortModalOpen.value = true
  }
  function closeComfortModal() {
    comfortModalOpen.value = false
    comfortRoom.value = null
    comfortError.value = ''
  }
  async function saveComfortTarget() {
    if (!comfortRoom.value) return
    const temp = comfortTemp.value.trim() === '' ? null : Number(comfortTemp.value)
    const humidity = comfortHumidity.value.trim() === '' ? null : Number(comfortHumidity.value)
    if (temp != null && (!Number.isFinite(temp) || temp < -50 || temp > 60)) {
      comfortError.value = 'Temperature must be between -50 and 60°C.'; return
    }
    if (humidity != null && (!Number.isFinite(humidity) || humidity < 0 || humidity > 100)) {
      comfortError.value = 'Humidity must be between 0 and 100%.'; return
    }
    try {
      comfortPending.value = true
      comfortError.value = ''
      await api.setRoomComfortTarget(comfortRoom.value.room_id, temp, humidity)
      await refreshBootstrap()
      closeComfortModal()
    } catch (e) {
      comfortError.value = apiErrorMessage(e, 'Could not save comfort target.')
    } finally {
      comfortPending.value = false
    }
  }

  // ── Device room assignment (dropdown + drag & drop, Suggestion #1) ─────
  const assignPendingDeviceId = ref<string | null>(null)
  async function assignDeviceToRoom(device: Device, roomId: string | number | null) {
    if (String(device.room_id ?? '') === String(roomId ?? '')) return
    try {
      assignPendingDeviceId.value = String(device.device_id)
      await api.assignDeviceRoom(device.device_id, roomId)
      await Promise.all([refreshBootstrap(), refreshRoomLatest()])
    } catch (e) {
      window.alert(apiErrorMessage(e, 'Could not move device.'))
    } finally {
      assignPendingDeviceId.value = null
    }
  }

  const draggingDeviceUid = ref('')
  const dragOverTargetId = ref<string | null>(null)
  function onDeviceDragStart(device: Device) {
    draggingDeviceUid.value = device.device_uid
  }
  function onDeviceDragEnd() {
    draggingDeviceUid.value = ''
    dragOverTargetId.value = null
  }
  function findDraggingDevice(): Device | null {
    if (!draggingDeviceUid.value) return null
    for (const home of homes.value) {
      for (const room of home.rooms || []) {
        const d = (room.devices || []).find(d => d.device_uid === draggingDeviceUid.value)
        if (d) return d
      }
      const d = (home.unassigned_devices || []).find(d => d.device_uid === draggingDeviceUid.value)
      if (d) return d
    }
    return null
  }
  async function onDropOnRoom(room: Room) {
    const device = findDraggingDevice()
    dragOverTargetId.value = null
    if (!device) return
    await assignDeviceToRoom(device, room.room_id)
  }
  async function onDropOnUnassigned() {
    const device = findDraggingDevice()
    dragOverTargetId.value = null
    if (!device) return
    await assignDeviceToRoom(device, null)
  }

  return {
    // data
    homes, bootstrapPending, bootstrapError, bootstrapErrorMessage, refreshBootstrap,
    selectedHomeId, selectedHome, unassignedDevices,
    roomLatest, latestByDeviceUid, refreshRoomLatest,
    isDeviceRecent, roomIaqScore, roomIaqColor, roomIaqLabel,
    roomSparklines,
    // add room
    addRoomModalOpen, newRoomName, addRoomPending, addRoomError,
    openAddRoomModal, closeAddRoomModal, submitAddRoom,
    // rename room
    renamingRoomId, renameRoomValue, renameRoomPending, renameRoomError,
    startRenameRoom, cancelRenameRoom, saveRoomName,
    // delete room
    deleteRoomPending, deleteRoom,
    // comfort target
    comfortModalOpen, comfortRoom, comfortTemp, comfortHumidity, comfortPending, comfortError,
    openComfortModal, closeComfortModal, saveComfortTarget,
    // assignment / drag & drop
    assignPendingDeviceId, assignDeviceToRoom,
    draggingDeviceUid, dragOverTargetId,
    onDeviceDragStart, onDeviceDragEnd, onDropOnRoom, onDropOnUnassigned,
  }
}

export type ManageHomeContext = ReturnType<typeof createManageHome>

const ManageHomeKey: InjectionKey<ManageHomeContext> = Symbol('airbuddy-manage-home')

export function provideManageHome(): ManageHomeContext {
  const ctx = createManageHome()
  provide(ManageHomeKey, ctx)
  return ctx
}

export function useManageHome(): ManageHomeContext {
  const ctx = inject(ManageHomeKey)
  if (!ctx) throw new Error('useManageHome() called outside of a provideManageHome() scope')
  return ctx
}
