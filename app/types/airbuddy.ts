// ── AirBuddy domain types ─────────────────────────────────────────────────────
// These shapes are inferred from the backend JSON consumed by the dashboard.
// The SPA is loosely typed against the API, so most fields are optional.

export interface BuwanaUser {
  earthling_emoji?: string
  full_name?: string
  given_name?: string
  first_name?: string
  family_name?: string
  last_name?: string
  username?: string
  email?: string
  buwana_id?: string | number
  buwana_sub?: string
  country?: string
  language?: string
  role?: string
  community?: string
  continent?: string
  location_full?: string
  watershed_name?: string
  location_watershed?: string
  location_lat?: number | string
  location_long?: number | string
  [key: string]: unknown
}

export interface SessionResponse {
  ok: boolean
  user?: BuwanaUser
  [key: string]: unknown
}

export interface Device {
  device_id: number | string
  device_uid: string
  device_name?: string
  home_id?: number | string
  room_id?: number | string
  home_name?: string
  room_name?: string
  status?: string
  last_seen?: string
}

export interface Room {
  room_id: number | string
  home_id?: number | string
  room_name: string
  floor?: string | null
  notes?: string | null
  target_temp_c?: number | string | null
  target_humidity_pct?: number | string | null
  devices?: Device[]
}

// One row per device from /api/dashboard/room-latest.
export interface RoomLatestDevice {
  device_id: number | string
  device_uid: string
  home_id: number | string
  room_id: number | string | null
  last_seen_at?: string | null
  recorded_at?: string | null
  received_at?: string | null
  co2: number | null
  tvoc: number | null
  temp: number | null
  humidity: number | null
  aqi: number | null
}

export interface RoomLatestResponse {
  ok: boolean
  devices: RoomLatestDevice[]
}

export interface Home {
  home_id: number | string
  home_name: string
  rooms?: Room[]
  unassigned_devices?: Device[]
}

export interface BootstrapResponse {
  ok: boolean
  homes: Home[]
}

export interface DevicesResponse {
  ok: boolean
  devices: Device[]
}

// Columnar / parallel-array telemetry shape from /api/dashboard/device-trends.
export interface DeviceTrends {
  timestamps?: number[]
  telemetryIds?: (number | string | null)[]
  ensEco2s?: (number | null)[]
  scdCo2s?: (number | null)[]
  ensTvocs?: (number | null)[]
  ahtTemps?: (number | null)[]
  scdTemps?: (number | null)[]
  rtcTemps?: (number | null)[]
  ahtHumidities?: (number | null)[]
  scdHumidities?: (number | null)[]
  inaBusVs?: (number | null)[]
  inaCurrentMas?: (number | null)[]
  inaPowerMws?: (number | null)[]
  inaBattPcts?: (number | null)[]
  lats?: (number | null)[]
  lons?: (number | null)[]
  [key: string]: unknown
}

// Latest single reading from /api/dashboard/device-live.
export interface LiveReading {
  device_name?: string
  home_name?: string
  room_name?: string
  recorded_at?: string
  received_at?: string
  ens_aqi?: number | null
  ens_eco2?: number | null
  scd_co2?: number | null
  aht_temp?: number | null
  scd_temp?: number | null
  aht_humidity?: number | null
  scd_humidity?: number | null
  ina_batt_pct?: number | null
  ina_bus_v?: number | null
  last_gps_lat?: number | null
  last_gps_lon?: number | null
  last_gps_at?: string | null
  [key: string]: unknown
}

// A single decoded telemetry row for the Latest Packets table.
export interface PacketRaw {
  ensEco2: number | null
  scdCo2: number | null
  ahtTemp: number | null
  scdTemp: number | null
  rtcTemp: number | null
  tvoc: number | null
  ahtHumidity: number | null
  scdHumidity: number | null
  inaBusV: number | null
  inaCurrentMa: number | null
  inaPowerMw: number | null
  inaBattPct: number | null
  lat: number | null
  lon: number | null
}

export interface Packet {
  ts: number
  telemetryId: number | string | null
  timeLabel: string
  timeLabelShort: string
  ensEco2: string
  scdCo2: string
  ahtTemp: string
  scdTemp: string
  rtcTemp: string
  tvoc: string
  raw: PacketRaw
}

export interface DeviceOption {
  device_uid: string
  label: string
}
