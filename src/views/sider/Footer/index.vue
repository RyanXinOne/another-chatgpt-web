<script setup lang='ts'>
import { ref } from 'vue'
import { HoverButton, SvgIcon, UserAvatar } from '@/components/common'
import Setting from '@/components/common/Setting/index.vue'

const show = ref(false)
</script>

<template>
  <footer class="flex items-center justify-between min-w-0 p-4 overflow-hidden border-t dark:border-neutral-800">
    <div class="flex-1 flex-shrink-0 overflow-hidden">
      <UserAvatar />
    </div>

    <HoverButton @click="show = true">
      <span class="text-xl text-[#4f555e] dark:text-white">
        <SvgIcon icon="ri:settings-4-line" />
      </span>
    </HoverButton>

    <Setting v-model:visible="show" />
  </footer>
</template>
