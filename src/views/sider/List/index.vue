<script setup lang='ts'>
import { computed, watch } from 'vue'
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

  return chatStore.history.filter((item) => item.title.toLowerCase().includes(props.searchText))
})

const orderingList = computed(() => chatStore.history)
// @ts-ignore
const { parent } = useDragAndDrop(orderingList)

watch(orderingList, (value) => {
  chatStore.setHistory(value)
}, { deep: true })
</script>

<template>
  <div :ref="ordering ? 'parent' : undefined" class="flex flex-col gap-2 pb-1 px-3 mx-1 h-full overflow-auto text-sm">
    <template v-if="!ordering && !filteredList.length">
      <div class="flex flex-col items-center mt-4 text-center text-neutral-300">
        <SvgIcon icon="ri:inbox-line" class="mb-2 text-3xl" />
        <span>{{ $t('common.noData') }}</span>
      </div>
    </template>
    <template v-else>
      <div v-for="(item, index) of (ordering ? orderingList : filteredList)" :key="item.uuid" :index="index">
        <Entry :uuid="item.uuid" :title="item.title" :ordering="ordering" />
      </div>
    </template>
  </div>
</template>
