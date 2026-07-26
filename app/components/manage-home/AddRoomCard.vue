<script setup lang="ts">
const { openAddRoomModal } = useManageHome()
</script>

<template>
  <button
    type="button"
    class="lp:rounded-lg lp:border lp:border-dashed lp:border-(--ui-border) lp:flex lp:flex-col lp:items-center lp:justify-center lp:gap-2 lp:py-8 lp:text-(--ui-text-muted) lp:hover:border-primary lp:hover:text-primary lp:transition lp:min-h-[10rem] lp:w-full"
    @click="openAddRoomModal()"
  >
    <UIcon name="i-lucide-plus-circle" class="lp:size-6" />
    <span class="lp:text-sm lp:font-medium">Add Room</span>
  </button>
</template>
