<script setup lang="ts">
const {
  deviceModalOpen, activeDevice, deviceKeyValue, deviceKeyError, deviceKeyMessage,
  showDeviceKey, resetPending, copyPending, renamingDevice, renameValue, renamePending,
  renameError, uidCopied,
  closeDeviceModal, startRename, cancelRename, saveDeviceName,
  copyDeviceUid, toggleShowKey, copyDeviceKey, resetDeviceKey,
} = useDashboard()

const open = computed({
  get: () => deviceModalOpen.value,
  set: (v: boolean) => { if (!v) closeDeviceModal() },
})
</script>

<template>
  <UModal v-model:open="open" :title="activeDevice?.device_name || activeDevice?.device_uid || 'Device'">
    <template #body>
      <div class="lp:space-y-4">
        <!-- Name / rename -->
        <div>
          <div v-if="renamingDevice" class="lp:flex lp:items-center lp:gap-2">
            <UInput
              v-model.trim="renameValue"
              placeholder="Device name"
              autofocus
              class="lp:flex-1"
              @keydown.enter="saveDeviceName"
              @keydown.escape="cancelRename"
            />
            <UButton color="primary" icon="i-lucide-check" :loading="renamePending" title="Save name" @click="saveDeviceName" />
            <UButton color="neutral" variant="soft" icon="i-lucide-x" title="Cancel" @click="cancelRename" />
          </div>
          <UButton
            v-else
            color="neutral"
            variant="ghost"
            size="sm"
            icon="i-lucide-pencil"
            label="Edit name"
            @click="startRename"
          />
          <div class="lp:mt-2 lp:flex lp:items-center lp:gap-2 lp:text-xs lp:text-(--ui-text-muted)">
            <code class="lp:rounded lp:bg-(--ui-bg-muted) lp:px-1.5 lp:py-0.5">{{ activeDevice?.device_uid }}</code>
            <UButton
              size="xs"
              color="neutral"
              variant="ghost"
              :icon="uidCopied ? 'i-lucide-check' : 'i-lucide-copy'"
              :title="uidCopied ? 'Copied!' : 'Copy device ID'"
              @click="copyDeviceUid"
            />
          </div>
          <UAlert v-if="renameError" class="lp:mt-2" color="error" variant="soft" :title="renameError" />
        </div>

        <div class="lp:grid lp:grid-cols-2 lp:gap-x-6 lp:text-sm">
          <div><strong>Home:</strong> {{ activeDevice?.home_name || '—' }}</div>
          <div><strong>Room:</strong> {{ activeDevice?.room_name || '—' }}</div>
        </div>

        <USeparator />

        <UFormField label="Device Key">
          <div v-if="deviceKeyValue" class="lp:space-y-1">
            <div class="lp:flex lp:items-center lp:gap-2">
              <UInput
                :model-value="deviceKeyValue"
                :type="showDeviceKey ? 'text' : 'password'"
                readonly
                class="lp:flex-1"
              />
              <UButton color="neutral" variant="soft" :label="showDeviceKey ? 'Hide' : 'Show'" @click="toggleShowKey" />
              <UButton color="neutral" variant="soft" :loading="copyPending" label="Copy" @click="copyDeviceKey" />
            </div>
            <p class="lp:text-xs lp:text-(--ui-text-muted)">
              Save this key now. For security, it will not be shown again after you close this dialog.
            </p>
          </div>
          <p v-else class="lp:text-xs lp:text-(--ui-text-muted)">
            Current keys cannot be viewed again. Reset the key to generate a new one.
          </p>
        </UFormField>

        <UAlert v-if="deviceKeyMessage" color="success" variant="soft" :title="deviceKeyMessage" />
        <UAlert v-if="deviceKeyError" color="error" variant="soft" :title="deviceKeyError" />

        <div>
          <UButton
            color="error"
            icon="i-lucide-rotate-ccw"
            :loading="resetPending"
            :disabled="!activeDevice?.device_id"
            label="Reset Key"
            @click="resetDeviceKey"
          />
        </div>
        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          Resetting the key will require updating the key on the physical AirBuddy device.
        </p>
      </div>
    </template>
  </UModal>
</template>
