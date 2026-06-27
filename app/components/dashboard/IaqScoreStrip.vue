<script setup lang="ts">
const {
  selectedDeviceUid, iaqScores, iaqCurrentScore,
  iaqLineColor, iaqScoreLabel, iaqSparkPoints, iaqFillD,
} = useDashboard()
</script>

<template>
  <UCard v-if="selectedDeviceUid && iaqScores.length" :ui="{ body: 'lp:p-4' }">
    <div class="lp:flex lp:items-center lp:gap-4">
      <div class="lp:shrink-0 lp:text-center">
        <div class="lp:text-3xl lp:font-bold lp:leading-none" :style="{ color: iaqLineColor }">
          {{ iaqCurrentScore != null ? iaqCurrentScore.toFixed(1) : '—' }}
        </div>
        <div class="lp:text-sm lp:font-medium lp:mt-1">{{ iaqScoreLabel }}</div>
        <div class="lp:text-xs lp:text-(--ui-text-muted)">IAQ · 6h trend</div>
      </div>
      <div class="lp:flex-1 lp:h-14">
        <svg class="lp:w-full lp:h-full" viewBox="0 0 600 56" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="juneIaqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="iaqLineColor" stop-opacity="0.28" />
              <stop offset="100%" :stop-color="iaqLineColor" stop-opacity="0.03" />
            </linearGradient>
          </defs>
          <path :d="iaqFillD" fill="url(#juneIaqGrad)" />
          <polyline
            :points="iaqSparkPoints"
            fill="none"
            :stroke="iaqLineColor"
            stroke-width="2"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
        </svg>
      </div>
    </div>
  </UCard>
</template>
