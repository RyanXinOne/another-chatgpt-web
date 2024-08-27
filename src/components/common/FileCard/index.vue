<script setup lang="ts" >
import { NCard } from 'naive-ui'
import { SvgIcon } from '@/components/common'

interface Props {
    id: string
    name: string
}

interface Emit {
    (e: 'delete', id: string): void
    (e: 'download', id: string): void
}

const props = defineProps<Props>()

const emit = defineEmits<Emit>()

</script>

<template>
    <NCard
        size="small"
        hoverable
    >
        <div class="flex">
            <button class="pr-1" @click="emit('download', id)">
                <SvgIcon icon="ri:file-line" class="text-xl"/>
            </button>
            <div class="truncate cursor-pointer flex-1 pr-1" @click="emit('download', id)">
                <span>{{ props.name }}</span>
            </div>
            <button @click="emit('delete', id)" class="transition rounded-full hover:bg-neutral-100 dark:hover:bg-[#414755]">
                <SvgIcon icon="ri:close-line" class="text-xl"/>
            </button>
        </div>
    </NCard>
</template>