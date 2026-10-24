<script setup lang="ts">
// Step-by-step airOS update: one copyable command that refreshes the turtleOS
// workspace created by install_airOS.sh and runs sync_airOS.sh from it.
const props = defineProps<{
  version?: string | null
  latest?: string | null
}>()
const open = defineModel<boolean>('open', { default: false })

const updateCommand =
  'cd ~/Documents/AirBuddy/turtleOS && git fetch origin && git reset --hard origin/main && ./scripts/sync_airOS.sh'

const copied = ref(false)
async function copyCommand() {
  await navigator.clipboard.writeText(updateCommand)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <UModal v-model:open="open" title="Update airOS">
    <template #body>
      <div class="lp:space-y-4 lp:text-sm">
        <p v-if="props.version && props.latest">
          This AirBuddy is running <strong>airOS v{{ props.version }}</strong>.
          Version <strong>v{{ props.latest }}</strong> is available.
        </p>
        <p v-else-if="!props.version">
          We couldn't tell which airOS version this AirBuddy is running. Devices only report their
          version from airOS v2.6.3 onward, so it is almost
          certainly running an older version and needs updating.
        </p>

        <ol class="lp:list-decimal lp:space-y-1 lp:pl-5">
          <li>Plug your AirBuddy into your computer with a USB cable.</li>
          <li>Open a terminal (Terminal on macOS, or your Linux terminal).</li>
          <li>Copy the command below, paste it into the terminal and press <kbd>Enter</kbd>.</li>
          <li>When asked what to do, choose <strong>3</strong> (quick sync). Your WiFi and device settings stay as they are.</li>
        </ol>

        <div
          class="lp:group lp:relative lp:cursor-pointer lp:rounded-lg lp:bg-(--ui-bg-muted) lp:p-3 lp:pr-12"
          role="button"
          tabindex="0"
          title="Click to copy"
          @click="copyCommand"
          @keydown.enter.space.prevent="copyCommand"
        >
          <code class="lp:block lp:text-xs lp:break-all lp:whitespace-pre-wrap">{{ updateCommand }}</code>
          <UButton
            class="lp:absolute lp:top-2 lp:right-2"
            size="xs"
            color="neutral"
            variant="soft"
            :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
            :title="copied ? 'Copied!' : 'Copy command'"
            @click.stop="copyCommand"
          />
        </div>

        <UButton
          block
          color="primary"
          :icon="copied ? 'i-lucide-check' : 'i-lucide-copy'"
          :label="copied ? 'Copied! Now paste it into your terminal' : 'Copy update command'"
          @click="copyCommand"
        />

        <p class="lp:text-xs lp:text-(--ui-text-muted)">
          This uses the AirBuddy folder created when you first set up your device. If you get
          “No such file or directory”, run the first-time setup command from the device settings instead.
        </p>
      </div>
    </template>
  </UModal>
</template>
