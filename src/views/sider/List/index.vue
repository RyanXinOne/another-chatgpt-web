<script setup lang='ts'>
import { computed, watch } from 'vue'
import { NScrollbar } from 'naive-ui'
import { useDragAndDrop } from 'vue-fluid-dnd'
import Entry from './Entry.vue'
import { SvgIcon } from '@/components/common'
import { useChatStore } from '@/store'

interface Props {
  searchText: string
  ordering: boolean
}

const props = defineProps<Props>()

const chatStore = useChatStore()

const filteredList = computed(() => {
  if (props.searchText.length === 0)
    return chatStore.history

  return chatStore.history.filter((cid) => chatStore.getTitle(cid).toLowerCase().includes(props.searchText))
})

const orderingList = computed(() => chatStore.history)
const { parent } = useDragAndDrop(orderingList)

watch(orderingList, (value) => {
  chatStore.setHistory(value)
}, { deep: true })
</script>

<template>
  <NScrollbar v-if="!ordering" class="px-4">
    <div class="flex flex-col gap-2 text-sm pb-1">
      <template v-if="!filteredList.length">
        <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
          <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
          <span>{{ $t('common.noData') }}</span>
        </div>
      </template>
      <template v-else>
        <div v-for="cid of filteredList" :key="cid">
          <Entry :cid="cid" :title="chatStore.getTitle(cid)" :ordering="false" />
        </div>
      </template>
    </div>
  </NScrollbar>
  <div v-else ref="parent" class="flex flex-col gap-2 pb-1 px-3 mx-1 h-full overflow-auto text-sm">
    <div v-for="(cid, index) of orderingList" :key="cid" :index="index">
      <Entry :cid="cid" :title="chatStore.getTitle(cid)" :ordering="true" />
    </div>
  </div>
</template>
