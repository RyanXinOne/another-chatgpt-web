<script setup lang="ts" >
import { NCard } from 'naive-ui'
import { SvgIcon } from '@/components/common'

interface Props {
    id: string
    name: string
    size: number
}

interface Emit {
    (e: 'delete', id: string): void
    (e: 'download', id: string): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 bytes'
    const units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + units[i]

}

</script>

<template>
    <NCard
        size="small"
        hoverable
    >
        <div class="flex">
            <button class="pr-1" @click="emit('download', id)">
                <SvgIcon icon="ri:file-download-line" class="text-3xl"/>
            </button>
            <div class="truncate cursor-pointer flex-1 pr-1" @click="emit('download', id)">
                <p class="text-sm font-semibold text-neutral-900 dark:text-neutral-200">{{ props.name }}</p>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">{{ formatBytes(props.size) }} </p>
            </div>
            <button @click="emit('delete', id)" class="transition rounded-full hover:bg-neutral-100 dark:hover:bg-[#414755]">
                <SvgIcon icon="ri:close-line" class="text-xl"/>
            </button>
        </div>
    </NCard>
</template>