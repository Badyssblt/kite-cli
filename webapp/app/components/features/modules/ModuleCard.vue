<template>
    <div
        class="relative p-4 rounded-lg border-2 cursor-pointer transition-all"
        :class="selected
            ? 'border-primary/50 bg-primary/10'
            : 'border bg-muted hover:border-primary/50'"
        @click="selectModule"
    >
        <div
            v-if="selected"
            class="absolute top-2 right-2 size-5 rounded-full bg-primary flex items-center justify-center"
        >
            <Check class="size-3 text-primary-foreground" />
        </div>
        <p class="font-medium" :class="selected ? 'text-primary' : ''">{{ module.name }}</p>
        <p class="text-sm text-muted-foreground">{{ module.description }}</p>
    </div>
</template>

<script setup lang="ts">
import { Check } from 'lucide-vue-next'
import { ModuleType } from '~~/types/type'

const props = defineProps<{
    module: ModuleType,
    selected?: boolean
}>()

const emits = defineEmits<{
    (e: 'select', module: ModuleType): void
}>()

const selectModule = () => {
    emits('select', props.module)
}
</script>