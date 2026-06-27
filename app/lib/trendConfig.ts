// ── Shared chart configuration ────────────────────────────────────────────────
// Series colours, threshold bands, and range maps used across the dashboard
// trend charts. Extracted from the original dashboard page so they can be shared
// by the section components.

// Mirrors the ThresholdBand interface exported by AirTrendChart.vue. Defined
// locally so this plain .ts module has no import from a .vue file.
interface ThresholdBand {
  label: string
  from: number
  to: number
  color: string
}

export const DEVICE1_COLORS = {
  ensEco2: '#6a1b9a', scdCo2: '#00796b',
  ahtTemp: '#c62828', scdTemp: '#1565c0', rtcTemp: '#2e7d32',
  ahtHumidity: '#1565c0', scdHumidity: '#00838f', tvoc: '#ef6c00',
  battPct: '#f59e0b', battBusV: '#fbbf24', battCurrent: '#3b82f6',
} as const

export const DEVICE2_COLORS = {
  ensEco2: '#ce93d8', scdCo2: '#80cbc4',
  ahtTemp: '#ef9a9a', scdTemp: '#90caf9', rtcTemp: '#a5d6a7',
  ahtHumidity: '#90caf9', scdHumidity: '#80deea', tvoc: '#ffcc80',
  battPct: '#fcd34d', battBusV: '#fde68a', battCurrent: '#93c5fd',
} as const

// Range keys offered by the main trend + battery panels.
export const TREND_RANGE_KEYS = ['15m', '30m', '1h', '3h', '6h', '12h', '24h', '36h', '50h', '72h', '5d', '7d', '30d']

// Hours of history to fetch per range key (slightly padded so the chart window
// always has data at its left edge).
export const RANGE_FETCH_HOURS: Record<string, number> = {
  '15m': 1, '30m': 1, '1h': 2, '3h': 4, '6h': 7, '12h': 13, '24h': 25,
  '36h': 37, '50h': 51, '72h': 73, '5d': 121, '7d': 169, '30d': 721,
}

// Independent range controls for the Latest Packets table.
export const PACKET_RANGE_KEYS = ['1h', '3h', '6h', '12h', '24h', '50h', '5d', '7d', '30d']
export const PACKET_RANGE_HOURS: Record<string, number> = {
  '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24, '50h': 50, '5d': 120, '7d': 168, '30d': 720,
}

// Route map time-range slider steps.
export const ROUTE_SLIDER_STEPS = [
  { label: '15m', hours: 0.25 },
  { label: '30m', hours: 0.5 },
  { label: '1h',  hours: 1 },
  { label: '2h',  hours: 2 },
  { label: '3h',  hours: 3 },
  { label: '6h',  hours: 6 },
  { label: '9h',  hours: 9 },
  { label: '12h', hours: 12 },
  { label: '18h', hours: 18 },
  { label: '24h', hours: 24 },
  { label: '36h', hours: 36 },
  { label: '48h', hours: 48 },
  { label: '50h', hours: 50 },
  { label: '72h', hours: 72 },
  { label: '5d',  hours: 120 },
]

export const ECO2_THRESHOLD_BANDS: ThresholdBand[] = [
  { label: 'Good',      from: 0,    to: 800,      color: 'rgba(34,197,94,0.10)'  },
  { label: 'OK',        from: 800,  to: 1000,     color: 'rgba(234,179,8,0.12)'  },
  { label: 'Poor',      from: 1000, to: 1400,     color: 'rgba(249,115,22,0.13)' },
  { label: 'Bad',       from: 1400, to: 2000,     color: 'rgba(239,68,68,0.13)'  },
  { label: 'Dangerous', from: 2000, to: Infinity, color: 'rgba(185,28,28,0.16)'  },
]

export const TEMP_THRESHOLD_BANDS: ThresholdBand[] = [
  { label: 'Cold',        from: -Infinity, to: 16,       color: 'rgba(99,179,237,0.13)' },
  { label: 'Cool',        from: 16,        to: 20,       color: 'rgba(56,189,248,0.10)' },
  { label: 'Comfortable', from: 20,        to: 25,       color: 'rgba(34,197,94,0.10)'  },
  { label: 'Warm',        from: 25,        to: 28,       color: 'rgba(251,191,36,0.12)' },
  { label: 'Hot',         from: 28,        to: Infinity, color: 'rgba(239,68,68,0.13)'  },
]

export const HUMIDITY_THRESHOLD_BANDS: ThresholdBand[] = [
  { label: 'Very Dry',    from: 0,  to: 25,       color: 'rgba(210,180,140,0.18)' },
  { label: 'Dry',         from: 25, to: 40,       color: 'rgba(230,210,170,0.13)' },
  { label: 'Comfortable', from: 40, to: 60,       color: 'rgba(34,197,94,0.10)'   },
  { label: 'Humid',       from: 60, to: 70,       color: 'rgba(56,189,248,0.11)'  },
  { label: 'Very Humid',  from: 70, to: Infinity, color: 'rgba(37,99,235,0.14)'   },
]

export const TVOC_THRESHOLD_BANDS: ThresholdBand[] = [
  { label: 'Clean',    from: 0,    to: 220,      color: 'rgba(34,197,94,0.10)'  },
  { label: 'Low',      from: 220,  to: 660,      color: 'rgba(234,179,8,0.12)'  },
  { label: 'Moderate', from: 660,  to: 2200,     color: 'rgba(249,115,22,0.13)' },
  { label: 'High',     from: 2200, to: 5500,     color: 'rgba(239,68,68,0.14)'  },
  { label: 'Danger',   from: 5500, to: Infinity, color: 'rgba(127,0,0,0.18)'    },
]

export const BATT_THRESHOLD_BANDS: ThresholdBand[] = [
  { label: 'Critical', from: 0,  to: 20,  color: 'rgba(239,68,68,0.14)'  },
  { label: 'Low',      from: 20, to: 40,  color: 'rgba(249,115,22,0.12)' },
  { label: 'Good',     from: 40, to: 80,  color: 'rgba(234,179,8,0.10)'  },
  { label: 'Full',     from: 80, to: 100, color: 'rgba(34,197,94,0.09)'  },
]
