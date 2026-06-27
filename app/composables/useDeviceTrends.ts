// ── Device trends fetch helper ────────────────────────────────────────────────
// Single source for /api/dashboard/device-trends fetches. Each caller passes a
// distinct key so the (device_uid, hours) combinations are cached independently
// instead of being copy-pasted as separate useFetch blocks.

import type { DeviceTrends } from '~/types/airbuddy'

export function useDeviceTrends(
  deviceUid: Ref<string>,
  hours: Ref<number> | (() => number),
  key: string,
) {
  const hoursRef = typeof hours === 'function' ? computed(hours) : hours
  return useFetch<DeviceTrends>('/api/dashboard/device-trends', {
    key,
    credentials: 'include',
    headers: { 'Cache-Control': 'no-cache' },
    query: computed(() => ({
      device_uid: deviceUid.value || undefined,
      hours: hoursRef.value,
    })),
    watch: [deviceUid, hoursRef],
  })
}
