<template>
  <main class="wrap" :data-theme="theme">
    <header class="header">
      <div class="headerLeft">
        <NuxtLink to="/" class="abIconLink" title="AirBuddy Home">
          <img src="/svgs/ab-icon.svg" alt="AirBuddy" class="abIcon abIconMobile" />
          <img v-if="theme === 'dark'" src="/svgs/airbuddy-logo-dark.svg" alt="AirBuddy" class="abLogo abLogoDesktop" />
          <img v-else src="/svgs/airbuddy-logo-light.svg" alt="AirBuddy" class="abLogo abLogoDesktop" />
        </NuxtLink>
        <div>
          <h1>Dashboard</h1>
          <p class="muted">AirBuddy account, homes, rooms, and device setup</p>
        </div>
      </div>

      <div class="btns">
        <button
            class="btn iconBtn"
            @click="toggleTheme"
            :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
        >
          {{ theme === "dark" ? "☀️" : "🌙" }}
        </button>
        <NuxtLink class="btn" to="/">Home</NuxtLink>
        <NuxtLink class="btn" to="/dashboard">
          <i class="fa-solid fa-gauge-high" aria-hidden="true"></i> June
        </NuxtLink>
        <NuxtLink v-if="me?.ok" class="btn" to="/profile">Profile</NuxtLink>
        <NuxtLink class="btn" to="/displayer">Displayer</NuxtLink>
        <a class="btn btnGithub" href="https://github.com/russs95/airbuddy_v2" target="_blank" rel="noopener">
          <svg class="githubIcon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Build
        </a>
        <button v-if="!me?.ok" class="btn" @click="doLogin">Login</button>
        <button class="btn danger" @click="logout" :disabled="logoutPending">
          {{ logoutPending ? "Logging out..." : "Logout" }}
        </button>
      </div>
    </header>

    <!-- Your Devices — top of page -->
    <section v-if="me?.ok" class="card">
      <div class="sectionHeader">
        <div>
          <h2>Your Devices</h2>
          <p class="muted tiny">Devices connected to your account</p>
        </div>

        <div class="btnGroup">
          <button class="btn primary" @click="openAddDeviceModal">+Add</button>
          <button class="btn" @click="refreshDevices()" :disabled="devicesPending">
            {{ devicesPending ? "Refreshing..." : "Refresh" }}
          </button>
        </div>
      </div>

      <div v-if="devicesPending" class="muted">Loading devices…</div>

      <div v-else-if="devicesError" class="error">
        Could not load devices: {{ devicesErrorMessage }}
      </div>

      <div v-else-if="!devices.length" class="muted">
        No devices connected yet. Click +Add to register your first device.
      </div>

      <div v-else class="deviceGrid">
        <div
            v-for="device in devices"
            :key="device.device_id"
            class="deviceCard"
            :class="{ selected: selectedDeviceUid === device.device_uid, compare: compareDeviceUid === device.device_uid }"
            role="button"
            tabindex="0"
            @click="selectDevice(device)"
            @keydown.enter.space.prevent="selectDevice(device)"
        >
          <div class="deviceCardHeader">
            <div class="deviceCardTitle">
              {{ device.device_name || device.device_uid }}
            </div>
            <div class="deviceCardActions">
              <span
                  v-if="selectedDeviceUid === device.device_uid && live?.ens_aqi != null"
                  class="deviceAqiEmoji"
                  :title="`AQI ${live.ens_aqi}`"
              >{{ aqiEmoji(live.ens_aqi) }}</span>
              <span
                  class="statusDot"
                  :class="{ statusDotActive: isDeviceRecent(device) }"
                  :title="isDeviceRecent(device) ? 'Active — reported in the last 5 minutes' : 'No recent data'"
              ></span>
              <button
                  class="deviceCardSettings"
                  type="button"
                  title="Device settings & key"
                  @click.stop="openDeviceModal(device)"
              >⚙️</button>
            </div>
          </div>
          <div class="muted tiny">{{ device.device_uid }}</div>
          <div class="muted tiny">
            {{ device.home_name || "No home" }}<span v-if="device.room_name"> · {{ device.room_name }}</span>
          </div>
          <button
              v-if="selectedDeviceUid && selectedDeviceUid !== device.device_uid"
              class="compareBtn"
              :class="{ compareActive: compareDeviceUid === device.device_uid }"
              type="button"
              @click.stop="selectCompareDevice(device)"
          >{{ compareDeviceUid === device.device_uid ? 'Comparing ✕' : 'Compare' }}</button>
        </div>
      </div>

      <!-- IAQ composite score strip — shown below device grid when a device is selected -->
      <div v-if="selectedDeviceUid && iaqScores.length" class="iaqStrip">
        <div class="iaqStripLeft">
          <div class="iaqStripScore" :style="{ color: iaqLineColor }">{{ iaqCurrentScore != null ? iaqCurrentScore.toFixed(1) : '—' }}</div>
          <div class="iaqStripLabel">{{ iaqScoreLabel }}</div>
          <div class="iaqStripSub">IAQ · 6h trend</div>
        </div>
        <div class="iaqStripChart">
          <svg class="iaqSparkSvg" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
            <defs>
              <linearGradient id="dashIaqGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" :stop-color="iaqLineColor" stop-opacity="0.28"/>
                <stop offset="100%" :stop-color="iaqLineColor" stop-opacity="0.03"/>
              </linearGradient>
            </defs>
            <path :d="iaqFillD" fill="url(#dashIaqGrad)"/>
            <polyline :points="iaqSparkPoints" fill="none" :stroke="iaqLineColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Charts panel — all sensors with shared range controls -->
    <section v-if="me?.ok" class="card chartsPanel">
      <div class="chartsPanelHead">
        <span class="chartsPanelTitle">Air Quality Trends</span>
        <div class="rangeBar" role="group" aria-label="Time range">
          <button
              v-for="r in trendRangeKeys"
              :key="r"
              class="rangeBtn"
              :class="{ active: universalRange === r }"
              @click="universalRange = r"
          >{{ r }}</button>
        </div>
      </div>

      <div class="chartSubCards">

        <!-- CO₂ -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">CO₂</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.eco2 = !chartExpanded.eco2"
                :title="chartExpanded.eco2 ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.eco2"
            >{{ chartExpanded.eco2 ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="co2Series"
              :range="universalRange"
              :theme="theme"
              unit="ppm"
              :decimals="0"
              :height="chartExpanded.eco2 ? 400 : 200"
              :yMin="350"
              :thresholdBands="eco2ThresholdBands"
              :showLegend="co2Series.length > 1"
          />
        </div>

        <!-- Temperature -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Temperature</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.temp = !chartExpanded.temp"
                :title="chartExpanded.temp ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.temp"
            >{{ chartExpanded.temp ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="tempSeries"
              :range="universalRange"
              :theme="theme"
              unit="°C"
              :decimals="1"
              :height="chartExpanded.temp ? 440 : 220"
              :yPad="5"
              :thresholdBands="tempThresholdBands"
              :showLegend="tempSeries.length > 1"
          />
        </div>

        <!-- Humidity -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Humidity</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.humidity = !chartExpanded.humidity"
                :title="chartExpanded.humidity ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.humidity"
            >{{ chartExpanded.humidity ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="humiditySeries"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="1"
              :height="chartExpanded.humidity ? 400 : 200"
              :thresholdBands="humidityThresholdBands"
              :showLegend="humiditySeries.length > 1"
          />
        </div>

        <!-- TVOC -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">TVOC</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.tvoc = !chartExpanded.tvoc"
                :title="chartExpanded.tvoc ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.tvoc"
            >{{ chartExpanded.tvoc ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view trends.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!trends?.timestamps?.length" class="muted chartEmpty">No trend data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="tvocSeries"
              :range="universalRange"
              :theme="theme"
              unit="ppb"
              :decimals="0"
              :height="chartExpanded.tvoc ? 400 : 200"
              :yMin="0"
              :thresholdBands="tvocThresholdBands"
              :showLegend="tvocSeries.length > 1"
          />
        </div>

      </div>
    </section>

    <!-- Battery panel -->
    <section v-if="me?.ok" class="card chartsPanel">
      <div class="chartsPanelHead">
        <span class="chartsPanelTitle">Battery</span>
        <div class="rangeBar" role="group" aria-label="Time range">
          <button
              v-for="r in trendRangeKeys"
              :key="r"
              class="rangeBtn"
              :class="{ active: universalRange === r }"
              @click="universalRange = r"
          >{{ r }}</button>
        </div>
      </div>

      <div class="chartSubCards">

        <!-- Charge level -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Charge Level</span>
            <button
                class="rangeBtn expandBtn"
                @click="chartExpanded.battery = !chartExpanded.battery"
                :title="chartExpanded.battery ? 'Collapse chart' : 'Expand chart'"
                :aria-pressed="chartExpanded.battery"
            >{{ chartExpanded.battery ? '⊟' : '⊞' }}</button>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view battery.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="trendsError" class="error chartEmpty">Trends failed: {{ trendsErrorMessage }}</div>
          <div v-else-if="!battLevelSeries.length" class="muted chartEmpty">No battery data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="battLevelSeries"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="0"
              :height="chartExpanded.battery ? 400 : 200"
              :yMin="0"
              :yMax="100"
              :thresholdBands="battThresholdBands"
              :showLegend="true"
          />
        </div>

        <!-- Current -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">Current (+ charging / − discharging)</span>
          </div>
          <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view battery.</div>
          <div v-else-if="trendsPending" class="muted chartEmpty">Loading…</div>
          <div v-else-if="!battCurrentSeries.length" class="muted chartEmpty">No current data yet for this device.</div>
          <AirTrendChart
              v-else
              :timestamps="mergedTimestamps"
              :series="battCurrentSeries"
              :range="universalRange"
              :theme="theme"
              unit="mA"
              :decimals="0"
              :height="chartExpanded.battery ? 400 : 200"
              :yPad="50"
              :showLegend="battCurrentSeries.length > 1"
          />
        </div>

      </div>
    </section>

    <!-- Current Location / GPS Route -->
    <section v-if="me?.ok" class="card chartsPanel">
      <div class="chartCardHead">
        <span class="chartsPanelTitle">{{ gpsMode === 'route' ? 'GPS Route' : 'Current Location' }}</span>
        <div class="mapControls">
          <div class="rangeBar" role="group" aria-label="Map view">
            <button
                class="rangeBtn"
                :class="{ active: gpsMode === 'location' }"
                @click="gpsMode = 'location'"
            >Location</button>
            <button
                class="rangeBtn"
                :class="{ active: gpsMode === 'route' }"
                @click="gpsMode = 'route'"
            >Route</button>
          </div>
          <button
              class="rangeBtn"
              @click="openLocationModal"
              title="Set device location manually"
              :disabled="!selectedDeviceUid"
          >⚙</button>
          <button
              class="rangeBtn expandBtn"
              @click="mapExpanded = !mapExpanded"
              :title="mapExpanded ? 'Collapse map' : 'Expand map'"
              :aria-pressed="mapExpanded"
          >{{ mapExpanded ? '⊟' : '⊞' }}</button>
        </div>
      </div>

      <div v-if="!selectedDeviceUid" class="muted chartEmpty">Select a device to view location.</div>
      <div v-else-if="livePending && gpsMode === 'location'" class="muted chartEmpty">Loading…</div>
      <div v-else>
        <div class="mapWrapper">
          <LocationMap
              :lat="live?.last_gps_lat ?? null"
              :lon="live?.last_gps_lon ?? null"
              :height="mapExpanded ? 420 : 180"
              :theme="theme"
              :mode="gpsMode"
              :routeCoords="routeCoords"
          />
          <Transition name="mapFade">
            <div v-if="routePending && gpsMode === 'route'" class="mapLoadingOverlay">
              <span class="tiny">Updating route…</span>
            </div>
          </Transition>
        </div>

        <div class="locationMeta tiny muted">
          <template v-if="gpsMode === 'location'">
            <template v-if="live?.last_gps_lat != null && live?.last_gps_lon != null">
              <span class="locationCoord">
                <strong>Lat:</strong> {{ Number(live.last_gps_lat).toFixed(6) }}°
              </span>
              <span class="locationCoord">
                <strong>Lon:</strong> {{ Number(live.last_gps_lon).toFixed(6) }}°
              </span>
              <span v-if="live?.last_gps_at">
                <strong>As of:</strong> {{ live.last_gps_at }}
              </span>
              <span v-if="live?.last_gps_at !== live?.recorded_at" class="locationStale">
                (GPS from earlier reading)
              </span>
            </template>
            <span v-else class="muted">No GPS data found for this device.</span>
          </template>
          <template v-else>
            <span v-if="routeCoords.length">
              <strong>{{ routeCoords.length }}</strong> GPS point{{ routeCoords.length !== 1 ? 's' : '' }} · green = start, blue = latest
            </span>
            <span v-else class="muted">No GPS coordinates in this time range.</span>
          </template>
        </div>

        <!-- Route time range slider -->
        <div class="routeSliderWrap" :class="{ routeSliderActive: gpsMode === 'route' }">
          <div class="routeSliderHead">
            <span class="tiny muted">Route range</span>
            <span class="routeSliderValue">{{ routeSliderSteps[routeSliderIndex].label }}</span>
            <span v-if="routePending" class="tiny muted">Loading…</span>
          </div>
          <input
              type="range"
              min="0"
              :max="routeSliderSteps.length - 1"
              step="1"
              v-model.number="routeSliderIndex"
              class="routeSliderInput"
              aria-label="Route time range"
          />
          <div class="routeSliderTicks tiny muted">
            <span>15m</span>
            <span>3h</span>
            <span>12h</span>
            <span>36h</span>
            <span>72h</span>
            <span>5d</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest packets -->
    <section v-if="me?.ok" class="card">
      <div class="packetHead">
        <div>
          <h2>Latest Packets</h2>
          <span class="tiny muted">{{ allPackets.length }} total · page {{ packetPage + 1 }} of {{ totalPacketPages }}</span>
        </div>
        <div class="packetControls">
          <div class="rangeBar" role="group" aria-label="Time range">
            <button v-for="r in packetRangeKeys" :key="r"
                class="rangeBtn"
                :class="{ active: packetRange === r }"
                @click="packetRange = r"
            >{{ r }}</button>
          </div>
        </div>
      </div>

      <div v-if="!selectedDeviceUid" class="muted tiny">Select a device to view packets.</div>
      <div v-else-if="packetTrendsPending" class="muted tiny">Loading…</div>
      <div v-else-if="!allPackets.length" class="muted tiny">No packets in this time range.</div>

      <div v-else>
        <div class="packetTableWrap">
          <table class="packetTable" :class="{ 'packets-manage-mode': packetsManageMode }">
            <thead>
            <tr>
              <th class="checkCell">
                <input
                    ref="selectAllCheckbox"
                    type="checkbox"
                    :checked="allPageSelected"
                    @change="toggleSelectAll"
                    title="Select all on this page"
                />
              </th>
              <th>Time</th>
              <th>ENS CO₂</th>
              <th>SCD CO₂</th>
              <th>AHT Temp</th>
              <th>SCD Temp</th>
              <th>RTC Temp</th>
              <th>TVOC</th>
              <th>Lat</th>
              <th>Lon</th>
              <th></th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for="pkt in paginatedPackets"
                :key="pkt.ts"
                :class="{ selectedRow: pkt.telemetryId && selectedPacketIds.has(pkt.telemetryId) }"
            >
              <td class="checkCell">
                <input
                    type="checkbox"
                    :checked="pkt.telemetryId && selectedPacketIds.has(pkt.telemetryId)"
                    @change="togglePacket(pkt.telemetryId)"
                    :disabled="!pkt.telemetryId"
                />
              </td>
              <td class="packetTime" :title="pkt.timeLabel">{{ pkt.timeLabelShort }}</td>
              <td>{{ pkt.ensEco2 }}</td>
              <td>{{ pkt.scdCo2 }}</td>
              <td>{{ pkt.ahtTemp }}</td>
              <td>{{ pkt.scdTemp }}</td>
              <td>{{ pkt.rtcTemp }}</td>
              <td>{{ pkt.tvoc }}</td>
              <td class="packetCoord">{{ pkt.raw.lat != null ? Number(pkt.raw.lat).toFixed(4) : '—' }}</td>
              <td class="packetCoord">{{ pkt.raw.lon != null ? Number(pkt.raw.lon).toFixed(4) : '—' }}</td>
              <td class="packetGearCell">
                <button class="packetGearBtn" type="button" title="View details" @click="openPacketModal(pkt)">⚙</button>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <div v-if="selectedCount > 0" class="bulkActions">
          <span class="tiny muted">{{ selectedCount }} selected</span>
          <button
              class="btn danger"
              type="button"
              @click="deleteSelectedPackets"
              :disabled="bulkDeletePending"
          >{{ bulkDeletePending ? 'Deleting…' : `Delete ${selectedCount} selected` }}</button>
          <button class="btn" type="button" @click="clearSelection">Deselect all</button>
          <span v-if="bulkDeleteError" class="errMsg tiny bulkErrMsg">{{ bulkDeleteError }}</span>
        </div>

        <div class="paginationBar">
          <button class="btn" type="button" @click="toggleManageMode">{{ packetsManageMode ? 'Done' : 'Manage Telemetry' }}</button>
          <button class="btn" :disabled="packetPage === 0" @click="packetPage--">‹ Prev</button>
          <span class="paginationInfo tiny muted">{{ packetPage + 1 }} / {{ totalPacketPages }}</span>
          <button class="btn" :disabled="packetPage >= totalPacketPages - 1" @click="packetPage++">Next ›</button>
          <div class="rangeBar paginationLimit" role="group" aria-label="Rows per page">
            <button v-for="n in [10, 25, 100]" :key="n"
                class="rangeBtn"
                :class="{ active: packetLimit === n }"
                @click="packetLimit = n"
            >{{ n }}</button>
          </div>
        </div>
      </div>
    </section>

    <!-- Latest telemetry metrics -->
    <section v-if="me?.ok" class="card">
      <h2>Latest Telemetry</h2>

      <div v-if="!selectedDeviceUid" class="muted">
        Select a device to view live telemetry.
      </div>

      <div v-else-if="livePending" class="muted">
        Loading latest telemetry…
      </div>

      <div v-else-if="liveError" class="error">
        Latest telemetry failed: {{ liveErrorMessage }}
      </div>

      <template v-else>
        <div v-if="live?.ens_aqi != null" class="aqiBanner">
          <span class="aqiBannerEmoji">{{ aqiEmoji(live.ens_aqi) }}</span>
          <span class="aqiBannerLabel">AQI {{ live.ens_aqi }} —
            <span v-if="live.ens_aqi <= 1">Excellent</span>
            <span v-else-if="live.ens_aqi <= 2">Good</span>
            <span v-else-if="live.ens_aqi <= 3">Moderate</span>
            <span v-else-if="live.ens_aqi <= 4">Poor</span>
            <span v-else>Very Poor</span>
          </span>
        </div>
        <div class="metricsGrid">
          <MetricCard label="CO₂" :value="formatMetric(live?.ens_eco2 ?? live?.scd_co2, 0)" unit="ppm" />
          <MetricCard label="Temperature" :value="formatMetric(live?.aht_temp ?? live?.scd_temp, 1)" unit="°C" />
          <MetricCard label="Humidity" :value="formatMetric(live?.aht_humidity ?? live?.scd_humidity, 1)" unit="%" />
          <MetricCard label="AQI" :value="formatMetric(live?.ens_aqi, 0)" />
          <MetricCard v-if="live?.ina_batt_pct != null" label="Battery" :value="formatMetric(live?.ina_batt_pct, 0)" unit="%" />
          <MetricCard v-if="live?.ina_bus_v != null" label="Bus V" :value="formatMetric(live?.ina_bus_v, 2)" unit="V" />
        </div>

        <div class="meta tiny muted">
          <div><strong>Device:</strong> {{ live?.device_name || selectedDeviceUid || "—" }}</div>
          <div><strong>Home:</strong> {{ live?.home_name || "—" }}</div>
          <div><strong>Room:</strong> {{ live?.room_name || "—" }}</div>
          <div><strong>Recorded:</strong> {{ live?.recorded_at || "—" }}</div>
          <div><strong>Received:</strong> {{ live?.received_at || "—" }}</div>
        </div>
      </template>
    </section>

    <section v-if="me?.ok" class="card">
      <h2>Account</h2>
      <div class="accountGrid">

        <!-- Identity — buwana:basic -->
        <div class="accountField" v-if="me.user?.earthling_emoji">
          <span class="accountEmoji">{{ me.user.earthling_emoji }}</span>
        </div>
        <div class="accountField">
          <span class="accountLabel">Name</span>
          <span>{{ me.user?.full_name || [me.user?.given_name || me.user?.first_name, me.user?.family_name || me.user?.last_name].filter(Boolean).join(' ') || me.user?.username || "—" }}</span>
        </div>
        <div class="accountField">
          <span class="accountLabel">Email</span>
          <span>{{ me.user?.email || "—" }}</span>
        </div>
        <div class="accountField">
          <span class="accountLabel">Buwana ID</span>
          <span>{{ me.user?.buwana_id || "—" }}</span>
        </div>
        <div class="accountField" v-if="me.user?.buwana_sub">
          <span class="accountLabel">Buwana Sub</span>
          <span class="muted tiny">{{ me.user.buwana_sub }}</span>
        </div>

        <!-- Profile — buwana:profile -->
        <template v-if="me.user?.country || me.user?.language || me.user?.role">
          <div class="accountDivider"></div>
          <div class="accountField" v-if="me.user?.country">
            <span class="accountLabel">Country</span>
            <span>{{ me.user.country }}</span>
          </div>
          <div class="accountField" v-if="me.user?.language">
            <span class="accountLabel">Language</span>
            <span>{{ me.user.language }}</span>
          </div>
          <div class="accountField" v-if="me.user?.role">
            <span class="accountLabel">Role</span>
            <span>{{ me.user.role }}</span>
          </div>
        </template>

        <!-- Community — buwana:community -->
        <template v-if="me.user?.community">
          <div class="accountDivider"></div>
          <div class="accountField">
            <span class="accountLabel">Community</span>
            <span>{{ me.user.community }}</span>
          </div>
        </template>

        <!-- Bioregion — buwana:bioregion -->
        <template v-if="me.user?.continent || me.user?.location_full || me.user?.watershed_name">
          <div class="accountDivider"></div>
          <div class="accountField" v-if="me.user?.continent">
            <span class="accountLabel">Continent</span>
            <span>{{ me.user.continent }}</span>
          </div>
          <div class="accountField" v-if="me.user?.location_full">
            <span class="accountLabel">Location</span>
            <span>{{ me.user.location_full }}</span>
          </div>
          <div class="accountField" v-if="me.user?.watershed_name">
            <span class="accountLabel">Watershed</span>
            <span>{{ me.user.watershed_name }}<span v-if="me.user?.location_watershed" class="muted"> · {{ me.user.location_watershed }}</span></span>
          </div>
          <div class="accountField" v-if="me.user?.location_lat && me.user?.location_long">
            <span class="accountLabel">Coordinates</span>
            <span class="tiny muted">{{ me.user.location_lat }}, {{ me.user.location_long }}</span>
          </div>
        </template>

      </div>
    </section>

    <section v-if="me?.ok" class="card">
      <h2>Homes & Rooms</h2>

      <div v-if="bootstrapPending" class="muted">Loading homes and rooms…</div>

      <div v-else-if="bootstrapError" class="error">
        Could not load homes/rooms: {{ bootstrapErrorMessage }}
      </div>

      <div v-else>
        <div v-if="!homes.length" class="muted">
          No homes yet. Create your first home and room by adding a device.
        </div>

        <div v-else class="homeList">
          <div v-for="home in homes" :key="home.home_id" class="homeCard">
            <div class="homeTitle">{{ home.home_name }}</div>
            <div class="muted tiny">
              {{ home.rooms?.length || 0 }} room<span v-if="(home.rooms?.length || 0) !== 1">s</span>
            </div>

            <ul v-if="home.rooms?.length" class="roomList">
              <li v-for="room in home.rooms" :key="room.room_id">
                {{ room.room_name }}
              </li>
            </ul>

            <div
                v-if="home.unassigned_devices?.length"
                class="muted tiny unassigned"
            >
              {{ home.unassigned_devices.length }} unassigned device<span v-if="home.unassigned_devices.length !== 1">s</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Session panel — bottom of page -->
    <section class="card">
      <h2>Session</h2>
      <div v-if="mePending" class="muted">Loading…</div>
      <div v-else-if="me?.ok" class="sessionGrid">
        <div class="sessionField" v-if="me.user?.earthling_emoji">
          <span class="sessionEmoji">{{ me.user.earthling_emoji }}</span>
        </div>
        <div class="sessionField" v-if="me.user?.given_name || me.user?.first_name">
          <span class="sessionLabel">First name</span>
          <span>{{ me.user.given_name || me.user.first_name }}</span>
        </div>
        <div class="sessionField" v-if="me.user?.buwana_id">
          <span class="sessionLabel">Buwana ID</span>
          <span>{{ me.user.buwana_id }}</span>
        </div>
        <div class="sessionField" v-if="me.user?.community">
          <span class="sessionLabel">Community</span>
          <span>{{ me.user.community }}</span>
        </div>
        <div class="sessionField" v-if="me.user?.continent">
          <span class="sessionLabel">Continent</span>
          <span>{{ me.user.continent }}</span>
        </div>
        <div class="sessionDivider"></div>
        <details class="sessionRaw">
          <summary class="muted tiny">Raw session data</summary>
          <pre>{{ pretty(me) }}</pre>
        </details>
      </div>
      <div v-else>
        <pre>{{ pretty(me) }}</pre>
      </div>
    </section>

    <section v-if="!me?.ok && !mePending" class="card">
      <h2>Status</h2>
      <div class="error">Not authenticated.</div>
      <div class="muted tiny">Click "Login" and come back here.</div>
    </section>

    <!-- Packet Detail Modal -->
    <div v-if="packetModalOpen" class="modalBackdrop" @click.self="closePacketModal">
      <div class="modalCard">
        <div class="modalHeader">
          <div>
            <h3 class="modalTitle">Telemetry Reading</h3>
            <div class="muted tiny">{{ activePacket?.timeLabel }}</div>
          </div>
          <button class="btn" type="button" @click="closePacketModal">Close</button>
        </div>

        <div class="modalBody">
          <div class="pktDetailGrid">

            <div class="pktDetailSection">
              <div class="pktDetailHead">Air Quality</div>
              <div class="pktDetailRow"><span>ENS CO₂</span><span>{{ formatPacketValue(activePacket?.raw?.ensEco2, 0, 'ppm') }}</span></div>
              <div class="pktDetailRow"><span>SCD CO₂</span><span>{{ formatPacketValue(activePacket?.raw?.scdCo2, 0, 'ppm') }}</span></div>
              <div class="pktDetailRow"><span>TVOC</span><span>{{ formatPacketValue(activePacket?.raw?.tvoc, 0, 'ppb') }}</span></div>
            </div>

            <div class="pktDetailSection">
              <div class="pktDetailHead">Temperature</div>
              <div class="pktDetailRow"><span>AHT Temp</span><span>{{ formatPacketValue(activePacket?.raw?.ahtTemp, 1, '°C') }}</span></div>
              <div class="pktDetailRow"><span>SCD Temp</span><span>{{ formatPacketValue(activePacket?.raw?.scdTemp, 1, '°C') }}</span></div>
              <div class="pktDetailRow"><span>RTC Temp</span><span>{{ formatPacketValue(activePacket?.raw?.rtcTemp, 1, '°C') }}</span></div>
            </div>

            <div class="pktDetailSection">
              <div class="pktDetailHead">Humidity</div>
              <div class="pktDetailRow"><span>AHT RH</span><span>{{ formatPacketValue(activePacket?.raw?.ahtHumidity, 1, '%') }}</span></div>
              <div class="pktDetailRow"><span>SCD RH</span><span>{{ formatPacketValue(activePacket?.raw?.scdHumidity, 1, '%') }}</span></div>
            </div>

            <div class="pktDetailSection">
              <div class="pktDetailHead">Battery</div>
              <div class="pktDetailRow"><span>Charge</span><span>{{ formatPacketValue(activePacket?.raw?.inaBattPct, 0, '%') }}</span></div>
              <div class="pktDetailRow"><span>Bus V</span><span>{{ formatPacketValue(activePacket?.raw?.inaBusV, 2, 'V') }}</span></div>
              <div class="pktDetailRow"><span>Current</span><span>{{ formatPacketValue(activePacket?.raw?.inaCurrentMa, 0, 'mA') }}</span></div>
              <div class="pktDetailRow"><span>Power</span><span>{{ formatPacketValue(activePacket?.raw?.inaPowerMw, 0, 'mW') }}</span></div>
            </div>

            <div class="pktDetailSection">
              <div class="pktDetailHead">GPS</div>
              <div class="pktDetailRow"><span>Lat</span><span>{{ activePacket?.raw?.lat != null ? Number(activePacket.raw.lat).toFixed(6) + '°' : '—' }}</span></div>
              <div class="pktDetailRow"><span>Lon</span><span>{{ activePacket?.raw?.lon != null ? Number(activePacket.raw.lon).toFixed(6) + '°' : '—' }}</span></div>
            </div>

            <div class="pktDetailSection">
              <div class="pktDetailHead">Record</div>
              <div class="pktDetailRow"><span>Telemetry ID</span><span class="tiny muted">{{ activePacket?.telemetryId ?? '—' }}</span></div>
            </div>

          </div>

          <div class="divider"></div>

          <div v-if="deleteError" class="message errMsg">{{ deleteError }}</div>

          <div class="actions">
            <button
                class="btn danger"
                type="button"
                @click="deleteTelemetryReading"
                :disabled="deletePending || !activePacket?.telemetryId"
            >{{ deletePending ? 'Deleting…' : 'Delete Reading' }}</button>
          </div>

          <div class="muted tiny">Deleting this reading is permanent and cannot be undone.</div>
        </div>
      </div>
    </div>

    <!-- Add Device Modal -->
    <div
        v-if="addDeviceModalOpen"
        class="modalBackdrop"
        @click.self="closeAddDeviceModal"
    >
      <div class="modalCard">
        <div class="modalHeader">
          <div>
            <h3 class="modalTitle">Add Device</h3>
            <div class="muted tiny">Register a new AirBuddy device to your account</div>
          </div>
          <button class="btn" type="button" @click="closeAddDeviceModal">Close</button>
        </div>

        <div class="modalBody">
          <form class="deviceForm" @submit.prevent="submitDevice">
            <div class="formRow">
              <label class="label">Device UID</label>
              <input
                  v-model.trim="nextDeviceUid"
                  class="input keyInput"
                  placeholder="Fetching suggested ID…"
              />
              <div class="muted tiny">Auto-assigned based on your account — you can edit it before saving.</div>
            </div>

            <div class="formRow">
              <label class="label">Device Name</label>
              <input
                  v-model.trim="form.device_name"
                  class="input"
                  placeholder="Bedroom AirBuddy"
              />
            </div>

            <div class="muted tiny">
              A secure device key will be generated automatically after registration.
            </div>

            <div class="divider"></div>

            <div class="formRow">
              <label class="label">Home</label>
              <div class="modeRow">
                <label class="radio">
                  <input
                      type="radio"
                      value="existing"
                      v-model="form.home_mode"
                      :disabled="!homes.length"
                  />
                  <span>Use existing</span>
                </label>

                <label class="radio">
                  <input type="radio" value="new" v-model="form.home_mode" />
                  <span>Create new</span>
                </label>
              </div>
            </div>

            <div v-if="form.home_mode === 'existing' && homes.length" class="formRow">
              <label class="label">Choose Home</label>
              <select v-model="form.home_id" class="input">
                <option disabled value="">Select a home</option>
                <option
                    v-for="home in homes"
                    :key="home.home_id"
                    :value="String(home.home_id)"
                >
                  {{ home.home_name }}
                </option>
              </select>
            </div>

            <div v-if="form.home_mode === 'new' || !homes.length" class="formRow">
              <label class="label">New Home Name</label>
              <input
                  v-model.trim="form.new_home_name"
                  class="input"
                  placeholder="My Home"
              />
            </div>

            <div class="divider"></div>

            <div class="formRow">
              <label class="label">Room</label>
              <div class="modeRow">
                <label class="radio">
                  <input
                      type="radio"
                      value="existing"
                      v-model="form.room_mode"
                      :disabled="!selectedHomeRooms.length"
                  />
                  <span>Use existing</span>
                </label>

                <label class="radio">
                  <input type="radio" value="new" v-model="form.room_mode" />
                  <span>Create new</span>
                </label>
              </div>
            </div>

            <div
                v-if="form.room_mode === 'existing' && selectedHomeRooms.length"
                class="formRow"
            >
              <label class="label">Choose Room</label>
              <select v-model="form.room_id" class="input">
                <option disabled value="">Select a room</option>
                <option
                    v-for="room in selectedHomeRooms"
                    :key="room.room_id"
                    :value="String(room.room_id)"
                >
                  {{ room.room_name }}
                </option>
              </select>
            </div>

            <div
                v-if="form.room_mode === 'new' || !selectedHomeRooms.length"
                class="formRow"
            >
              <label class="label">New Room Name</label>
              <input
                  v-model.trim="form.new_room_name"
                  class="input"
                  placeholder="Bedroom"
              />
            </div>

            <div class="actions">
              <button class="btn primary" type="submit" :disabled="submitPending || !nextDeviceUid">
                {{ submitPending ? "Saving..." : "Add Device" }}
              </button>
            </div>

            <div v-if="submitMessage" class="message okMsg">
              {{ submitMessage }}
            </div>

            <div v-if="submitError" class="message errMsg">
              {{ submitError }}
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Device Detail Modal -->
    <div
        v-if="deviceModalOpen"
        class="modalBackdrop"
        @click.self="closeDeviceModal"
    >
      <div class="modalCard">
        <div class="modalHeader">
          <div class="modalTitleBlock">
            <div v-if="renamingDevice" class="renameRow">
              <input
                  v-model.trim="renameValue"
                  class="input renameInput"
                  placeholder="Device name"
                  @keydown.enter="saveDeviceName"
                  @keydown.escape="cancelRename"
                  autofocus
              />
              <button class="btn primary iconBtnSm" type="button" @click="saveDeviceName" :disabled="renamePending" title="Save name">✓</button>
              <button class="btn iconBtnSm" type="button" @click="cancelRename" title="Cancel">✕</button>
            </div>
            <div v-else class="modalTitleRow">
              <h3 class="modalTitle editableTitle" @click="startRename" title="Click to edit name">{{ activeDevice?.device_name || activeDevice?.device_uid || "Device" }}</h3>
            </div>
            <div class="deviceUidRow muted tiny">
              <code class="deviceUidCode">{{ activeDevice?.device_uid }}</code>
              <button class="copyUidBtn" type="button" @click="copyDeviceUid" :title="uidCopied ? 'Copied!' : 'Copy device ID'">{{ uidCopied ? '✓' : '⎘' }}</button>
            </div>
            <div v-if="renameError" class="message errMsg renameErr">{{ renameError }}</div>
          </div>

          <button class="btn" type="button" @click="closeDeviceModal">Close</button>
        </div>

        <div class="modalBody">
          <div class="deviceMeta">
            <div><strong>Home:</strong> {{ activeDevice?.home_name || "—" }}</div>
            <div><strong>Room:</strong> {{ activeDevice?.room_name || "—" }}</div>
          </div>

          <div class="divider"></div>

          <div class="formRow">
            <label class="label">Device Key</label>

            <div v-if="deviceKeyValue" class="keyBlock">
              <div class="keyRow">
                <input
                    :type="showDeviceKey ? 'text' : 'password'"
                    class="input keyInput"
                    :value="deviceKeyValue"
                    readonly
                />

                <button class="btn" type="button" @click="toggleShowKey">
                  {{ showDeviceKey ? "Hide" : "Show" }}
                </button>

                <button class="btn" type="button" @click="copyDeviceKey" :disabled="copyPending">
                  {{ copyPending ? "Copying..." : "Copy" }}
                </button>
              </div>

              <div class="muted tiny">
                Save this key now. For security, it will not be shown again after you close this dialog.
              </div>
            </div>

            <div v-else class="muted tiny">
              Current keys cannot be viewed again. Reset the key to generate a new one.
            </div>
          </div>

          <div v-if="deviceKeyMessage" class="message okMsg">
            {{ deviceKeyMessage }}
          </div>

          <div v-if="deviceKeyError" class="message errMsg">
            {{ deviceKeyError }}
          </div>

          <div class="actions">
            <button
                class="btn danger"
                type="button"
                @click="resetDeviceKey"
                :disabled="resetPending || !activeDevice?.device_id"
            >
              {{ resetPending ? "Resetting..." : "Reset Key" }}
            </button>
          </div>

          <div class="muted tiny">
            Resetting the key will require updating the key on the physical AirBuddy device.
          </div>
        </div>
      </div>
    </div>

    <!-- Set Location Modal -->
    <div v-if="locationModalOpen" class="modalBackdrop" @click.self="closeLocationModal">
      <div class="modalCard">
        <div class="modalHeader">
          <div>
            <h3 class="modalTitle">Set Device Location</h3>
            <div class="muted tiny">Manually pin a fixed location for this device</div>
          </div>
          <button class="btn" type="button" @click="closeLocationModal">Close</button>
        </div>

        <div class="modalBody">
          <p class="muted tiny locationModalNote">
            Use this for devices without GPS. Enter coordinates below and the backend will store them as the device's fixed location, returning them whenever telemetry has no GPS reading.
          </p>

          <div class="formRow">
            <label class="label">Latitude</label>
            <input
                v-model="manualLat"
                class="input"
                type="number"
                step="any"
                min="-90"
                max="90"
                placeholder="e.g. 48.8566"
            />
          </div>

          <div class="formRow">
            <label class="label">Longitude</label>
            <input
                v-model="manualLon"
                class="input"
                type="number"
                step="any"
                min="-180"
                max="180"
                placeholder="e.g. 2.3522"
            />
          </div>

          <div v-if="locationSaveError" class="message errMsg">{{ locationSaveError }}</div>
          <div v-if="locationSaveOk" class="message okMsg">Location saved.</div>

          <div class="actions">
            <button class="btn primary" type="button" @click="saveDeviceLocation" :disabled="locationSavePending || !selectedDeviceUid">
              {{ locationSavePending ? "Saving…" : "Set Location" }}
            </button>
          </div>

          <div class="muted tiny">
            The backend should store this on the device record so it persists regardless of future telemetry.
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import AirTrendChart from '~/components/charts/AirTrendChart.vue'
import LocationMap from '~/components/LocationMap.vue'
import { mergeTimestamps, alignSeries } from '~/lib/mergeTimestamps'
import { scoresFromTrends, iaqColor, iaqLabel as calcIaqLabel, sparklinePoints, sparklineFillPath } from '../lib/iaqScore'

useHead({ title: 'AirBuddy | Beta Dashboard' })

// ── Theme ────────────────────────────────────────────────────────────────────
const theme = ref("light")
let nowTimer = null
let routeDebounceTimer = null

onMounted(() => {
  const saved = localStorage.getItem("airbuddy-theme")
  if (saved === "dark" || saved === "light") {
    theme.value = saved
  } else {
    theme.value = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  }
  document.documentElement.setAttribute("data-airbuddy-theme", theme.value)

  nowTimer = window.setInterval(() => { nowMs.value = Date.now() }, 1000)
})

onBeforeUnmount(() => {
  if (nowTimer) clearInterval(nowTimer)
  clearTimeout(routeDebounceTimer)
})

watch(theme, (v) => {
  if (process.client) {
    localStorage.setItem("airbuddy-theme", v)
    document.documentElement.setAttribute("data-airbuddy-theme", v)
  }
})

function toggleTheme() {
  theme.value = theme.value === "dark" ? "light" : "dark"
}

function doLogin() {
  window.location.href = `/api/auth/login?mode=${encodeURIComponent(theme.value)}`
}

// ── Auth / session ───────────────────────────────────────────────────────────
const router = useRouter()
const logoutPending = ref(false)

const { data: me, pending: mePending, refresh: refreshMe } = await useFetch("/api/me", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
})

// ── Bootstrap (homes + rooms) ────────────────────────────────────────────────
const {
  data: bootstrap,
  pending: bootstrapPending,
  error: bootstrapError,
  refresh: refreshBootstrap,
} = await useFetch("/api/dashboard/bootstrap", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  default: () => ({ ok: true, homes: [] }),
})

// ── Devices list ─────────────────────────────────────────────────────────────
const {
  data: devicesData,
  pending: devicesPending,
  error: devicesError,
  refresh: refreshDevices,
} = await useFetch("/api/dashboard/devices", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  default: () => ({ ok: true, devices: [] }),
})

const homes = computed(() => bootstrap.value?.homes || [])
const devices = computed(() => devicesData.value?.devices || [])

const nextDeviceUid = ref("")

const bootstrapErrorMessage = computed(() => {
  const e = bootstrapError.value
  return e?.data?.message || e?.message || String(e || "")
})

const devicesErrorMessage = computed(() => {
  const e = devicesError.value
  return e?.data?.message || e?.message || String(e || "")
})

// ── Device selector for charts ───────────────────────────────────────────────
const selectedDeviceUid = ref("")
const compareDeviceUid = ref("")

const DEVICE1_COLORS = {
  ensEco2: '#6a1b9a', scdCo2: '#00796b',
  ahtTemp: '#c62828', scdTemp: '#1565c0', rtcTemp: '#2e7d32',
  ahtHumidity: '#1565c0', scdHumidity: '#00838f', tvoc: '#ef6c00',
  battPct: '#f59e0b', battBusV: '#fbbf24', battCurrent: '#3b82f6',
}

const DEVICE2_COLORS = {
  ensEco2: '#ce93d8', scdCo2: '#80cbc4',
  ahtTemp: '#ef9a9a', scdTemp: '#90caf9', rtcTemp: '#a5d6a7',
  ahtHumidity: '#90caf9', scdHumidity: '#80deea', tvoc: '#ffcc80',
  battPct: '#fcd34d', battBusV: '#fde68a', battCurrent: '#93c5fd',
}

const deviceOptions = computed(() => {
  const out = []
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

watch(
    deviceOptions,
    (list) => {
      if (!list.length) { selectedDeviceUid.value = ""; compareDeviceUid.value = ""; return }
      if (!selectedDeviceUid.value || !list.some(d => d.device_uid === selectedDeviceUid.value)) {
        const saved = process.client ? localStorage.getItem("airbuddy-selected-device") : null
        if (saved && list.some(d => d.device_uid === saved)) {
          selectedDeviceUid.value = saved
        } else {
          selectedDeviceUid.value = list[0].device_uid
        }
      }
      if (process.client) {
        const savedCompare = localStorage.getItem("airbuddy-compare-device")
        if (savedCompare && savedCompare !== selectedDeviceUid.value && list.some(d => d.device_uid === savedCompare)) {
          compareDeviceUid.value = savedCompare
        }
      }
    },
    { immediate: true }
)

const selectedDeviceLabel = computed(() =>
    deviceOptions.value.find(d => d.device_uid === selectedDeviceUid.value)?.label || "None"
)

// ── Chart ranges & threshold bands ──────────────────────────────────────────
const trendRangeKeys = ["15m", "30m", "1h", "3h", "6h", "12h", "24h", "36h", "50h", "72h", "5d", "7d", "30d"]

const universalRange = ref("1h")

const chartExpanded = reactive({
  eco2: false,
  temp: false,
  humidity: false,
  tvoc: false,
  battery: false,
})

const mapExpanded = ref(true)
const gpsMode = ref('location')
const packetLimit = ref(10)

const routeSliderSteps = [
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
const routeSliderIndex = ref(2) // default 1h
// Separate ref driven by debounced slider changes — prevents fetch-on-every-drag
const routeHoursFetched = ref(1)
watch(routeSliderIndex, (idx) => {
  clearTimeout(routeDebounceTimer)
  routeDebounceTimer = setTimeout(() => {
    routeHoursFetched.value = routeSliderSteps[idx].hours
  }, 400)
})

const {
  data: routeTrends,
  pending: routePending,
} = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
    hours: routeHoursFetched.value,
  })),
  watch: [selectedDeviceUid, routeHoursFetched],
  immediate: true,
})

// ── Packet panel — independent fetch & range ─────────────────────────────────
const packetRangeKeys = ["1h", "3h", "6h", "12h", "24h", "50h", "5d", "7d", "30d"]
const PACKET_RANGE_HOURS = {
  '1h': 1, '3h': 3, '6h': 6, '12h': 12, '24h': 24, '50h': 50, '5d': 120, '7d': 168, '30d': 720,
}
const packetRange = ref("24h")

const {
  data: packetTrends,
  pending: packetTrendsPending,
  refresh: refreshPacketTrends,
} = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
    hours: PACKET_RANGE_HOURS[packetRange.value] ?? 24,
  })),
  watch: [selectedDeviceUid, packetRange],
  immediate: true,
})

const packetPage = ref(0)
watch([selectedDeviceUid, packetLimit, packetRange], () => { packetPage.value = 0 })

const routeCoords = computed(() => {
  const lats = routeTrends.value?.lats ?? []
  const lons = routeTrends.value?.lons ?? []
  const timestamps = routeTrends.value?.timestamps ?? []
  const pairs = []
  for (let i = 0; i < Math.min(lats.length, lons.length); i++) {
    const lat = Number(lats[i])
    const lon = Number(lons[i])
    if (Number.isFinite(lat) && Number.isFinite(lon) && (lat !== 0 || lon !== 0)) {
      pairs.push([lat, lon, timestamps[i] ?? null])
    }
  }
  return pairs
})

const eco2ThresholdBands = [
  { label: 'Good',      from: 0,    to: 800,      color: 'rgba(34,197,94,0.10)'  },
  { label: 'OK',        from: 800,  to: 1000,     color: 'rgba(234,179,8,0.12)'  },
  { label: 'Poor',      from: 1000, to: 1400,     color: 'rgba(249,115,22,0.13)' },
  { label: 'Bad',       from: 1400, to: 2000,     color: 'rgba(239,68,68,0.13)'  },
  { label: 'Dangerous', from: 2000, to: Infinity,  color: 'rgba(185,28,28,0.16)'  },
]

const tempThresholdBands = [
  { label: 'Cold',        from: -Infinity, to: 16,       color: 'rgba(99,179,237,0.13)'  },
  { label: 'Cool',        from: 16,        to: 20,       color: 'rgba(56,189,248,0.10)'  },
  { label: 'Comfortable', from: 20,        to: 25,       color: 'rgba(34,197,94,0.10)'   },
  { label: 'Warm',        from: 25,        to: 28,       color: 'rgba(251,191,36,0.12)'  },
  { label: 'Hot',         from: 28,        to: Infinity, color: 'rgba(239,68,68,0.13)'   },
]

const humidityThresholdBands = [
  { label: 'Very Dry',    from: 0,  to: 25,       color: 'rgba(210,180,140,0.18)'  },
  { label: 'Dry',         from: 25, to: 40,       color: 'rgba(230,210,170,0.13)'  },
  { label: 'Comfortable', from: 40, to: 60,       color: 'rgba(34,197,94,0.10)'    },
  { label: 'Humid',       from: 60, to: 70,       color: 'rgba(56,189,248,0.11)'   },
  { label: 'Very Humid',  from: 70, to: Infinity, color: 'rgba(37,99,235,0.14)'    },
]

const tvocThresholdBands = [
  { label: 'Clean',    from: 0,    to: 220,      color: 'rgba(34,197,94,0.10)'   },
  { label: 'Low',      from: 220,  to: 660,      color: 'rgba(234,179,8,0.12)'   },
  { label: 'Moderate', from: 660,  to: 2200,     color: 'rgba(249,115,22,0.13)'  },
  { label: 'High',     from: 2200, to: 5500,     color: 'rgba(239,68,68,0.14)'   },
  { label: 'Danger',   from: 5500, to: Infinity, color: 'rgba(127,0,0,0.18)'     },
]

const battThresholdBands = [
  { label: 'Critical', from: 0,  to: 20,  color: 'rgba(239,68,68,0.14)'   },
  { label: 'Low',      from: 20, to: 40,  color: 'rgba(249,115,22,0.12)'  },
  { label: 'Good',     from: 40, to: 80,  color: 'rgba(234,179,8,0.10)'   },
  { label: 'Full',     from: 80, to: 100, color: 'rgba(34,197,94,0.09)'   },
]

// ── Live telemetry & trends ──────────────────────────────────────────────────
const {
  data: live,
  pending: livePending,
  error: liveError,
  refresh: refreshLive,
} = await useFetch("/api/dashboard/device-live", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({ device_uid: selectedDeviceUid.value || undefined })),
  watch: [selectedDeviceUid],
  immediate: true,
})

const RANGE_FETCH_HOURS = {
  '15m': 1, '30m': 1, '1h': 2, '3h': 4, '6h': 7, '12h': 13, '24h': 25,
  '36h': 37, '50h': 51, '72h': 73, '5d': 121, '7d': 169, '30d': 721,
}

const {
  data: trends,
  pending: trendsPending,
  error: trendsError,
  refresh: refreshTrends,
} = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
    hours: RANGE_FETCH_HOURS[universalRange.value] ?? 25,
  })),
  watch: [selectedDeviceUid, universalRange],
  immediate: true,
})

const { data: iaqTrends } = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: selectedDeviceUid.value || undefined,
    hours: 7,
  })),
  watch: [selectedDeviceUid],
  immediate: true,
})

const iaqScores = computed(() => scoresFromTrends(iaqTrends.value))
const iaqCurrentScore = computed(() => {
  const s = iaqScores.value
  return s.length ? s[s.length - 1] : null
})
const iaqLineColor = computed(() => iaqCurrentScore.value != null ? iaqColor(iaqCurrentScore.value) : '#94a3b8')
const iaqScoreLabel = computed(() => iaqCurrentScore.value != null ? calcIaqLabel(iaqCurrentScore.value) : '—')
const iaqSparkPoints = computed(() => sparklinePoints(iaqScores.value, 600, 56))
const iaqFillD = computed(() => sparklineFillPath(iaqScores.value, 600, 56))

const { data: compareTrends } = await useFetch("/api/dashboard/device-trends", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({
    device_uid: compareDeviceUid.value || undefined,
    hours: RANGE_FETCH_HOURS[universalRange.value] ?? 25,
  })),
  watch: [compareDeviceUid, universalRange],
  immediate: true,
})

const liveErrorMessage = computed(() => {
  const e = liveError.value
  return e?.data?.message || e?.message || String(e || "")
})

const trendsErrorMessage = computed(() => {
  const e = trendsError.value
  return e?.data?.message || e?.message || String(e || "")
})

const primaryDeviceName = computed(() =>
  devices.value.find(d => d.device_uid === selectedDeviceUid.value)?.device_name ?? 'Device 1'
)

const compareDeviceName = computed(() =>
  devices.value.find(d => d.device_uid === compareDeviceUid.value)?.device_name ?? 'Device 2'
)

const mergedTimestamps = computed(() => {
  const primary = trends.value?.timestamps ?? []
  if (!compareDeviceUid.value || !compareTrends.value?.timestamps?.length) return primary
  return mergeTimestamps(primary, compareTrends.value.timestamps)
})

// ── Telemetry helpers ────────────────────────────────────────────────────────
const nowMs = ref(Date.now())

function formatMetric(value, decimals = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return "--"
  return n.toFixed(decimals)
}

function formatPacketTime(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(n * 1000))
}

function formatPacketTimeShort(ts) {
  const n = Number(ts)
  if (!Number.isFinite(n)) return "—"
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date(n * 1000))
}

function formatPacketValue(value, decimals = 0, unit = "") {
  const n = Number(value)
  if (!Number.isFinite(n)) return "—"
  return `${n.toFixed(decimals)}${unit ? ` ${unit}` : ""}`
}

function aqiEmoji(aqi) {
  const n = Number(aqi)
  if (!Number.isFinite(n)) return ""
  if (n <= 1) return "😄"
  if (n <= 2) return "🙂"
  if (n <= 3) return "😐"
  if (n <= 4) return "😟"
  return "😰"
}

// ── Multi-sensor chart series ────────────────────────────────────────────────
function hasData(arr) {
  return Array.isArray(arr) && arr.some(v => v !== null && Number.isFinite(Number(v)))
}

const co2Series = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.ensEco2s)) series.push({ name: n1 + 'ENS eCO₂', color: DEVICE1_COLORS.ensEco2, values: alignSeries(mt, t.timestamps, t.ensEco2s) })
  if (hasData(t?.scdCo2s))  series.push({ name: n1 + 'SCD CO₂',  color: DEVICE1_COLORS.scdCo2,  values: alignSeries(mt, t.timestamps, t.scdCo2s) })
  if (hasCompare) {
    const c = compareTrends.value
    const n2 = compareDeviceName.value + ' '
    if (hasData(c?.ensEco2s)) series.push({ name: n2 + 'ENS eCO₂', color: DEVICE2_COLORS.ensEco2, values: alignSeries(mt, c.timestamps, c.ensEco2s) })
    if (hasData(c?.scdCo2s))  series.push({ name: n2 + 'SCD CO₂',  color: DEVICE2_COLORS.scdCo2,  values: alignSeries(mt, c.timestamps, c.scdCo2s) })
  }
  return series
})

const tempSeries = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.ahtTemps)) series.push({ name: n1 + 'AHT Temp', color: DEVICE1_COLORS.ahtTemp, values: alignSeries(mt, t.timestamps, t.ahtTemps) })
  if (hasData(t?.scdTemps)) series.push({ name: n1 + 'SCD Temp', color: DEVICE1_COLORS.scdTemp, values: alignSeries(mt, t.timestamps, t.scdTemps) })
  if (hasData(t?.rtcTemps)) series.push({ name: n1 + 'RTC Temp', color: DEVICE1_COLORS.rtcTemp, values: alignSeries(mt, t.timestamps, t.rtcTemps) })
  if (hasCompare) {
    const c = compareTrends.value
    const n2 = compareDeviceName.value + ' '
    if (hasData(c?.ahtTemps)) series.push({ name: n2 + 'AHT Temp', color: DEVICE2_COLORS.ahtTemp, values: alignSeries(mt, c.timestamps, c.ahtTemps) })
    if (hasData(c?.scdTemps)) series.push({ name: n2 + 'SCD Temp', color: DEVICE2_COLORS.scdTemp, values: alignSeries(mt, c.timestamps, c.scdTemps) })
    if (hasData(c?.rtcTemps)) series.push({ name: n2 + 'RTC Temp', color: DEVICE2_COLORS.rtcTemp, values: alignSeries(mt, c.timestamps, c.rtcTemps) })
  }
  return series
})

const humiditySeries = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.ahtHumidities)) series.push({ name: n1 + 'AHT RH', color: DEVICE1_COLORS.ahtHumidity, values: alignSeries(mt, t.timestamps, t.ahtHumidities) })
  if (hasData(t?.scdHumidities)) series.push({ name: n1 + 'SCD RH', color: DEVICE1_COLORS.scdHumidity, values: alignSeries(mt, t.timestamps, t.scdHumidities) })
  if (hasCompare) {
    const c = compareTrends.value
    const n2 = compareDeviceName.value + ' '
    if (hasData(c?.ahtHumidities)) series.push({ name: n2 + 'AHT RH', color: DEVICE2_COLORS.ahtHumidity, values: alignSeries(mt, c.timestamps, c.ahtHumidities) })
    if (hasData(c?.scdHumidities)) series.push({ name: n2 + 'SCD RH', color: DEVICE2_COLORS.scdHumidity, values: alignSeries(mt, c.timestamps, c.scdHumidities) })
  }
  return series
})

const tvocSeries = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.ensTvocs)) series.push({ name: n1 + 'TVOC', color: DEVICE1_COLORS.tvoc, values: alignSeries(mt, t.timestamps, t.ensTvocs) })
  if (hasCompare) {
    const c = compareTrends.value
    if (hasData(c?.ensTvocs)) series.push({ name: compareDeviceName.value + ' TVOC', color: DEVICE2_COLORS.tvoc, values: alignSeries(mt, c.timestamps, c.ensTvocs) })
  }
  return series
})

const battLevelSeries = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.inaBattPcts)) series.push({ name: n1 + 'Battery %',    color: DEVICE1_COLORS.battPct,  values: alignSeries(mt, t.timestamps, t.inaBattPcts) })
  if (hasData(t?.inaBusVs)) {
    const scaled = t.inaBusVs.map(v => v == null ? null : +Math.max(0, Math.min(100, (v - 3.30) / (4.20 - 3.30) * 100)).toFixed(1))
    series.push({ name: n1 + 'Bus V (scaled)', color: DEVICE1_COLORS.battBusV, values: alignSeries(mt, t.timestamps, scaled) })
  }
  if (hasCompare) {
    const c = compareTrends.value
    const n2 = compareDeviceName.value + ' '
    if (hasData(c?.inaBattPcts)) series.push({ name: n2 + 'Battery %',    color: DEVICE2_COLORS.battPct,  values: alignSeries(mt, c.timestamps, c.inaBattPcts) })
    if (hasData(c?.inaBusVs)) {
      const scaled = c.inaBusVs.map(v => v == null ? null : +Math.max(0, Math.min(100, (v - 3.30) / (4.20 - 3.30) * 100)).toFixed(1))
      series.push({ name: n2 + 'Bus V (scaled)', color: DEVICE2_COLORS.battBusV, values: alignSeries(mt, c.timestamps, scaled) })
    }
  }
  return series
})

const battCurrentSeries = computed(() => {
  const series = []
  const t = trends.value
  const mt = mergedTimestamps.value
  const hasCompare = !!compareDeviceUid.value && !!compareTrends.value?.timestamps?.length
  const n1 = hasCompare ? primaryDeviceName.value + ' ' : ''
  if (hasData(t?.inaCurrentMas)) series.push({ name: n1 + 'Current (mA)', color: DEVICE1_COLORS.battCurrent, values: alignSeries(mt, t.timestamps, t.inaCurrentMas) })
  if (hasCompare) {
    const c = compareTrends.value
    if (hasData(c?.inaCurrentMas)) series.push({ name: compareDeviceName.value + ' Current (mA)', color: DEVICE2_COLORS.battCurrent, values: alignSeries(mt, c.timestamps, c.inaCurrentMas) })
  }
  return series
})

const allPackets = computed(() => {
  const d             = packetTrends.value
  const telemetryIds  = Array.isArray(d?.telemetryIds)   ? d.telemetryIds  : []
  const ts            = Array.isArray(d?.timestamps)      ? d.timestamps    : []
  const ensEco2s      = Array.isArray(d?.ensEco2s)        ? d.ensEco2s      : []
  const scdCo2s       = Array.isArray(d?.scdCo2s)         ? d.scdCo2s       : []
  const ahtTemps      = Array.isArray(d?.ahtTemps)        ? d.ahtTemps      : []
  const scdTemps      = Array.isArray(d?.scdTemps)        ? d.scdTemps      : []
  const rtcTemps      = Array.isArray(d?.rtcTemps)        ? d.rtcTemps      : []
  const ahtHumidities = Array.isArray(d?.ahtHumidities)   ? d.ahtHumidities : []
  const scdHumidities = Array.isArray(d?.scdHumidities)   ? d.scdHumidities : []
  const ensTvocs      = Array.isArray(d?.ensTvocs)        ? d.ensTvocs      : []
  const inaBusVs      = Array.isArray(d?.inaBusVs)        ? d.inaBusVs      : []
  const inaCurrentMas = Array.isArray(d?.inaCurrentMas)   ? d.inaCurrentMas : []
  const inaPowerMws   = Array.isArray(d?.inaPowerMws)     ? d.inaPowerMws   : []
  const inaBattPcts   = Array.isArray(d?.inaBattPcts)     ? d.inaBattPcts   : []
  const lats          = Array.isArray(d?.lats)            ? d.lats          : []
  const lons          = Array.isArray(d?.lons)            ? d.lons          : []

  return ts
      .map((t, i) => ({
        ts:             Number(t) || i,
        telemetryId:    telemetryIds[i] ?? null,
        timeLabel:      formatPacketTime(t),
        timeLabelShort: formatPacketTimeShort(t),
        ensEco2:        formatPacketValue(ensEco2s[i],  0, "ppm"),
        scdCo2:         formatPacketValue(scdCo2s[i],   0, "ppm"),
        ahtTemp:        formatPacketValue(ahtTemps[i],  1, "°C"),
        scdTemp:        formatPacketValue(scdTemps[i],  1, "°C"),
        rtcTemp:        formatPacketValue(rtcTemps[i],  1, "°C"),
        tvoc:           formatPacketValue(ensTvocs[i],  0, "ppb"),
        raw: {
          ensEco2:      ensEco2s[i]      ?? null,
          scdCo2:       scdCo2s[i]       ?? null,
          ahtTemp:      ahtTemps[i]      ?? null,
          scdTemp:      scdTemps[i]      ?? null,
          rtcTemp:      rtcTemps[i]      ?? null,
          tvoc:         ensTvocs[i]      ?? null,
          ahtHumidity:  ahtHumidities[i] ?? null,
          scdHumidity:  scdHumidities[i] ?? null,
          inaBusV:      inaBusVs[i]      ?? null,
          inaCurrentMa: inaCurrentMas[i] ?? null,
          inaPowerMw:   inaPowerMws[i]   ?? null,
          inaBattPct:   inaBattPcts[i]   ?? null,
          lat:          lats[i]          ?? null,
          lon:          lons[i]          ?? null,
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

// ── Packet detail modal ──────────────────────────────────────────────────────
const packetModalOpen = ref(false)
const activePacket = ref(null)
const deletePending = ref(false)
const deleteError = ref("")
const deleteSuccess = ref(false)

function openPacketModal(pkt) {
  activePacket.value = pkt
  packetModalOpen.value = true
  deletePending.value = false
  deleteError.value = ""
  deleteSuccess.value = false
}

function closePacketModal() {
  packetModalOpen.value = false
  activePacket.value = null
  deletePending.value = false
  deleteError.value = ""
  deleteSuccess.value = false
}

async function deleteTelemetryReading() {
  if (!activePacket.value?.telemetryId) return
  try {
    deletePending.value = true
    deleteError.value = ""
    await $fetch(`/api/dashboard/telemetry/${activePacket.value.telemetryId}`, {
      method: "DELETE",
      credentials: "include",
    })
    deleteSuccess.value = true
    closePacketModal()
    await refreshTrends()
  } catch (e) {
    deleteError.value = e?.data?.message || e?.message || "Could not delete reading."
  } finally {
    deletePending.value = false
  }
}

// ── Packet multi-select & bulk delete ────────────────────────────────────────
const selectedPacketIds = ref(new Set())
const bulkDeletePending = ref(false)
const bulkDeleteError = ref("")
const selectAllCheckbox = ref(null)

const selectedCount = computed(() => selectedPacketIds.value.size)

const allPageSelected = computed(() =>
  paginatedPackets.value.length > 0 &&
  paginatedPackets.value.filter(p => p.telemetryId).every(p => selectedPacketIds.value.has(p.telemetryId))
)

const somePageSelected = computed(() =>
  paginatedPackets.value.some(p => p.telemetryId && selectedPacketIds.value.has(p.telemetryId))
)

watchEffect(() => {
  if (selectAllCheckbox.value) {
    selectAllCheckbox.value.indeterminate = somePageSelected.value && !allPageSelected.value
  }
})

watch([selectedDeviceUid, packetRange], () => { selectedPacketIds.value = new Set() })

function togglePacket(id) {
  if (!id) return
  const s = new Set(selectedPacketIds.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  selectedPacketIds.value = s
}

function toggleSelectAll() {
  if (allPageSelected.value) {
    const s = new Set(selectedPacketIds.value)
    paginatedPackets.value.forEach(p => { if (p.telemetryId) s.delete(p.telemetryId) })
    selectedPacketIds.value = s
  } else {
    const s = new Set(selectedPacketIds.value)
    paginatedPackets.value.forEach(p => { if (p.telemetryId) s.add(p.telemetryId) })
    selectedPacketIds.value = s
  }
}

function clearSelection() {
  selectedPacketIds.value = new Set()
  bulkDeleteError.value = ""
}

// Hide the checkbox column behind a "Manage Telemetry" toggle so the default
// view stays read-only and uncluttered. Exiting manage mode drops any selection.
const packetsManageMode = ref(false)
function toggleManageMode() {
  packetsManageMode.value = !packetsManageMode.value
  if (!packetsManageMode.value) clearSelection()
}

async function deleteSelectedPackets() {
  const ids = [...selectedPacketIds.value]
  if (!ids.length) return
  if (!window.confirm(`Delete ${ids.length} reading${ids.length !== 1 ? 's' : ''}? This cannot be undone.`)) return

  bulkDeletePending.value = true
  bulkDeleteError.value = ""
  let errors = 0

  for (const id of ids) {
    try {
      await $fetch(`/api/dashboard/telemetry/${id}`, { method: "DELETE", credentials: "include" })
    } catch {
      errors++
    }
  }

  bulkDeletePending.value = false
  selectedPacketIds.value = new Set()
  if (errors > 0) {
    bulkDeleteError.value = `${errors} reading${errors !== 1 ? 's' : ''} could not be deleted.`
  }
  await refreshPacketTrends()
}

// ── Add Device form ──────────────────────────────────────────────────────────
const form = reactive({
  device_name: "",
  home_mode: "new",
  home_id: "",
  new_home_name: "",
  room_mode: "new",
  room_id: "",
  new_room_name: "",
})

const selectedHome = computed(() => {
  if (!form.home_id) return null
  return homes.value.find(h => String(h.home_id) === String(form.home_id)) || null
})

const selectedHomeRooms = computed(() => selectedHome.value?.rooms || [])

watch(
    () => homes.value.length,
    (count) => {
      if (count > 0 && form.home_mode === "new" && !form.new_home_name) {
        form.home_mode = "existing"
        form.home_id = String(homes.value[0].home_id)
      }
    },
    { immediate: true }
)

watch(
    () => form.home_id,
    () => {
      form.room_id = ""
      if (selectedHomeRooms.value.length > 0 && form.room_mode === "existing") {
        form.room_id = String(selectedHomeRooms.value[0].room_id)
      }
    }
)

const submitPending = ref(false)
const submitMessage = ref("")
const submitError = ref("")

const addDeviceModalOpen = ref(false)
const deviceModalOpen = ref(false)
const activeDevice = ref(null)
const deviceKeyValue = ref("")
const deviceKeyError = ref("")
const deviceKeyMessage = ref("")
const showDeviceKey = ref(false)
const resetPending = ref(false)
const copyPending = ref(false)
const renamingDevice = ref(false)
const renameValue = ref("")
const renamePending = ref(false)
const renameError = ref("")
const uidCopied = ref(false)

async function openAddDeviceModal() {
  addDeviceModalOpen.value = true
  submitMessage.value = ""
  submitError.value = ""
  nextDeviceUid.value = ""
  try {
    const res = await $fetch("/api/devices/next-uid", { credentials: "include" })
    nextDeviceUid.value = res?.next_device_uid || ""
  } catch (e) {
    console.error("[add-device] next-uid fetch failed:", e)
    submitError.value = e?.data?.message || e?.message || "Could not fetch next device ID. Please try again."
  }
}

function closeAddDeviceModal() {
  addDeviceModalOpen.value = false
  submitMessage.value = ""
  submitError.value = ""
  form.device_name = ""
  form.new_room_name = ""
  form.room_id = ""
}

async function submitDevice() {
  submitMessage.value = ""
  submitError.value = ""

  const payload = {
    device_uid: nextDeviceUid.value,
    device_name: form.device_name,
    home_mode: form.home_mode,
    home_id: form.home_mode === "existing" ? form.home_id : null,
    new_home_name: form.home_mode === "new" ? form.new_home_name : null,
    room_mode: form.room_mode,
    room_id: form.room_mode === "existing" ? form.room_id : null,
    new_room_name: form.room_mode === "new" ? form.new_room_name : null,
  }

  if (payload.home_mode === "new" && !payload.new_home_name) { submitError.value = "Please enter a new home name."; return }
  if (payload.home_mode === "existing" && !payload.home_id) { submitError.value = "Please choose a home."; return }
  if (payload.room_mode === "new" && !payload.new_room_name) { submitError.value = "Please enter a new room name."; return }
  if (payload.room_mode === "existing" && !payload.room_id) { submitError.value = "Please choose a room."; return }

  try {
    submitPending.value = true
    const res = await $fetch("/api/devices/register", { method: "POST", credentials: "include", body: payload })
    submitMessage.value = res?.message || "Device added successfully."
    await refreshBootstrap()
    await refreshDevices()
    closeAddDeviceModal()
    if (res?.device) {
      openDeviceModal({
        ...res.device,
        device_name: payload.device_name || payload.device_uid,
        home_name: resolveHomeNameAfterSubmit(payload),
        room_name: resolveRoomNameAfterSubmit(payload),
        status: "active",
      })
      deviceKeyValue.value = res?.device_key || ""
      deviceKeyMessage.value = res?.device_key ? "New device key generated. Save it now." : ""
      showDeviceKey.value = false
    }
  } catch (e) {
    submitError.value = e?.data?.message || e?.message || "Could not add device."
  } finally {
    submitPending.value = false
  }
}

function resolveHomeNameAfterSubmit(payload) {
  if (payload.home_mode === "new") return payload.new_home_name || "—"
  return homes.value.find(h => String(h.home_id) === String(payload.home_id))?.home_name || "—"
}

function resolveRoomNameAfterSubmit(payload) {
  if (payload.room_mode === "new") return payload.new_room_name || "—"
  return selectedHomeRooms.value.find(r => String(r.room_id) === String(payload.room_id))?.room_name || "—"
}

function selectDevice(device) {
  selectedDeviceUid.value = device.device_uid
  if (process.client) localStorage.setItem("airbuddy-selected-device", device.device_uid)
}

function selectCompareDevice(device) {
  if (compareDeviceUid.value === device.device_uid) {
    compareDeviceUid.value = ""
    if (process.client) localStorage.removeItem("airbuddy-compare-device")
    return
  }
  if (device.device_uid === selectedDeviceUid.value) return
  compareDeviceUid.value = device.device_uid
  if (process.client) localStorage.setItem("airbuddy-compare-device", device.device_uid)
}

watch(selectedDeviceUid, (uid) => {
  if (uid && uid === compareDeviceUid.value) {
    compareDeviceUid.value = ""
    if (process.client) localStorage.removeItem("airbuddy-compare-device")
  }
})

function openDeviceModal(device) {
  activeDevice.value = device
  deviceModalOpen.value = true
  deviceKeyError.value = ""
  deviceKeyMessage.value = ""
  showDeviceKey.value = false
  copyPending.value = false
  resetPending.value = false
  renamingDevice.value = false
  renameError.value = ""
  uidCopied.value = false
}

function closeDeviceModal() {
  deviceModalOpen.value = false
  activeDevice.value = null
  deviceKeyValue.value = ""
  deviceKeyError.value = ""
  deviceKeyMessage.value = ""
  showDeviceKey.value = false
  copyPending.value = false
  resetPending.value = false
  renamingDevice.value = false
  renameError.value = ""
  uidCopied.value = false
}

function startRename() {
  renameValue.value = activeDevice.value?.device_name || ""
  renamingDevice.value = true
  renameError.value = ""
}

function cancelRename() {
  renamingDevice.value = false
  renameError.value = ""
}

async function saveDeviceName() {
  if (!activeDevice.value?.device_id) return
  const newName = renameValue.value.trim()
  if (!newName) { renameError.value = "Name cannot be empty."; return }
  try {
    renamePending.value = true
    renameError.value = ""
    await $fetch(`/api/devices/${activeDevice.value.device_id}/rename`, {
      method: "POST",
      credentials: "include",
      body: { device_name: newName },
    })
    activeDevice.value = { ...activeDevice.value, device_name: newName }
    renamingDevice.value = false
    await refreshDevices()
  } catch (e) {
    renameError.value = e?.data?.message || e?.message || "Could not rename device."
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
  } catch (e) {}
}

// ── Device activity indicator ────────────────────────────────────────────────
function isDeviceRecent(device) {
  // Prefer last_seen from the device record (requires backend to return it)
  if (device.last_seen) {
    return Date.now() - new Date(device.last_seen).getTime() < 5 * 60 * 1000
  }
  // Fallback: use live data for the currently-selected device
  if (device.device_uid === selectedDeviceUid.value && live.value?.received_at) {
    return Date.now() - new Date(live.value.received_at).getTime() < 5 * 60 * 1000
  }
  return false
}

// ── Set Device Location modal ────────────────────────────────────────────────
const locationModalOpen = ref(false)
const manualLat = ref("")
const manualLon = ref("")
const locationSavePending = ref(false)
const locationSaveError = ref("")
const locationSaveOk = ref(false)

function openLocationModal() {
  locationModalOpen.value = true
  locationSaveError.value = ""
  locationSaveOk.value = false
  manualLat.value = live.value?.last_gps_lat != null ? String(live.value.last_gps_lat) : ""
  manualLon.value = live.value?.last_gps_lon != null ? String(live.value.last_gps_lon) : ""
}

function closeLocationModal() {
  locationModalOpen.value = false
  locationSaveError.value = ""
  locationSaveOk.value = false
}

async function saveDeviceLocation() {
  const device = devices.value.find(d => d.device_uid === selectedDeviceUid.value)
  if (!device?.device_id) return
  const lat = Number(manualLat.value)
  const lon = Number(manualLon.value)
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    locationSaveError.value = "Invalid latitude — must be between −90 and 90."
    return
  }
  if (!Number.isFinite(lon) || lon < -180 || lon > 180) {
    locationSaveError.value = "Invalid longitude — must be between −180 and 180."
    return
  }
  try {
    locationSavePending.value = true
    locationSaveError.value = ""
    await $fetch(`/api/devices/${device.device_id}/set-location`, {
      method: "POST",
      credentials: "include",
      body: { lat, lon },
    })
    locationSaveOk.value = true
    await refreshLive()
    setTimeout(() => closeLocationModal(), 1200)
  } catch (e) {
    locationSaveError.value = e?.data?.message || e?.message || "Could not set location."
  } finally {
    locationSavePending.value = false
  }
}

function toggleShowKey() {
  showDeviceKey.value = !showDeviceKey.value
}

async function copyDeviceKey() {
  if (!deviceKeyValue.value) return
  try {
    copyPending.value = true
    deviceKeyError.value = ""
    await navigator.clipboard.writeText(deviceKeyValue.value)
    deviceKeyMessage.value = "Device key copied."
  } catch (e) {
    deviceKeyError.value = "Could not copy device key."
  } finally {
    copyPending.value = false
  }
}

async function resetDeviceKey() {
  if (!activeDevice.value?.device_id) return
  try {
    resetPending.value = true
    deviceKeyError.value = ""
    deviceKeyMessage.value = ""
    const res = await $fetch(`/api/devices/${activeDevice.value.device_id}/reset-key`, {
      method: "POST",
      credentials: "include",
    })
    deviceKeyValue.value = res?.device_key || ""
    showDeviceKey.value = false
    deviceKeyMessage.value = res?.message || "Device key reset successfully."
    await refreshDevices()
  } catch (e) {
    deviceKeyError.value = e?.data?.message || e?.message || "Could not reset device key."
  } finally {
    resetPending.value = false
  }
}

async function logout() {
  try {
    logoutPending.value = true
    await $fetch("/api/auth/logout", { method: "POST", credentials: "include" })
    await refreshMe()
    await router.push("/")
  } catch (e) {
    console.error("logout failed:", e)
  } finally {
    logoutPending.value = false
  }
}

function pretty(v) {
  return JSON.stringify(v ?? null, null, 2)
}
</script>

<style scoped>
/* ── CSS vars / theme ───────────────────────────────────────────────────────── */
.wrap {
  --bg: #f7f8fb;
  --panel: rgba(0, 0, 0, 0.04);
  --panel-strong: rgba(0, 0, 0, 0.06);
  --border: rgba(0, 0, 0, 0.10);
  --text: #111827;
  --muted: rgba(17, 24, 39, 0.72);
  --btn-bg: rgba(0, 0, 0, 0.04);
  --btn-hover: rgba(0, 0, 0, 0.07);
  --input-bg: #ffffff;
  --tableHead: rgba(0, 0, 0, 0.04);
  --tableRow: rgba(0, 0, 0, 0.02);
  --card-bg: rgba(255, 255, 255, 0.55);
  --card-hover: rgba(255, 255, 255, 0.82);
  --divider: rgba(0, 0, 0, 0.08);
  --pre-bg: rgba(0, 0, 0, 0.06);

  max-width: 980px;
  margin: 0 auto;
  padding: 28px 18px 60px;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, "Helvetica Neue", Arial, "Noto Sans";
  color: var(--text);
  background: var(--bg);
}

.wrap[data-theme="dark"] {
  --bg: #061327;
  --panel: rgba(255, 255, 255, 0.055);
  --panel-strong: rgba(255, 255, 255, 0.08);
  --border: rgba(255, 255, 255, 0.12);
  --text: #eef2f7;
  --muted: rgba(238, 242, 247, 0.72);
  --btn-bg: rgba(255, 255, 255, 0.06);
  --btn-hover: rgba(255, 255, 255, 0.12);
  --input-bg: rgba(255, 255, 255, 0.08);
  --tableHead: rgba(255, 255, 255, 0.06);
  --tableRow: rgba(255, 255, 255, 0.025);
  --card-bg: rgba(255, 255, 255, 0.04);
  --card-hover: rgba(255, 255, 255, 0.08);
  --divider: rgba(255, 255, 255, 0.09);
  --pre-bg: rgba(255, 255, 255, 0.06);
}

/* ── Layout ──────────────────────────────────────────────────────────────────── */
.header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btns {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
  align-items: center;
}

.btnGroup {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sectionHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

/* ── Buttons ────────────────────────────────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 38px;
  padding: 8px 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  text-decoration: none;
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.btn:hover {
  background: var(--btn-hover);
}

.btn.primary {
  background: #1f7a3a;
  color: white;
  border-color: #1f7a3a;
}

.btn.danger {
  border-color: rgba(180, 35, 24, 0.35);
}

.btnGithub {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.githubIcon {
  width: 15px;
  height: 15px;
  flex-shrink: 0;
}

.iconBtn {
  min-width: 40px;
  padding: 8px 10px;
  font-size: 18px;
  line-height: 1;
}

.abIconLink {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  padding: 4px;
  transition: opacity 0.15s ease;
  flex-shrink: 0;
}

.abIconLink:hover {
  opacity: 0.75;
}

.abIcon {
  width: 36px;
  height: 36px;
  display: block;
}

.abIconMobile {
  display: block;
}

.abLogoDesktop {
  display: none;
}

.abLogo {
  height: 36px;
  width: auto;
}

@media (min-width: 641px) {
  .abIconMobile {
    display: none;
  }
  .abLogoDesktop {
    display: block;
  }
}

/* ── Cards ──────────────────────────────────────────────────────────────────── */
.card {
  margin-top: 14px;
  padding: 16px;
  border-radius: 16px;
  background: var(--panel);
  border: 1px solid var(--border);
  overflow: hidden;
}

.card h2 {
  margin: 0 0 10px;
  font-size: 18px;
}

/* ── Utility ────────────────────────────────────────────────────────────────── */
.muted {
  color: var(--muted);
}

.tiny {
  font-size: 12px;
}

.error {
  color: #d96767;
}

pre {
  margin: 10px 0 0;
  padding: 12px;
  border-radius: 12px;
  background: var(--pre-bg);
  overflow: auto;
  font-size: 12px;
  line-height: 1.45;
}

/* ── Device selector for charts ─────────────────────────────────────────────── */
.selectorBlock {
  display: grid;
  gap: 8px;
  margin-top: 8px;
}

.select {
  width: 100%;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  padding: 10px 12px;
  font: inherit;
}

/* ── Charts panel ────────────────────────────────────────────────────────────── */
.chartsPanel {
  padding: 16px 16px 12px;
}

.chartsPanelHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.chartsPanelTitle {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.88;
}

.chartSubCards {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chartSubCard {
  border-top: 1px solid var(--border);
  padding-top: 16px;
}

.chartSubCard:first-child {
  border-top: none;
  padding-top: 0;
}

.chartCardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.expandBtn {
  min-width: 32px;
  font-size: 15px;
  padding: 5px 9px;
}

.chartCardTitle {
  font-size: 15px;
  font-weight: 600;
  opacity: 0.88;
}

.chartEmpty {
  padding: 24px 0;
}

.rangeBar {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.rangeBtn {
  min-height: 32px;
  padding: 5px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--text);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.rangeBtn:hover {
  background: var(--btn-hover);
}

.rangeBtn.active {
  background: var(--panel-strong);
  border-color: rgba(49, 130, 206, 0.45);
  box-shadow: inset 0 0 0 1px rgba(49, 130, 206, 0.2);
}

/* ── Location panel ─────────────────────────────────────────────────────────── */
.mapControls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapWrapper {
  position: relative;
}

.mapLoadingOverlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.22);
  border-radius: 12px;
  z-index: 10;
  color: #fff;
  backdrop-filter: blur(2px);
  pointer-events: none;
}

.mapFade-enter-active,
.mapFade-leave-active {
  transition: opacity 0.3s ease;
}
.mapFade-enter-from,
.mapFade-leave-to {
  opacity: 0;
}

.locationStale {
  font-style: italic;
  opacity: 0.7;
}

/* ── Route slider ────────────────────────────────────────────────────────────── */
.routeSliderWrap {
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  opacity: 0.5;
  transition: opacity 0.2s ease;
}

.routeSliderWrap.routeSliderActive {
  opacity: 1;
}

.routeSliderHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.routeSliderValue {
  font-size: 13px;
  font-weight: 600;
  min-width: 32px;
}

.routeSliderInput {
  width: 100%;
  accent-color: #3b82f6;
  cursor: pointer;
  height: 4px;
}

.routeSliderTicks {
  display: flex;
  justify-content: space-between;
  margin-top: 5px;
  padding: 0 2px;
}

.locationMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 10px;
  padding: 0 2px;
}

.locationCoord {
  white-space: nowrap;
}

/* ── Latest packets ─────────────────────────────────────────────────────────── */
.packetHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.packetHead h2 {
  margin: 0 0 2px;
  font-size: 18px;
}

.packetControls {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 5px;
}

.packetTime {
  white-space: nowrap;
  font-size: 12px;
  cursor: default;
}

.packetCoord {
  font-size: 11px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
  white-space: nowrap;
  color: var(--muted);
}

.paginationBar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 10px 0 2px;
  flex-wrap: wrap;
}

.paginationInfo {
  min-width: 60px;
  text-align: center;
}

.paginationLimit {
  margin-left: 6px;
  border-left: 1px solid var(--border);
  padding-left: 10px;
}

.checkCell {
  width: 36px;
  padding: 6px 10px !important;
  text-align: center;
  display: none;                 /* hidden by default — read-only view */
}

.packetTable.packets-manage-mode .checkCell {
  display: table-cell;           /* revealed only while managing telemetry */
}

.packetTable tbody tr.selectedRow {
  background: rgba(49, 130, 206, 0.09) !important;
}

.wrap[data-theme="dark"] .packetTable tbody tr.selectedRow {
  background: rgba(59, 130, 246, 0.14) !important;
}

.bulkActions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px 2px;
  flex-wrap: wrap;
}

.bulkErrMsg {
  padding: 4px 8px;
  border-radius: 8px;
  background: rgba(180, 35, 24, 0.08);
  color: #b00;
}

.packetGearCell {
  padding: 6px 8px !important;
  text-align: center;
}

.packetGearBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  cursor: pointer;
  font-size: 13px;
  line-height: 1;
  opacity: 0.6;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.packetGearBtn:hover {
  opacity: 1;
  background: var(--btn-hover);
}

/* ── Packet detail modal ─────────────────────────────────────────────────────── */
.pktDetailGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
}

.pktDetailSection {
  display: grid;
  gap: 6px;
}

.pktDetailHead {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  opacity: 0.55;
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border);
}

.pktDetailRow {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 13px;
}

.pktDetailRow span:first-child {
  color: var(--muted);
}

.packetTableWrap {
  overflow-x: auto;
  border: 1px solid var(--border);
  border-radius: 12px;
}

.packetTable {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.packetTable thead th {
  text-align: left;
  padding: 10px 12px;
  background: var(--tableHead);
  color: var(--text);
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.packetTable tbody td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}

.packetTable tbody tr:nth-child(even) {
  background: var(--tableRow);
}

.packetTable tbody tr:last-child td {
  border-bottom: none;
}

/* ── AQI banner ──────────────────────────────────────────────────────────────── */
.aqiBanner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  margin-bottom: 2px;
}

.aqiBannerEmoji {
  font-size: 28px;
  line-height: 1;
}

.aqiBannerLabel {
  font-size: 15px;
  font-weight: 600;
}

/* ── Latest telemetry metrics ────────────────────────────────────────────────── */
.metricsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 14px;
  margin-top: 12px;
}

.meta {
  display: grid;
  gap: 6px;
  margin-top: 14px;
}

/* ── Session panel ──────────────────────────────────────────────────────────── */
.sessionGrid {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.sessionField {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.sessionEmoji {
  font-size: 2rem;
  line-height: 1;
}

.sessionLabel {
  font-weight: 600;
  min-width: 100px;
  font-size: 13px;
}

.sessionDivider {
  height: 1px;
  background: var(--divider);
  margin: 4px 0;
}

.sessionRaw summary {
  cursor: pointer;
  user-select: none;
  padding: 4px 0;
}

/* ── Account panel ──────────────────────────────────────────────────────────── */
.accountGrid {
  display: grid;
  gap: 8px;
  margin-top: 10px;
}

.accountField {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.accountEmoji {
  font-size: 2rem;
  line-height: 1;
}

.accountLabel {
  font-weight: 600;
  min-width: 100px;
  font-size: 13px;
  flex-shrink: 0;
}

.accountDivider {
  height: 1px;
  background: var(--divider);
  margin: 4px 0;
}

/* ── Device + home grids ────────────────────────────────────────────────────── */
.homeList,
.deviceGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.homeCard,
.deviceCard {
  padding: 12px;
  border-radius: 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
}

.deviceCard {
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}

.deviceCard:hover {
  background: var(--card-hover);
}

.deviceCard.selected {
  border-color: rgba(49, 130, 206, 0.55);
  box-shadow: 0 0 0 2px rgba(49, 130, 206, 0.18);
}

.deviceCard.compare {
  border-color: rgba(13, 148, 136, 0.55);
  box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.18);
}

.compareBtn {
  margin-top: 8px;
  width: 100%;
  min-height: 28px;
  padding: 4px 10px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  color: var(--muted);
  font: inherit;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}

.compareBtn:hover {
  background: var(--btn-hover);
  color: var(--text);
}

.compareBtn.compareActive {
  border-color: rgba(13, 148, 136, 0.55);
  color: rgba(13, 148, 136, 0.9);
  background: rgba(13, 148, 136, 0.08);
}

.deviceCardHeader {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
}

.deviceCardActions {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
}

.deviceAqiEmoji {
  font-size: 16px;
  line-height: 1;
  cursor: default;
}

.deviceCardSettings {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--btn-bg);
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0.65;
  transition: opacity 0.15s ease, background 0.15s ease;
}

.deviceCardSettings:hover {
  opacity: 1;
  background: var(--btn-hover);
}

.deviceCardTitle,
.homeTitle {
  font-weight: 700;
}

.roomList {
  margin: 8px 0 0 18px;
  padding: 0;
}

.unassigned {
  margin-top: 10px;
}

/* ── Add-device form ────────────────────────────────────────────────────────── */
.uidPreview {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  background: var(--pre-bg);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.03em;
}

.deviceForm {
  display: grid;
  gap: 16px;
}

.formRow {
  display: grid;
  gap: 8px;
}

.label {
  font-size: 13px;
  font-weight: 600;
}

.input {
  width: 100%;
  min-height: 42px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--input-bg);
  color: var(--text);
  padding: 10px 12px;
  font: inherit;
}

.keyInput {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.modeRow {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.divider {
  height: 1px;
  background: var(--divider);
}

.actions {
  display: flex;
  justify-content: flex-start;
}

.message {
  padding: 10px 12px;
  border-radius: 12px;
  font-size: 14px;
}

.okMsg {
  background: rgba(31, 122, 58, 0.08);
  color: #1f7a3a;
}

.errMsg {
  background: rgba(180, 35, 24, 0.08);
  color: #b00;
}

/* ── Status dot ─────────────────────────────────────────────────────────────── */
.statusDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  flex-shrink: 0;
  display: inline-block;
}

.statusDotActive {
  background: #22c55e;
  box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45);
  animation: dotPulse 2.2s ease-in-out infinite;
}

@keyframes dotPulse {
  0%   { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.45); }
  65%  { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}

/* ── Device detail modal ────────────────────────────────────────────────────── */
.modalTitleBlock {
  display: grid;
  gap: 4px;
}

.modalTitleRow {
  display: flex;
  align-items: center;
  gap: 8px;
}

.editableTitle {
  cursor: text;
  transition: color 0.15s ease;
  display: inline-block;
  font-size: 1.25rem;
  font-weight: 700;
}

.editableTitle:hover {
  color: #3b82f6;
}

.locationModalNote {
  line-height: 1.6;
}

.renameRow {
  display: flex;
  align-items: center;
  gap: 6px;
}

.renameInput {
  min-height: 36px;
  padding: 6px 10px;
  font-size: 15px;
  font-weight: 600;
}

.iconBtnSm {
  min-height: 32px;
  padding: 4px 10px;
  font-size: 14px;
}

.renameErr {
  font-size: 12px;
  padding: 6px 10px;
}

.deviceUidRow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.deviceUidCode {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace;
  font-size: 13px;
  background: var(--pre-bg);
  padding: 2px 7px;
  border-radius: 6px;
  letter-spacing: 0.02em;
}

.copyUidBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: transparent;
  cursor: pointer;
  font-size: 13px;
  opacity: 0.55;
  color: inherit;
  transition: opacity 0.15s ease, background 0.15s ease;
  flex-shrink: 0;
}

.copyUidBtn:hover {
  opacity: 1;
  background: var(--btn-hover);
}

.keyBlock {
  display: grid;
  gap: 8px;
}

.keyRow {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 8px;
  align-items: center;
}

.modalBackdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 1000;
}

.modalCard {
  width: min(100%, 680px);
  border-radius: 18px;
  background: var(--input-bg);
  border: 1px solid var(--border);
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.18);
  overflow: hidden;
  max-height: 90vh;
  overflow-y: auto;
}

.modalHeader {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}

.modalTitle {
  margin: 0 0 4px;
}

.modalBody {
  display: grid;
  gap: 16px;
  padding: 16px;
}

.deviceMeta {
  display: grid;
  gap: 6px;
}

/* ── IAQ strip ───────────────────────────────────────────────────────────────── */
.iaqStrip {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  background: var(--card-bg, rgba(0,0,0,0.04));
  border: 1px solid var(--border, rgba(0,0,0,0.08));
}
[data-theme="dark"] .iaqStrip {
  background: rgba(255,255,255,0.04);
  border-color: rgba(255,255,255,0.08);
}
.iaqStripLeft {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 6rem;
  flex-shrink: 0;
}
.iaqStripScore {
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.iaqStripLabel {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary, #64748b);
  margin-top: 0.2rem;
}
.iaqStripSub {
  font-size: 0.68rem;
  color: var(--text-muted, #94a3b8);
  margin-top: 0.1rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.iaqStripChart {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
}
.iaqSparkSvg {
  width: 100%;
  height: 56px;
  display: block;
  overflow: visible;
}

/* ── Responsive ─────────────────────────────────────────────────────────────── */
@media (max-width: 640px) {
  .header {
    flex-wrap: wrap;
  }

  .sectionHeader,
  .modalHeader {
    flex-direction: column;
  }

  .keyRow {
    grid-template-columns: 1fr;
  }

  .packetHead {
    align-items: flex-start;
    flex-direction: column;
  }

  .rangeBar {
    justify-content: flex-start;
  }

  .chartsPanel {
    padding: 12px 12px 8px;
  }

  .chartsPanelHead {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>

<style>
html, body {
  margin: 0;
  padding: 0;
}

html[data-airbuddy-theme="light"],
html[data-airbuddy-theme="light"] body {
  background: #f7f8fb;
}

html[data-airbuddy-theme="dark"],
html[data-airbuddy-theme="dark"] body {
  background: #061327;
}
</style>
