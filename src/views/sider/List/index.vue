<script setup lang='ts'>
import { computed } from 'vue'
import { NScrollbar } from 'naive-ui'
import Entry from './Entry.vue'
import { SvgIcon } from '@/components/common'
import { useChatStore } from '@/store'

const chatStore = useChatStore()

const history = computed(() => chatStore.history)

</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!history.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="(cid, index) of history" :key="index">
          <Entry :cid="cid" :title="chatStore.getTitle(cid)" />
        </div>
      </template>
    </div>
  </NScrollbar>
</template>
