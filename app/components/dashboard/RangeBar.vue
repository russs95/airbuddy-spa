<script setup lang="ts">
defineProps<{ items: string[] }>()
const model = defineModel<string>({ required: true })
</script>

<template>
  <div class="lp:flex lp:flex-wrap lp:gap-1" role="group" aria-label="Time range">
    <UButton
      v-for="r in items"
      :key="r"
      size="xs"
      :color="model === r ? 'primary' : 'neutral'"
      :variant="model === r ? 'solid' : 'soft'"
      :label="r"
      @click="model = r"
    />
  </div>
</template>
