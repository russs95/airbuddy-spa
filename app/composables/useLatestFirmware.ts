// ── Latest airOS release ──────────────────────────────────────────────────────
// Reads VERSION_NUM from turtleOS main on GitHub (raw.githubusercontent.com
// allows CORS). Shared keyed fetch, so every device card reuses one request.
// A failed fetch leaves `latest` null and devices show no update flag.

import type { Device } from '~/types/airbuddy'
import { FIRMWARE_SOURCE_URL, parseVersionNum, firmwareStatus } from '~/lib/firmwareVersion'

export function useLatestFirmware() {
  const { data: latest } = useFetch(FIRMWARE_SOURCE_URL, {
    key: 'latest-firmware-version',
    responseType: 'text',
    server: false,
    transform: (src: unknown) => parseVersionNum(String(src ?? '')),
    default: () => null,
  })

  function deviceFirmware(device?: Device | null) {
    const version = device?.firmware_version || null
    return { version, latest: latest.value, status: firmwareStatus(version, latest.value) }
  }

  return { latest, deviceFirmware }
}
