# AirBuddy SPA — Project Context

## What This Repo Is

This is the **AirBuddy frontend SPA** (`airbuddy-spa`): a Nuxt 4 / Vue 3 single-page application that serves as the public-facing AirBuddy website and user dashboard. Users authenticate via **Buwana SSO** (OpenID Connect) and can manage their homes, rooms, and AirBuddy devices, and view air quality telemetry data through ECharts visualisations.

This repo is **independent of the firmware repo**. It communicates with the AirBuddy Node.js/Express backend (`air2.earthen.io`) via a Nuxt server-side API proxy.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Nuxt 4 (`ssr: false` — SPA mode) |
| UI | Vue 3 (Composition API, `<script setup>`) |
| Charts | ECharts 6 + `nuxt-echarts` / `vue-echarts` |
| Language | TypeScript (where used) |
| Backend API | Node.js/Express at `https://air2.earthen.io` |
| Auth | Buwana SSO (OpenID Connect) — handled by the backend |
| Database | MySQL 8 (`AB_db`) — accessed only through the backend API |

---

## Repository Structure

```
airbuddy-spa/
├── app/
│   ├── components/
│   │   ├── MetricCard.vue          # Single metric display card
│   │   ├── TimeSeriesCanvas.vue    # Canvas-based time series chart
│   │   └── charts/
│   │       └── AirTrendChart.vue   # ECharts air trend chart component
│   ├── lib/
│   │   └── chartCore.ts            # Shared chart utility/config logic
│   └── pages/
│       ├── index.vue               # Public landing page
│       └── dashboard.vue           # Authenticated user dashboard
├── lib/
│   └── api.ts                      # Typed API fetch helpers (health, latest, series)
├── server/
│   └── middleware/
│       └── api-proxy.ts            # Proxies /api/* requests → air2.earthen.io
├── public/                         # Static assets (icons, favicons, logo)
├── docs/
│   └── database/
│       ├── database_schema.md      # Full DB schema reference
│       └── AB_db_schema.sql        # SQL DDL for AB_db
├── nuxt.config.ts                  # Nuxt config (SSR off, ECharts vite exclusion)
├── package.json
└── tsconfig.json
```

---

## API Proxy

All `/api/*` calls from the frontend are proxied by `server/middleware/api-proxy.ts` to `https://air2.earthen.io`. The SPA never holds backend credentials — the backend handles auth sessions, device keys, and DB access.

Key API endpoints used by the dashboard:

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/me` | Current session / user info |
| GET | `/api/dashboard/bootstrap` | Homes + rooms for logged-in user |
| GET | `/api/dashboard/devices` | Devices linked to the user |
| POST | `/api/devices/register` | Register a new device (with optional new home/room) |
| POST | `/api/devices/:id/reset-key` | Generate a new device key |
| GET | `/api/auth/login` | Initiate Buwana SSO login |
| POST | `/api/auth/logout` | End session |
| GET | `/api/device/:deviceId/latest` | Latest telemetry reading |
| GET | `/api/device/:deviceId/series` | Time-series telemetry |

---

## Database Schema (Reference Only)

The SPA never touches the DB directly. Full schema is in `docs/database/database_schema.md`.

**Core hierarchy:**
```
users_tb
 └── homes_tb
      └── rooms_tb
           └── devices_tb
                └── telemetry_readings_tb
```

**Supporting tables:** `device_keys_tb`, `home_memberships_tb`, `sessions`, `buwana_ref_cache_tb`

**Key fields:**
- `users_tb`: `user_id` (bigint), `buwana_sub`, `buwana_id`, `email`, `full_name`
- `devices_tb`: `device_id`, `device_uid`, `device_name`, `home_id`, `room_id`, `claimed_by_user_id`, `status`
- `telemetry_readings_tb`: `device_id`, `recorded_at`, `values_json` (JSON), `lat`, `lon`
- `device_keys_tb`: keys stored as SHA-256 hashes; plaintext returned only once at registration/reset

---

## Authentication Flow

1. User clicks "Login" → `/api/auth/login` → Buwana OpenID Connect
2. Buwana redirects back; backend creates/updates `users_tb` row and sets session cookie
3. Dashboard calls `/api/me` to get session state
4. All subsequent API calls include the session cookie (`credentials: "include"`)

---

## Dashboard Features (Current)

- Session display and user account info (name, email, Buwana sub/ID)
- Homes & rooms list loaded from `/api/dashboard/bootstrap`
- Device grid with click-to-open detail modal
- **Add Device form**: register a device UID + name; create or pick existing home and room
- **Device modal**: view, copy, and reset device key (key shown only once after generation)

---

## Charts / Telemetry Visualisation

ECharts is used for air quality time-series charts. Key files:
- `app/components/charts/AirTrendChart.vue` — ECharts line chart component
- `app/components/TimeSeriesCanvas.vue` — canvas-based alternative renderer
- `app/lib/chartCore.ts` — shared chart config/utility logic

ECharts is excluded from Vite pre-bundling (`optimizeDeps.exclude`) because it lazy-loads internally.

---

## Relationship to Other AirBuddy Components

| Component | Location | Role |
|---|---|---|
| Firmware | Separate MicroPython repo | Runs on RP2040/Pico; sends telemetry to backend |
| Backend API | `air2.earthen.io` (Node/Express/PM2) | Receives telemetry, handles auth, exposes APIs |
| Database | MySQL `AB_db` on VPS | Stores users, homes, rooms, devices, telemetry |
| **This repo** | `airbuddy-spa` (Nuxt SPA) | Frontend dashboard; proxies all API calls to backend |

---

## Development Commands

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run generate   # Static site generation
npm run preview    # Preview production build
```

The dev server proxies `/api/*` to `https://air2.earthen.io` — network access to the backend is needed for API calls to work locally.

---

## Current Focus Areas

- ECharts telemetry visualisation components
- Dashboard UX: homes / rooms / devices management
- Device onboarding form (register device, create home/room, generate key)
- Buwana SSO session integration
- Future: community air data views, historical charts, richer device management
