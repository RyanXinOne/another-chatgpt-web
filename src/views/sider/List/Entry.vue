<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, nextTick, ref, watch } from 'vue'
import { NInput, NPopconfirm } from 'naive-ui'
import { SvgIcon } from '@/components/common'
import { useAppStore, useChatStore } from '@/store'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { debounce } from '@/utils/functions/debounce'

interface Props {
  uuid: number
  title: string
}

const props = defineProps<Props>()

const { isMobile } = useBasicLayout()

const appStore = useAppStore()
const chatStore = useChatStore()

const editingTitle = ref<string>('')

const editing = ref<boolean>(false)

const inputRef = ref<Ref | null>(null)

const isActive = computed<boolean>(() => chatStore.active === props.uuid)

watch(() => isActive.value, (value) => {
  if (!value && editing.value)
    editing.value = false
})

function handleSelect() {
  if (isActive.value)
    return

  chatStore.setActive(props.uuid)

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
    chatStore.deleteHistoryAndChat(props.uuid)
    if (isMobile.value)
      appStore.setSiderCollapsed(true)
  }, 500)()
}

function handleSave() {
  chatStore.updateHistory(props.uuid, { title: editingTitle.value })
  editing.value = false
}

function handleCancel() {
  editing.value = false
}
</script>

<template>
  <a
  class="relative flex items-center gap-3 px-3 py-3 break-all border rounded-md cursor-pointer hover:bg-neutral-100 group dark:border-neutral-800 dark:hover:bg-[#24272e]"
  :class="isActive && ['border-[#4b9e5f]', 'bg-neutral-100', 'text-[#4b9e5f]', 'dark:bg-[#24272e]', 'dark:border-[#4b9e5f]', 'pr-14']"
  @click="handleSelect"
  >
    <span>
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
      <span v-else>{{ title }}</span>
    </div>
    <div v-if="isActive" class="absolute z-10 flex visible right-1">
      <template v-if="editing">
        <button class="p-1" @click="handleSave">
          <SvgIcon icon="ri:save-line" />
        </button>
        <button class="p-1" @click="handleCancel">
          <SvgIcon icon="ri:close-line" />
        </button>
      </template>
      <template v-else>
        <button class="p-1">
          <SvgIcon icon="ri:edit-line" @click="handleEdit" />
        </button>
        <NPopconfirm placement="bottom" @positive-click="handleDelete">
          <template #trigger>
          <button class="p-1">
            <SvgIcon icon="ri:delete-bin-line" />
          </button>
          </template>
          {{ $t('chat.deleteHistoryConfirm') }}
        </NPopconfirm>
      </template>
    </div>
  </a>
</template>
