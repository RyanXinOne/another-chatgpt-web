<script setup lang='ts'>
import type { Ref } from 'vue'
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { NAutoComplete, NButton, NInput, useDialog, useMessage } from 'naive-ui'
import { buildContextMessages, generateTitle } from './helper'
import { useScroll } from './hooks/useScroll'
import Message from './components/Message/index.vue'
import HeaderComponent from './components/Header/index.vue'
import { HoverButton, SvgIcon } from '@/components/common'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useChatStore, usePromptStore, useSettingStore } from '@/store'
import { fetchChatAPIProcess } from '@/api'
import type { PostMessage, ResponseChunk } from '@/api/helper'
import { t } from '@/locales'
import { debounce } from '@/utils/functions/debounce'
import { timestamp } from '@vueuse/core'
import { FileCard } from '@/components/common'

let controller = new AbortController()

const openLongReply = import.meta.env.VITE_OPEN_LONG_REPLY === 'true'

const dialog = useDialog()
const ms = useMessage()

const chatStore = useChatStore()
const settingStore = useSettingStore()
const promptStore = usePromptStore()

const { isMobile } = useBasicLayout()
const { scrollRef, scrollToBottom, scrollToBottomIfAtBottom } = useScroll()

const cid = computed(() => chatStore.active)

const dataSources = computed(() => chatStore.getMessages(cid.value))

const usingContext = computed<boolean>(() => chatStore.getUsingContext(cid.value))

const prompt = ref<string>('')

const loadingIndex = ref<number>(-1)

const inputRef = ref<Ref | null>(null)

const debouncedSaveDraft = debounce((cid: CID | null, value: string) => {
  chatStore.updateDraftPrompt(cid, value)
}, 500)

const uploadedMedia = ref<{ id: string; name: string; type: string; content: string }[]>([])

watch(prompt, (value) => {
  debouncedSaveDraft(cid.value, value)
})

watch(cid, (newVal, oldVal) => {
  if (oldVal !== null) {
    resetState()
  }
})

onMounted(() => {
  resetState()
})

function resetState() {
  if (loadingIndex.value > -1) {
    controller.abort()
  }
  scrollToBottom()
  prompt.value = chatStore.getDraftPrompt(cid.value)
  if (!isMobile.value)
    inputRef.value.focus()
}

async function chatProcess(cid: CID | null, index: number, usingContext: boolean, regenerate: boolean = false) {
  chatStore.updateMessage(
    cid,
    index,
    {
      dateTime: new Date().toLocaleString(),
      text: t('chat.thinking'),
      inversion: false,
      error: false,
    },
  )
  loadingIndex.value = index

  let messages: PostMessage[] = buildContextMessages(cid, usingContext ? 0 : index - 1, index)
  controller = new AbortController()

  try {
    let lastText = ''
    const fetchChatAPIOnce = async () => {
      await fetchChatAPIProcess<ResponseChunk>({
        model: settingStore.model,
        messages,
        temperature: settingStore.temperature,
        top_p: settingStore.top_p,
        signal: controller.signal,
        onDownloadProgress: ({ event }) => {
          const xhr = event.target
          const { responseText } = xhr
          try {
            const chunks = responseText.trim().split('\n')
            const data: ResponseChunk[] = chunks.map((chunk: string) => JSON.parse(chunk))
            let error = false
            const text = lastText + data.map((response) => {
              if (response.error) {
                error = true
                return `[${response.error}]`
              }
              return response.delta_text || ''
            }).join('')
            chatStore.updateMessage(
              cid,
              index,
              {
                dateTime: new Date().toLocaleString(),
                text,
                error,
              },
            )
            if (!regenerate)
              scrollToBottomIfAtBottom()

            if (openLongReply && data[data.length - 1].stop_reason === 'length') {
              lastText = text
              messages = buildContextMessages(cid, usingContext ? 0 : index - 1, index + 1)
              messages.push({ role: 'user', content: '' })
              return fetchChatAPIOnce()
            }
          }
          catch { }
        },
      })
    }
    await fetchChatAPIOnce()
  }
  catch (error: any) {
    if (error.message === 'canceled')
      return

    const errorMessage = error?.message ?? t('common.wrong')
    chatStore.updateMessage(
      cid,
      index,
      {
        dateTime: new Date().toLocaleString(),
        text: `${chatStore.getMessage(cid, index)?.text || ''}\n[${errorMessage}]`,
        error: true,
      },
    )
    if (!regenerate)
      scrollToBottomIfAtBottom()
  }
  finally {
    loadingIndex.value = -1
  }
}

async function onConversation() {
  if (prompt.value.trim() === '/\u5154\u5154') {
    window.dispatchEvent(new Event('fallings'))
    prompt.value = ''
    return
  }
  if (loadingIndex.value > -1)
    return
  if (!prompt.value || prompt.value.trim() === '')
    return

  if (cid.value === null) {
    chatStore.addConversation()
  }

  const messageCid = cid.value
  const messageIndex = dataSources.value.length + 1

  chatStore.addMessage(messageCid, prompt.value, true)
  if (chatStore.getTitle(messageCid) === t('chat.newChatTitle')) {
    generateTitle(messageCid)
  }
  chatStore.addMessage(messageCid, t('chat.thinking'), false)
  scrollToBottom()
  prompt.value = ''

  await chatProcess(messageCid, messageIndex, usingContext.value)
}

async function onRegenerate(messageIndex: number) {
  if (loadingIndex.value > -1)
    return
  if (!dataSources.value[messageIndex - 1]?.inversion)
    return

  await chatProcess(cid.value, messageIndex, usingContext.value, true)
}

function toggleUsingContext() {
  chatStore.toggleUsingContext(cid.value)
  if (usingContext.value)
    ms.success(t('chat.turnOnContext'))
  else
    ms.warning(t('chat.turnOffContext'))
}

function handleSubmit() {
  onConversation()
}

function handleDelete(index: number) {
  if (loadingIndex.value > -1)
    return

  dialog.warning({
    title: t('chat.deleteMessage'),
    content: t('chat.deleteMessageConfirm'),
    positiveText: t('common.yes'),
    negativeText: t('common.no'),
    onPositiveClick: () => {
      chatStore.deleteMessage(cid.value, index)
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

function base64toBinaryBufferBlob(base64string: string, type: string) {
  const byteChars = atob(base64string)
  const byteNumbers = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i)
  }

  return new Blob([byteNumbers.buffer], { type })
}

function handleMultiMediaInput() {
  const multiMediaInput = document.getElementById('multiMediaInput')
  if (multiMediaInput)
    multiMediaInput.click()
}

function importMultiMedia(event: Event) {
  const target = event.target as HTMLInputElement
  if (!target || !target.files)
    return
  const file: File = target.files[0]
  if (!file)
    return
  const reader = new FileReader()
  reader.onload = (e) => {

    const base64data = e.target?.result?.toString()
    const stopAt = base64data?.indexOf(";") ?? 0
    const type = base64data?.substring(5, stopAt) ?? ''
    uploadedMedia.value.push({
      id: timestamp().toString(),
      name: file.name,
      type: type,
      content: base64data?.substring(stopAt + 8) ?? '',
    })
  }
  reader.onerror = (e) => {
    console.log("Error reading file:", e)
  }
  reader.readAsDataURL(file)

}

function handleDeleteMedia(key: string) {
  uploadedMedia.value = uploadedMedia.value.filter((item) => item.id !== key)
}

function handleDownloadMedia(key: string) {
  const item = uploadedMedia.value.find((item) => item.id === key)
  if (item) {
    const a = document.createElement('a')
    const blob = base64toBinaryBufferBlob(item.content, item.type)
    a.href = URL.createObjectURL(blob)
    a.download = item.name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }
}

function getMedia() {
  return uploadedMedia.value
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
  return loadingIndex.value > -1 || !prompt.value || prompt.value.trim() === ''
})
</script>

<template>
  <div class="flex flex-col w-full h-full">
    <HeaderComponent :loading="loadingIndex > -1" />
    <main class="flex-1 overflow-hidden relative flex justify-center">
      <div id="scrollRef" ref="scrollRef" class="w-full h-full overflow-hidden overflow-y-auto">
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
              <div v-for="(item, index) of dataSources" :key="item.mid">
                <Message
                  :cid="cid"
                  :index="index"
                  :date-time="item.dateTime"
                  :text="item.text"
                  :inversion="item.inversion"
                  :error="item.error"
                  :loading="loadingIndex === index"
                  @regenerate="onRegenerate(index)"
                  @delete="handleDelete(index)"
                />
              </div>
            </template>
          </div>
        </div>
      </div>
      <div class="absolute bottom-0">
        <NButton v-if="loadingIndex > -1" type="warning" @click="handleStop">
          <template #icon>
            <SvgIcon icon="ri:stop-circle-line" />
          </template>
          {{ t('common.stopResponding') }}
        </NButton>
      </div>
    </main>
    <footer :class="isMobile ? ['p-2', 'pr-3', 'overflow-hidden'] : ['p-4']">
      <div class="w-full max-w-screen-xl m-auto">
        <div class="flex items-center justify-between gap-2">

          <HoverButton @click="handleMultiMediaInput">
              <input id="multiMediaInput" type="file" style="display:none" @change="importMultiMedia">
              <span class="text-xl">
                <SvgIcon icon="ri:upload-2-line"/>
              </span>
          </HoverButton>

          <div>
            <FileCard v-for="item in uploadedMedia" :name="item.name" :id="item.id" @delete="handleDeleteMedia(item.id)" @download="handleDownloadMedia(item.id)"/>
          </div>

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
  