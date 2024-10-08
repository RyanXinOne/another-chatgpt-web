<script setup lang='ts'>
import { computed } from 'vue'
import { NLayout, NLayoutContent } from 'naive-ui'
import Permission from './Permission.vue'
import Chat from '@/views/chat/index.vue'
import Sider from '@/views/sider/index.vue'
import FallingFallings from '@/components/custom/FallingFallings.vue'
import { useBasicLayout } from '@/hooks/useBasicLayout'
import { useAppStore, useAuthStore } from '@/store'

const appStore = useAppStore()
const authStore = useAuthStore()

const { isMobile } = useBasicLayout()

const collapsed = computed(() => appStore.siderCollapsed)

const needPermission = computed(() => !!authStore.session?.auth && !authStore.token)

const getMobileClass = computed(() => {
  if (isMobile.value)
    return ['rounded-none', 'shadow-none']
  return ['border', 'rounded-md', 'shadow-md', 'dark:border-neutral-800']
})

const getContainerClass = computed(() => {
  return [
    'h-full',
    { 'pl-[260px]': !isMobile.value && !collapsed.value },
  ]
})

async function setupPageGuard() {
  if (!authStore.session) {
    try {
      const data = await authStore.getSession()
      if (String(data.auth) === 'false' && authStore.token)
        authStore.removeToken()
    } catch {
      console.error('Failed to fetch session.')
    }
  }
}

setupPageGuard()
</script>

<template>
  <div class="h-full dark:bg-[#24272e] transition-all" :class="[isMobile ? 'p-0' : 'p-4']">
    <div class="h-full overflow-hidden" :class="getMobileClass">
      <NLayout class="z-40 transition" :class="getContainerClass" has-sider>
        <Sider />
        <NLayoutContent class="h-full">
          <Chat />
        </NLayoutContent>
      </NLayout>
    </div>
    <Permission :visible="needPermission" />
  </div>
  <FallingFallings />
</template>
