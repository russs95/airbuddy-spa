// ── Typed AirBuddy API client ─────────────────────────────────────────────────
// Thin wrapper over $fetch that centralises the cookie-session credentials and
// no-cache headers every dashboard call needs. All requests are relative and go
// through the Nuxt server proxy (server/middleware/api-proxy.ts).

const base = {
  credentials: 'include' as const,
  headers: { 'Cache-Control': 'no-cache' },
}

export interface RegisterDevicePayload {
  device_uid: string
  device_name: string
  home_mode: 'new' | 'existing'
  home_id: string | null
  new_home_name: string | null
  room_mode: 'new' | 'existing'
  room_id: string | null
  new_room_name: string | null
}

export function useAirbuddyApi() {
  return {
    getNextUid: () =>
      $fetch<{ next_device_uid?: string }>('/api/devices/next-uid', { ...base }),

    registerDevice: (payload: RegisterDevicePayload) =>
      $fetch<{ message?: string; device?: Record<string, unknown>; device_key?: string }>(
        '/api/devices/register',
        { ...base, method: 'POST', body: payload },
      ),

    renameDevice: (deviceId: string | number, device_name: string) =>
      $fetch(`/api/devices/${deviceId}/rename`, { ...base, method: 'POST', body: { device_name } }),

    setDeviceLocation: (deviceId: string | number, lat: number, lon: number) =>
      $fetch(`/api/devices/${deviceId}/set-location`, { ...base, method: 'POST', body: { lat, lon } }),

    resetDeviceKey: (deviceId: string | number) =>
      $fetch<{ device_key?: string; message?: string }>(
        `/api/devices/${deviceId}/reset-key`,
        { ...base, method: 'POST' },
      ),

    deleteTelemetry: (telemetryId: string | number) =>
      $fetch(`/api/dashboard/telemetry/${telemetryId}`, { ...base, method: 'DELETE' }),

    createRoom: (home_id: string | number, room_name: string) =>
      $fetch<{ message?: string; room?: Record<string, unknown> }>(
        '/api/rooms',
        { ...base, method: 'POST', body: { home_id, room_name } },
      ),

    renameRoom: (roomId: string | number, room_name: string) =>
      $fetch(`/api/rooms/${roomId}/rename`, { ...base, method: 'POST', body: { room_name } }),

    deleteRoom: (roomId: string | number) =>
      $fetch(`/api/rooms/${roomId}`, { ...base, method: 'DELETE' }),

    setRoomComfortTarget: (
      roomId: string | number,
      target_temp_c: number | null,
      target_humidity_pct: number | null,
    ) =>
      $fetch(`/api/rooms/${roomId}/comfort-target`, {
        ...base, method: 'POST', body: { target_temp_c, target_humidity_pct },
      }),

    assignDeviceRoom: (deviceId: string | number, room_id: string | number | null) =>
      $fetch(`/api/devices/${deviceId}/assign-room`, { ...base, method: 'POST', body: { room_id } }),

    logout: () =>
      $fetch('/api/auth/logout', { ...base, method: 'POST' }),
  }
}

// Pull a human-readable message out of a thrown $fetch error.
export function apiErrorMessage(e: unknown, fallback = 'Something went wrong.'): string {
  const err = e as { data?: { message?: string }; message?: string } | undefined
  return err?.data?.message || err?.message || fallback
}
