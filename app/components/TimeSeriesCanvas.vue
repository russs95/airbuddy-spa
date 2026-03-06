<template>
  <div class="wrap">
    <div class="top">
      <div class="title">{{ title }}</div>
      <select class="select" v-model="range">
        <option v-for="k in rangeKeys" :key="k" :value="k">{{ k }}</option>
      </select>
    </div>

    <canvas ref="canvas" class="canvas"></canvas>
  </div>
</template>

<script setup lang="ts">
import { drawTimeSeriesChart, DEFAULT_RANGES_HOURS, type SeriesDef } from "@/lib/chartCore"

const props = defineProps<{
  title: string
  timestamps: Array<number | null>
  series: SeriesDef[]
  yLabelFmt?: (v: number) => string
  defaultRange?: string
}>()

const rangeKeys = Object.keys(DEFAULT_RANGES_HOURS)
const range = ref(props.defaultRange || "24h")
const canvas = ref<HTMLCanvasElement | null>(null)

function redraw() {
  if (!canvas.value) return
  drawTimeSeriesChart({
    canvas: canvas.value,
    rangeKey: range.value,
    rangesHours: DEFAULT_RANGES_HOURS,
    maxGapS: 240,
    timestamps: props.timestamps,
    series: props.series,
    yLabelFmt: props.yLabelFmt,
  })
}

watch(range, () => requestAnimationFrame(redraw))

// Redraw whenever data changes (timestamps or series values)
watch(
    () => [props.timestamps, props.series],
    () => requestAnimationFrame(redraw),
    { deep: true }
)

onMounted(() => {
  // ResizeObserver so it redraws when the container changes size
  const el = canvas.value
  if (!el) return

  const ro = new ResizeObserver(() => requestAnimationFrame(redraw))
  ro.observe(el)

  // Initial draw
  requestAnimationFrame(redraw)

  onBeforeUnmount(() => ro.disconnect())
})
</script>

<style scoped>
.wrap {
  border-radius: 18px;
  background: rgba(0,0,0,0.04);
  border: 1px solid rgba(0,0,0,0.08);
  padding: 14px;
}
.top {
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-bottom:10px;
}
.title {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.9;
}
.select {
  border-radius: 999px;
  padding: 8px 10px;
  border: 1px solid rgba(0,0,0,0.12);
  background: rgba(255,255,255,0.65);
}
.canvas {
  width: 100%;
  height: 220px; /* matches your original “trend” vibe */
  display:block;
}
</style>