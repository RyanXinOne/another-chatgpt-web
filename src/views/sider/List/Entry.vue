<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { NInput, NPopconfirm } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { debounce } from '@/utils/functions/debounce'
import { generateTitle } from '@/views/chat/helper'
import { t } from '@/locales'

interface Props {
  cid: CID
  title: string
  ordering?: boolean
}

const props = defineProps<Props>()

const { isMobile } = useBasicLayout()

const appStore = useAppStore()
const chatStore = useChatStore()

const editingTitle = ref<string>('')

const editing = ref<boolean>(false)

const inputRef = ref<Ref | null>(null)

const isActive = computed<boolean>(() => chatStore.active === props.cid)

watch(isActive, (value) => {
  if (!value && editing.value)
    editing.value = false
})

function handleSelect() {
  if (isActive.value)
    return

  chatStore.setActive(props.cid)

  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleEdit() {
  editingTitle.value = props.title
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function handleDelete() {
  debounce(() => {
    chatStore.deleteConversation(props.cid)
    if (isMobile.value)
      appStore.setSiderCollapsed(true)
  }, 500)()
}

function handleSave() {
  chatStore.setTitle(props.cid, editingTitle.value)
  editing.value = false
}

function handleCancel() {
  editing.value = false
}

function handleGenerate() {
  if (chatStore.getTitle(props.cid) !== t('chat.thinking') && chatStore.getMessages(props.cid).length > 0)
    generateTitle(props.cid)
}
</script>

<template>
  <a v-if="!ordering"
  class="relative flex items-center gap-2 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
  :class="isActive && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]']"
  @click="handleSelect"
  >
    <button v-if="isActive" @click="handleGenerate">
      <SvgIcon icon="ri:ai-generate" />
    </button>
    <span v-else>
      <SvgIcon icon="ri:message-3-line" />
    </span>
    <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
      <NInput
      ref="inputRef"
      v-if="editing"
      v-model:value="editingTitle" size="tiny"
      @keydown.enter="handleSave"
      @keydown.esc="handleCancel"
      />
      <span v-else :title="title">{{ title }}</span>
    </div>
    <div v-if="isActive" class="flex items-center gap-1">
      <template v-if="!editing">
        <button @click="handleEdit">
          <SvgIcon icon="ri:edit-line" />
        </button>
        <NPopconfirm placement="bottom" @positive-click="handleDelete">
          <template #trigger>
          <button>
            <SvgIcon icon="ri:delete-bin-line" />
          </button>
          </template>
          {{ $t('chat.deleteHistoryConfirm') }}
        </NPopconfirm>
      </template>
      <template v-else>
        <button @click="handleSave">
          <SvgIcon icon="ri:save-line" />
        </button>
        <button @click="handleCancel">
          <SvgIcon icon="ri:close-line" />
        </button>
      </template>
    </div>
  </a>
  <div v-else
  class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
  :class="isActive && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]']">
    <span>
      <SvgIcon icon="ri:draggable" />
    </span>
    <div class="relative flex-1 overflow-hidden break-all text-ellipsis whitespace-nowrap">
      <span :title="title">{{ title }}</span>
    </div>
  </div>
</template>
