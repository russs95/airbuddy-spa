<template>
  <div class="card">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div v-if="unit" class="unit">{{ unit }}</div>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  unit: String
})
</script>

<style scoped>
.card {
  padding:16px;
  border-radius:14px;
  background:rgba(0,0,0,0.04);
  border:1px solid rgba(0,0,0,0.08);
  min-width:140px;
}

.label{
  font-size:12px;
  opacity:.7;
}

.value{
  font-size:32px;
  font-weight:600;
}

.unit{
  font-size:12px;
  opacity:.6;
}
</style>