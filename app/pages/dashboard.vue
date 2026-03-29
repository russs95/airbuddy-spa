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
        <a class="btn btnGithub" href="https://github.com/russs95/airbuddy_v2" target="_blank" rel="noopener">
          <svg class="githubIcon" viewBox="0 0 16 16" aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Build
        </a>
        <a v-if="!me?.ok" class="btn" href="/api/auth/login">Login</a>
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
        <button
            v-for="device in devices"
            :key="device.device_id"
            class="deviceCard"
            type="button"
            @click="openDeviceModal(device)"
        >
          <div class="deviceCardTitle">
            {{ device.device_name || device.device_uid }}
          </div>
          <div class="muted tiny">{{ device.device_uid }}</div>
          <div class="muted tiny">
            {{ device.home_name || "No home" }}<span v-if="device.room_name"> · {{ device.room_name }}</span>
          </div>
          <div class="muted tiny">
            Status: {{ device.status || "—" }}
          </div>
        </button>
      </div>
    </section>

    <!-- Telemetry — device selector + charts -->
    <section v-if="me?.ok" class="card">
      <h2>Telemetry</h2>

      <div v-if="bootstrapPending" class="muted">Loading devices…</div>

      <div v-else-if="bootstrapError" class="error">
        Could not load your devices: {{ bootstrapErrorMessage }}
      </div>

      <div v-else-if="!deviceOptions.length" class="muted">
        No registered devices yet. Add one above.
      </div>

      <div v-else class="selectorBlock">
        <label class="tiny muted" for="chart-device-select">Choose device</label>
        <select id="chart-device-select" v-model="selectedDeviceUid" class="select">
          <option
              v-for="d in deviceOptions"
              :key="d.device_uid"
              :value="d.device_uid"
          >
            {{ d.label }}
          </option>
        </select>
        <div class="muted tiny">
          Selected: <strong>{{ selectedDeviceLabel }}</strong>
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

        <!-- eCO₂ -->
        <div class="chartSubCard">
          <div class="chartCardHead">
            <span class="chartCardTitle">eCO₂</span>
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
              :timestamps="trends.timestamps"
              :series="[{ name: 'eCO₂', color: '#6a1b9a', values: trends.eco2s }]"
              :range="universalRange"
              :theme="theme"
              unit="ppm"
              :decimals="0"
              :height="chartExpanded.eco2 ? 400 : 200"
              :yMin="350"
              :thresholdBands="eco2ThresholdBands"
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
              :timestamps="trends.timestamps"
              :series="[
                { name: 'Sensor', color: '#c62828', values: trends.temps },
                { name: 'RTC',    color: '#2e7d32', values: trends.rtcTemps },
              ]"
              :range="universalRange"
              :theme="theme"
              unit="°C"
              :decimals="1"
              :height="chartExpanded.temp ? 440 : 220"
              :yPad="5"
              :thresholdBands="tempThresholdBands"
              :showLegend="true"
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
              :timestamps="trends.timestamps"
              :series="[{ name: 'Humidity', color: '#1565c0', values: trends.rhs }]"
              :range="universalRange"
              :theme="theme"
              unit="%"
              :decimals="1"
              :height="chartExpanded.humidity ? 400 : 200"
              :thresholdBands="humidityThresholdBands"
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
              :timestamps="trends.timestamps"
              :series="[{ name: 'TVOC', color: '#ef6c00', values: trends.tvocs }]"
              :range="universalRange"
              :theme="theme"
              unit="ppb"
              :decimals="0"
              :height="chartExpanded.tvoc ? 400 : 200"
              :yMin="0"
              :thresholdBands="tvocThresholdBands"
          />
        </div>

      </div>
    </section>

    <!-- Latest packets -->
    <section v-if="me?.ok" class="card">
      <div class="packetHead">
        <h2>Latest 10 Packets</h2>
        <span class="tiny muted">{{ latestPackets.length }} shown</span>
      </div>

      <div v-if="!selectedDeviceUid" class="muted tiny">Select a device to view packets.</div>
      <div v-else-if="trendsPending" class="muted tiny">Loading…</div>
      <div v-else-if="!latestPackets.length" class="muted tiny">No recent packets available.</div>

      <div v-else class="packetTableWrap">
        <table class="packetTable">
          <thead>
          <tr>
            <th>Time</th>
            <th>eCO₂</th>
            <th>Temp</th>
            <th>RH</th>
            <th>TVOC</th>
            <th>RTC</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="pkt in latestPackets" :key="pkt.ts">
            <td>{{ pkt.timeLabel }}</td>
            <td>{{ pkt.eco2 }}</td>
            <td>{{ pkt.temp }}</td>
            <td>{{ pkt.rh }}</td>
            <td>{{ pkt.tvoc }}</td>
            <td>{{ pkt.rtcTemp }}</td>
          </tr>
          </tbody>
        </table>
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
        <div class="metricsGrid">
          <MetricCard label="CO₂" :value="formatMetric(live?.eco2_ppm, 0)" unit="ppm" />
          <MetricCard label="Temperature" :value="formatMetric(live?.temp_c, 1)" unit="°C" />
          <MetricCard label="Humidity" :value="formatMetric(live?.rh_pct, 1)" unit="%" />
          <MetricCard label="AQI" :value="formatMetric(live?.aqi, 0)" />
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
              <label class="label">Device UID (auto-assigned)</label>
              <div class="uidPreview">{{ nextDeviceUid }}</div>
              <div class="muted tiny">Assigned automatically based on next available device ID.</div>
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
              <button class="btn primary" type="submit" :disabled="submitPending">
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
          <div>
            <h3 class="modalTitle">
              {{ activeDevice?.device_name || activeDevice?.device_uid || "Device" }}
            </h3>
            <div class="muted tiny">{{ activeDevice?.device_uid }}</div>
          </div>

          <button class="btn" type="button" @click="closeDeviceModal">Close</button>
        </div>

        <div class="modalBody">
          <div class="deviceMeta">
            <div><strong>Home:</strong> {{ activeDevice?.home_name || "—" }}</div>
            <div><strong>Room:</strong> {{ activeDevice?.room_name || "—" }}</div>
            <div><strong>Status:</strong> {{ activeDevice?.status || "—" }}</div>
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
  </main>
</template>

<script setup>
import AirTrendChart from '~/components/charts/AirTrendChart.vue'

useHead({ title: 'AirBuddy | Beta Dashboard' })

// ── Theme ────────────────────────────────────────────────────────────────────
const theme = ref("light")
let nowTimer = null

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

const nextDeviceId = computed(() => {
  if (!devices.value.length) return 1
  return Math.max(...devices.value.map(d => Number(d.device_id) || 0)) + 1
})
const nextDeviceUid = computed(() => `AB_0${nextDeviceId.value}`)

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
      if (!list.length) { selectedDeviceUid.value = ""; return }
      if (!selectedDeviceUid.value || !list.some(d => d.device_uid === selectedDeviceUid.value)) {
        selectedDeviceUid.value = list[0].device_uid
      }
    },
    { immediate: true }
)

const selectedDeviceLabel = computed(() =>
    deviceOptions.value.find(d => d.device_uid === selectedDeviceUid.value)?.label || "None"
)

// ── Chart ranges & threshold bands ──────────────────────────────────────────
const trendRangeKeys = ["15m", "30m", "1h", "3h", "6h", "12h", "24h", "36h", "72h", "7d", "30d"]

const universalRange = ref("1h")

const chartExpanded = reactive({
  eco2: false,
  temp: false,
  humidity: false,
  tvoc: false,
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

// ── Live telemetry & trends ──────────────────────────────────────────────────
const {
  data: live,
  pending: livePending,
  error: liveError,
} = await useFetch("/api/dashboard/device-live", {
  credentials: "include",
  headers: { "Cache-Control": "no-cache" },
  query: computed(() => ({ device_uid: selectedDeviceUid.value || undefined })),
  watch: [selectedDeviceUid],
  immediate: true,
})

const RANGE_FETCH_HOURS = {
  '15m': 1, '30m': 1, '1h': 2, '3h': 4, '6h': 7, '12h': 13, '24h': 25,
  '36h': 37, '72h': 73, '7d': 169, '30d': 721,
}

const {
  data: trends,
  pending: trendsPending,
  error: trendsError,
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

const liveErrorMessage = computed(() => {
  const e = liveError.value
  return e?.data?.message || e?.message || String(e || "")
})

const trendsErrorMessage = computed(() => {
  const e = trendsError.value
  return e?.data?.message || e?.message || String(e || "")
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

const latestPackets = computed(() => {
  const ts = Array.isArray(trends.value?.timestamps) ? trends.value.timestamps : []
  const eco2s = Array.isArray(trends.value?.eco2s) ? trends.value.eco2s : []
  const temps = Array.isArray(trends.value?.temps) ? trends.value.temps : []
  const rhs = Array.isArray(trends.value?.rhs) ? trends.value.rhs : []
  const tvocs = Array.isArray(trends.value?.tvocs) ? trends.value.tvocs : []
  const rtcTemps = Array.isArray(trends.value?.rtcTemps) ? trends.value.rtcTemps : []

  return ts
      .map((t, i) => ({
        ts: Number(t) || i,
        timeLabel: formatPacketTime(t),
        eco2: formatPacketValue(eco2s[i], 0, "ppm"),
        temp: formatPacketValue(temps[i], 1, "°C"),
        rh: formatPacketValue(rhs[i], 1, "%"),
        tvoc: formatPacketValue(tvocs[i], 0, "ppb"),
        rtcTemp: formatPacketValue(rtcTemps[i], 1, "°C"),
      }))
      .filter(r => Number.isFinite(r.ts))
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 10)
})

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

function openAddDeviceModal() {
  addDeviceModalOpen.value = true
  submitMessage.value = ""
  submitError.value = ""
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

function openDeviceModal(device) {
  activeDevice.value = device
  deviceModalOpen.value = true
  deviceKeyError.value = ""
  deviceKeyMessage.value = ""
  showDeviceKey.value = false
  copyPending.value = false
  resetPending.value = false
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

/* ── Latest packets ─────────────────────────────────────────────────────────── */
.packetHead {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.packetHead h2 {
  margin: 0;
  font-size: 18px;
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
}

.deviceCard:hover {
  background: var(--card-hover);
}

.deviceCardTitle,
.homeTitle {
  font-weight: 700;
  margin-bottom: 6px;
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

/* ── Device detail modal ────────────────────────────────────────────────────── */
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
