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
        closable
        hoverable
        @close="emit('delete', id)"
    >
        <button @click="emit('download', id)">
            <SvgIcon icon="ri:file-line" class="text-3xl"/>
            <p class="truncate">
                {{ props.name }}
            </p>
        </button>
    </NCard>
</template>