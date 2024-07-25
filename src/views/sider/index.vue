<script setup lang='ts'>
import type { CSSProperties } from 'vue'
import { computed, ref, watch } from 'vue'
import { NButton, NInput, NLayoutSider, NSelect, useDialog } from 'naive-ui'
import type { SelectGroupOption } from 'naive-ui'
import List from './List/index.vue'
import Footer from './Footer/index.vue'
import { useAppStore, useChatStore, useSettingStore } from '@/store'
import type { Model } from '@/store/modules/settings/helper'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { PromptStore, SvgIcon } from '@/components/common'
import { t } from '@/locales'

const appStore = useAppStore()
const chatStore = useChatStore()
const settingStore = useSettingStore()

const dialog = useDialog()

const { isMobile } = useBasicLayout()
const show = ref(false)

const collapsed = computed(() => appStore.siderCollapsed)

const searchInput = ref<string>('')

const searchText = computed<string>(() => searchInput.value.trim().toLowerCase())

const ordering = ref<boolean>(false)

const model = computed({
  get() {
    return settingStore.model
  },
  set(value: Model) {
    settingStore.updateSetting({ model: value })
  },
})

const modelOptions: Array<SelectGroupOption> = [
  {
    type: 'group',
    label: t('setting.model'),
    key: 'model',
    children: [
      { label: 'gpt-4o', value: 'gpt-4o' },
      { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
    ],
  }
]

const showModelOptions = ref<boolean>(false)

function handleAdd() {
  chatStore.addConversation()
  if (isMobile.value)
    appStore.setSiderCollapsed(true)
}

function handleUpdateCollapsed() {
  appStore.setSiderCollapsed(!collapsed.value)
}

function handleClearAll() {
  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.clearHistoryConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearConversations()
      if (isMobile.value)
        appStore.setSiderCollapsed(true)
    },
  })
}

const getMobileClass = computed<CSSProperties>(() => {
  if (isMobile.value) {
    return {
      position: 'fixed',
      zIndex: 50,
    }
  }
  return {}
})

const mobileSafeArea = computed(() => {
  if (isMobile.value) {
    return {
      paddingBottom: 'env(safe-area-inset-bottom)',
    }
  }
  return {}
})

watch(
  isMobile,
  (val) => {
    appStore.setSiderCollapsed(val)
  },
  {
    immediate: true,
    flush: 'post',
  },
)
</script>

<template>
  <NLayoutSider
    :collapsed="collapsed"
    :collapsed-width="0"
    :width="260"
    :show-trigger="isMobile ? false : 'arrow-circle'"
    collapse-mode="transform"
    position="absolute"
    bordered
    :style="getMobileClass"
    @update-collapsed="handleUpdateCollapsed"
  >
    <div class="flex flex-col h-full" :style="mobileSafeArea">
      <main class="flex flex-col flex-1 min-h-0">
        <div class="p-4 flex items-center gap-2">
          <NButton dashed @click="handleAdd" :title="$t('chat.newChatButton')">
            <SvgIcon icon="ri:chat-new-line" />
          </NButton>
          <NSelect
            v-model:show="showModelOptions"
            :value="model"
            :options="modelOptions"
            @update-value="value => model = value"
          >
            <template #arrow v-if="!showModelOptions">
              <SvgIcon icon="ri:openai-line" />
            </template>
          </NSelect>
        </div>
        <div class="px-4 pb-4">
          <NInput v-model:value="searchInput" :placeholder="t('common.search')" size="small" round clearable :disabled="ordering">
            <template #prefix>
              <SvgIcon icon="ri:search-line" :class="{ 'text-[#4b9e5f]': searchText.length }" class="transition-colors" />
            </template>
          </NInput>
        </div>
        <div class="flex-1 min-h-0 pb-2 overflow-hidden">
          <List :searchText="searchText" :ordering="ordering" />
        </div>
        <div class="flex items-center p-4 space-x-2">
          <NButton size="small" :type="ordering ? 'success' : 'default'" @click="ordering = !ordering" :disabled="searchText.length > 0">
            <SvgIcon icon="ri:order-play-line" />
          </NButton>
          <div class="flex-1">
            <NButton size="small" block @click="show = true">
              {{ $t('store.siderButton') }}
            </NButton>
          </div>
          <NButton size="small" @click="handleClearAll">
            <SvgIcon icon="ri:close-circle-line" />
          </NButton>
        </div>
      </main>
      <Footer />
    </div>
  </NLayoutSider>
  <template v-if="isMobile">
    <div v-show="!collapsed" class="fixed inset-0 z-40 w-full h-full bg-black/40" @click="handleUpdateCollapsed" />
  </template>
  <PromptStore v-model:visible="show" />
</template>
