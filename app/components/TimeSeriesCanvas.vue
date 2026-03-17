<template>
  <div class="wrap" :data-theme="theme">
    <div class="top">
      <div class="title">{{ title }}</div>

      <select
          v-if="showRangeSelect"
          class="select"
          v-model="localRange"
      >
        <option v-for="k in rangeKeys" :key="k" :value="k">{{ k }}</option>
      </select>
    </div>

    <div
        ref="viewport"
        class="chart-viewport"
        :style="{ height: `${props.height}px` }"
    >
      <canvas ref="canvas" class="canvas"></canvas>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { drawTimeSeriesChart, DEFAULT_RANGES_HOURS, type SeriesDef } from "@/lib/chartCore"

const props = withDefaults(defineProps<{
  title: string
  timestamps: Array<number | null>
  series: SeriesDef[]
  yLabelFmt?: (v: number) => string
  defaultRange?: string
  range?: string
  theme?: "light" | "dark"
  showRangeSelect?: boolean
  height?: number
}>(), {
  defaultRange: "1h",
  theme: "light",
  showRangeSelect: true,
  height: 150,
})

const rangeKeys = Object.keys(DEFAULT_RANGES_HOURS)
const localRange = ref(props.range || props.defaultRange || "1h")
const canvas = ref<HTMLCanvasElement | null>(null)
const viewport = ref<HTMLDivElement | null>(null)

const theme = computed(() => props.theme || "light")
const activeRange = computed(() => props.range || localRange.value || props.defaultRange || "1h")

let ro: ResizeObserver | null = null

function redraw() {
  if (!canvas.value || !viewport.value) return

  drawTimeSeriesChart({
    canvas: canvas.value,
    rangeKey: activeRange.value,
    rangesHours: DEFAULT_RANGES_HOURS,
    maxGapS: 240,
    timestamps: props.timestamps,
    series: props.series,
    yLabelFmt: props.yLabelFmt,
    theme: theme.value,
  })
}

watch(
    () => props.range,
    (next) => {
      if (next) localRange.value = next
      requestAnimationFrame(redraw)
    }
)

watch(localRange, () => {
  if (!props.range) requestAnimationFrame(redraw)
})

watch(
    () => [props.timestamps, props.series, props.yLabelFmt, props.theme, props.height],
    () => requestAnimationFrame(redraw),
    { deep: true }
)

onMounted(() => {
  if (!viewport.value) return

  ro = new ResizeObserver(() => {
    requestAnimationFrame(redraw)
  })

  ro.observe(viewport.value)
  requestAnimationFrame(redraw)
})

onBeforeUnmount(() => {
  if (ro) {
    ro.disconnect()
    ro = null
  }

  if (canvas.value) {
    canvas.value.onmousemove = null
    canvas.value.onmouseleave = null
  }
})
</script>

<style scoped>
.wrap {
  --panel: rgba(0, 0, 0, 0.04);
  --border: rgba(0, 0, 0, 0.08);
  --text: #111827;
  --select-bg: rgba(255, 255, 255, 0.7);
  --select-border: rgba(0, 0, 0, 0.12);

  border-radius: 18px;
  background: var(--panel);
  border: 1px solid var(--border);
  padding: 10px 12px 12px;
  min-width: 0;
  overflow: hidden;
  box-sizing: border-box;
}

.wrap[data-theme="dark"] {
  --panel: rgba(255, 255, 255, 0.05);
  --border: rgba(255, 255, 255, 0.12);
  --text: #eef2f7;
  --select-bg: rgba(255, 255, 255, 0.08);
  --select-border: rgba(255, 255, 255, 0.14);
}

.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
  opacity: 0.95;
  min-width: 0;
}

.select {
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid var(--select-border);
  background: var(--select-bg);
  color: var(--text);
  font: inherit;
  flex: 0 0 auto;
}

.chart-viewport {
  position: relative;
  width: 100%;
  min-height: 120px;
  overflow: hidden;
}

.canvas {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
}
</style>