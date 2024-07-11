<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { NAutoComplete, NButton, NInput, useDialog, useMessage } from 'naive-ui'
import { toPng } from 'html-to-image'
import { getEncoding } from 'js-tiktoken'
import { useScroll } from './hooks/useScroll'
import Message from './components/Message/index.vue'
import HeaderComponent from './components/Header/index.vue'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore, usePromptStore, useSettingStore } from '@/store'
import { fetchChatAPIProcess } from '@/api'
import type { PostMessage } from '@/api/helper'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_OPEN_LONG_REPLY === 'true'

const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()
const settingStore = useSettingStore()
const promptStore = usePromptStore()

const { isMobile } = useBasicLayout()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()

const uuid = computed(() => chatStore.active)

const dataSources = computed(() => chatStore.getChatMessages(uuid.value))

const usingContext = computed<boolean>(() => chatStore.getChatUsingContext(uuid.value))

const prompt = ref<string>('')

const loading = ref<boolean>(false)
const inputRef = ref<Ref | null>(null)

const debouncedSaveDraft = debounce((uuid: number | null, value: string) => {
  chatStore.updateChatDraftPrompt(uuid, value)
}, 500)

watch(prompt, (value) => {
  debouncedSaveDraft(uuid.value, value)
})

watch(uuid, (newVal, oldVal) => {
  if (oldVal !== null) {
    resetState()
  }
})

onMounted(() => {
  dataSources.value.forEach((item, index) => {
    if (item.loading)
      chatStore.updateChatMessage(uuid.value, index, { loading: false })
  })
  resetState()
})

function resetState() {
  if (loading.value) {
    controller.abort()
  }
  scrollToBottom()
  prompt.value = chatStore.getChatDraftPrompt(uuid.value)
  if (!isMobile.value)
    inputRef.value.focus()
}

function buildContextMessages(uuid: number | null, startIndex: number, endIndex: number, maxTokens: number = 128000): [PostMessage] {
  const sourceMessages = chatStore.getChatMessages(uuid)

  startIndex = Math.max(0, startIndex)
  endIndex = Math.min(sourceMessages.length, endIndex)

  const encoding = getEncoding('cl100k_base')
  const tokens_per_message = 3
  const count_message_token = (message: PostMessage) => {
    let tokens = tokens_per_message
    tokens += encoding.encode(message.role).length
    tokens += encoding.encode(message.content).length
    return tokens
  }
  let estimated_tokens = 3

  const systemMessage: PostMessage = { role: 'system', content: settingStore.systemMessage }
  estimated_tokens += count_message_token(systemMessage)

  const messages: PostMessage[] = []
  for (let i = endIndex - 1; i >= startIndex; i--) {
    const item = sourceMessages[i]
    if (!item.error) {
      const message: PostMessage = {
        role: item.inversion ? 'user' : 'assistant',
        content: item.text,
      }
      estimated_tokens += count_message_token(message)
      if (estimated_tokens > maxTokens)
        break
      messages.push(message)
    }
  }
  messages.push(systemMessage)
  messages.reverse()
  return messages as [PostMessage]
}

async function chatProcess(uuid: number | null, index: number, usingContext: boolean, regenerate: boolean = false) {
  let messages: [PostMessage] = buildContextMessages(uuid, usingContext ? 0 : index - 1, index)

  chatStore.updateChatMessage(
    uuid,
    index,
    {
      dateTime: new Date().toLocaleString(),
      text: t('chat.thinking'),
      inversion: false,
      loading: true,
      error: false,
    },
  )

  loading.value = true
  controller = new AbortController()

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<ConversationResponse>({
        messages,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          try {
            const chunks = responseText.trim().split('\n')
            const data: ConversationResponse[] = chunks.map((chunk: string) => JSON.parse(chunk))
            const text = lastText + data.map((response) => response.choices[0]?.delta?.content || '').join('')
            chatStore.updateChatMessage(
              uuid,
              index,
              {
                dateTime: new Date().toLocaleString(),
                text,
              },
            )

            if (openLongReply && data[data.length - 1].choices[0]?.finish_reason === 'length') {
              lastText = text
              messages = buildContextMessages(uuid, usingContext ? 0 : index - 1, index + 1)
              messages.push({ role: 'user', content: '' })
              return fetchChatAPIOnce()
            }

            if (!regenerate)
              scrollToBottomIfAtBottom()
          }
          catch (error) { }
        },
      })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled') {
      if (!regenerate)
        scrollToBottomIfAtBottom()
      return
    }

    const errorMessage = error?.message ?? t('common.wrong')

    const currentChat = chatStore.getChatMessage(uuid, index)

    if (currentChat?.text && currentChat.text !== '') {
      chatStore.updateChatMessage(
        uuid,
        index,
        {
          dateTime: new Date().toLocaleString(),
          text: `${currentChat.text}\n[${errorMessage}]`,
          error: true,
        },
      )
      return
    }

    chatStore.updateChatMessage(
      uuid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: errorMessage,
        error: true,
      },
    )
    if (!regenerate)
      scrollToBottomIfAtBottom()
  }
  finally {
    chatStore.updateChatMessage(uuid, index, { loading: false })
    loading.value = false
  }
}

async function onConversation() {
  if (prompt.value.trim() === '/\u5154\u5154') {
    window.dispatchEvent(new Event('fallings'))
    prompt.value = ''
    return
  }
  if (loading.value)
    return
  if (!prompt.value || prompt.value.trim() === '')
    return

  if (uuid.value === null) {
    chatStore.addHistoryAndChat()
  }

  const messageUuid = uuid.value
  const messageIndex = dataSources.value.length + 1

  chatStore.addChatMessage(
    messageUuid,
    {
      dateTime: new Date().toLocaleString(),
      text: prompt.value,
      inversion: true,
      error: false,
    },
  )
  chatStore.addChatMessage(
    messageUuid,
    {
      dateTime: new Date().toLocaleString(),
      text: t('chat.thinking'),
      inversion: false,
      loading: true,
      error: false,
    },
  )
  scrollToBottom()
  prompt.value = ''

  await chatProcess(messageUuid, messageIndex, usingContext.value)
}

async function onRegenerate(messageIndex: number) {
  if (loading.value)
    return
  if (!dataSources.value[messageIndex - 1]?.inversion)
    return

  await chatProcess(uuid.value, messageIndex, usingContext.value, true)
}

function toggleUsingContext() {
  chatStore.toggleChatUsingContext(uuid.value)
  if (usingContext.value)
    ms.success(t('chat.turnOnContext'))
  else
    ms.warning(t('chat.turnOffContext'))
}

function handleSubmit() {
  onConversation()
}

function handleExport() {
  if (loading.value)
    return

  const d = dialog.warning({
    title: t('chat.exportImage'),
    content: t('chat.exportImageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: async () => {
      try {
        d.loading = true
        const ele = document.getElementById('image-wrapper')
        const imgUrl = await toPng(ele as HTMLDivElement)
        const tempLink = document.createElement('a')
        tempLink.style.display = 'none'
        tempLink.href = imgUrl
        tempLink.setAttribute('download', 'chat-shot.png')
        if (typeof tempLink.download === 'undefined')
          tempLink.setAttribute('target', '_blank')
        document.body.appendChild(tempLink)
        tempLink.click()
        document.body.removeChild(tempLink)
        window.URL.revokeObjectURL(imgUrl)
        d.loading = false
        ms.success(t('chat.exportSuccess'))
        Promise.resolve()
      }
      catch (error: any) {
        ms.error(t('chat.exportFailed'))
      }
      finally {
        d.loading = false
      }
    },
  })
}

function handleDelete(index: number) {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteChatMessage(uuid.value, index)
    },
  })
}

function handleClear() {
  if (loading.value)
    return

  dialog.warning({
    title: t('chat.clearChat'),
    content: t('chat.clearChatConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.clearChatMessages(uuid.value)
    },
  })
}

function handleEnter(event: KeyboardEvent) {
  if (!isMobile.value) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
  else {
    if (event.key === 'Enter' && event.ctrlKey) {
      event.preventDefault()
      handleSubmit()
    }
  }
}

function handleStop() {
  controller.abort()
}

// 使用storeToRefs，保证store修改后，联想部分能够重新渲染
const { promptList: promptTemplate } = storeToRefs<any>(promptStore)

// 可优化部分
// 搜索选项计算，这里使用value作为索引项，所以当出现重复value时渲染异常(多项同时出现选中效果)
// 理想状态下其实应该是key作为索引项,但官方的renderOption会出现问题，所以就需要value反renderLabel实现
const searchOptions = computed(() => {
  if (prompt.value.startsWith('/')) {
    return promptTemplate.value.filter((item: { key: string }) => item.key.toLowerCase().includes(prompt.value.substring(1).toLowerCase())).map((obj: { value: any }) => {
      return {
        label: obj.value,
        value: obj.value,
      }
    })
  }
  else {
    return []
  }
})

// value反渲染key
const renderOption = (option: { label: string }) => {
  for (const i of promptTemplate.value) {
    if (i.value === option.label)
      return [i.key]
  }
  return []
}

const placeholder = computed(() => {
  if (isMobile.value)
    return t('chat.placeholderMobile')
  return t('chat.placeholder')
})

const buttonDisabled = computed(() => {
  return loading.value || !prompt.value || prompt.value.trim() === ''
})

const footerClass = computed(() => {
  let classes = ['p-4']
  if (isMobile.value)
    classes = ['sticky', 'left-0', 'bottom-0', 'right-0', 'p-2', 'pr-3', 'overflow-hidden']
  return classes
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <HeaderComponent
      v-if="isMobile"
      @export="handleExport"
      @handle-clear="handleClear"
    />
    <main class="flex-1 overflow-hidden">
      <div id="scrollRef" ref="scrollRef" class="h-full overflow-hidden overflow-y-auto">
        <div
          class="w-full max-w-screen-xl m-auto dark:bg-[#101014]"
          :class="[isMobile ? 'p-2' : 'p-4']"
        >
          <div id="image-wrapper" class="relative">
            <template v-if="!dataSources.length">
              <div class="flex items-center justify-center mt-4 text-center text-neutral-300">
                <SvgIcon icon="ri:bubble-chart-fill" class="mr-2 text-3xl" />
                <span>{{ t('chat.newChatTitle') }}</span>
              </div>
            </template>
            <template v-else>
              <div>
                <Message
                  v-for="(item, index) of dataSources"
                  :key="index"
                  :date-time="item.dateTime"
                  :text="item.text"
                  :inversion="item.inversion"
                  :error="item.error"
                  :loading="item.loading"
                  :uuid="uuid"
                  :index="index"
                  @regenerate="onRegenerate(index)"
                  @delete="handleDelete(index)"
                />
                <div class="sticky bottom-0 left-0 flex justify-center">
                  <NButton v-if="loading" type="warning" @click="handleStop">
                    <template #icon>
                      <SvgIcon icon="ri:stop-circle-line" />
                    </template>
                    {{ t('common.stopResponding') }}
                  </NButton>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </main>
    <footer :class="footerClass">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between space-x-2">
          <HoverButton v-if="!isMobile" @click="handleClear">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:delete-bin-line" />
            </span>
          </HoverButton>
          <HoverButton v-if="!isMobile" @click="handleExport">
            <span class="text-xl text-[#4f555e] dark:text-white">
              <SvgIcon icon="ri:download-2-line" />
            </span>
          </HoverButton>
          <HoverButton @click="toggleUsingContext">
            <span class="text-xl" :class="{ 'text-[#4b9e5f]': usingContext, 'text-[#a8071a]': !usingContext }">
              <SvgIcon icon="ri:chat-history-line" />
            </span>
          </HoverButton>
          <NAutoComplete v-model:value="prompt" :options="searchOptions" :render-label="renderOption">
            <template #default="{ handleInput, handleBlur, handleFocus }">
              <NInput
                ref="inputRef"
                v-model:value="prompt"
                type="textarea"
                :placeholder="placeholder"
                :autosize="{ minRows: 1, maxRows: isMobile ? 4 : 8 }"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @keypress="handleEnter"
              />
            </template>
          </NAutoComplete>
          <NButton type="primary" :disabled="buttonDisabled" @click="handleSubmit">
            <template #icon>
              <span class="dark:text-black">
                <SvgIcon icon="ri:send-plane-fill" />
              </span>
            </template>
          </NButton>
        </div>
      </div>
    </footer>
  </div>
</template>
