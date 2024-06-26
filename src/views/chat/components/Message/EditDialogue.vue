<script setup lang="ts">
import { ref } from 'vue'

interface Props {
    content?: string
}

interface Emit {
    edited: boolean,
    editedContent?: string
}
// interface Emit {
//     (ev: 'update', value: string): void
// }

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const originalContent = ref(props.content)
const editedContent = ref(props.content)

</script>

<template>
    <div>
        <input v-model="editedContent" :placeholder="originalContent" />
    </div>
    <!-- Button to emit message -->
</template>