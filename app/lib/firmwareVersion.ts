// ── airOS firmware version helpers ────────────────────────────────────────────
// Devices report their version (X-Firmware-Version header → devices_tb.
// firmware_version). The latest release is VERSION_NUM in turtleOS's
// device/src/app/booter.py, its single source of truth.

export const FIRMWARE_SOURCE_URL =
  'https://raw.githubusercontent.com/h2h-project/turtleOS/main/device/src/app/booter.py'

export function parseVersionNum(source: string): string | null {
  const m = source.match(/^VERSION_NUM\s*=\s*["']([^"']+)["']/m)
  return m?.[1] ?? null
}

// Numeric dotted compare ("2.6.10" > "2.6.9"). Returns null if either side
// isn't a plain dotted version, so callers can avoid a false "outdated" flag.
export function compareVersions(a: string, b: string): number | null {
  const parse = (v: string) => {
    const s = v.trim().replace(/^v/i, '')
    return /^\d+(\.\d+)*$/.test(s) ? s.split('.').map(Number) : null
  }
  const pa = parse(a)
  const pb = parse(b)
  if (!pa || !pb) return null
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (d) return Math.sign(d)
  }
  return 0
}

export type FirmwareStatus = 'current' | 'outdated' | 'unknown'

export function firmwareStatus(deviceVersion?: string | null, latest?: string | null): FirmwareStatus {
  if (!deviceVersion || !latest) return 'unknown'
  const cmp = compareVersions(deviceVersion, latest)
  if (cmp === null) return 'unknown'
  return cmp < 0 ? 'outdated' : 'current'
}
