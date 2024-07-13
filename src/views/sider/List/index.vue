<script setup lang='ts'>
import { computed } from 'vue'
import { NScrollbar } from 'naive-ui'
import Entry from './Entry.vue'
import { SvgIcon } from '@/components/common'
import { useChatStore } from '@/store'

interface Props {
  searchText: string
}

const props = defineProps<Props>()

const chatStore = useChatStore()

const history = computed(() => chatStore.history)

const filteredList = computed(() => {
  if (props.searchText.length === 0)
    return history.value

  return history.value.filter((cid) => chatStore.getTitle(cid).toLowerCase().includes(props.searchText))
})

</script>

<template>
  <NScrollbar class="px-4">
    <div class="flex flex-col gap-2 text-sm">
      <template v-if="!filteredList.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="cid of filteredList" :key="cid">
          <Entry :cid="cid" :title="chatStore.getTitle(cid)" />
        </div>
      </template>
    </div>
  </NScrollbar>
</template>
