<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    content: string
}

interface Emit {
    updatedContent: string
}
// interface Emit {
//     (ev: 'update', value: string): void
// }

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const originalContent = ref(props.content)
const updatedContent = ref(props.content)

</script>

<template>
    <div>
        <input v-model="updatedContent" :placeholder="originalContent" />
    </div>
</template>