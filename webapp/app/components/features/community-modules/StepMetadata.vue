<script setup lang="ts">
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MODULE_CATEGORIES } from '@/components/features/project-creator/types'

const props = defineProps<{
  name: string
  description: string
  frameworkId: string
  category: string
  frameworks: { id: string; name: string }[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:description': [value: string]
  'update:frameworkId': [value: string]
  'update:category': [value: string]
}>()

const categoryEntries = Object.entries(MODULE_CATEGORIES).sort(
  ([, a], [, b]) => a.order - b.order
)
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-2">
      <Label for="module-name">Nom du module *</Label>
      <Input
        id="module-name"
        :model-value="name"
        placeholder="mon-module"
        :disabled="readonly"
        @update:model-value="emit('update:name', $event as string)"
      />
    </div>

    <div class="space-y-2">
      <Label for="module-description">Description</Label>
      <textarea
        id="module-description"
        :value="description"
        placeholder="Décrivez votre module..."
        rows="3"
        :disabled="readonly"
        class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        @input="emit('update:description', ($event.target as HTMLTextAreaElement).value)"
      />
    </div>

    <div class="space-y-2">
      <Label>Framework *</Label>
      <Select
        :model-value="frameworkId"
        :disabled="readonly"
        @update:model-value="emit('update:frameworkId', $event as string)"
      >
        <SelectTrigger :disabled="readonly">
          <SelectValue placeholder="Choisir un framework" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="fw in frameworks" :key="fw.id" :value="fw.id">
            {{ fw.name }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="space-y-2">
      <Label>Catégorie *</Label>
      <Select
        :model-value="category"
        :disabled="readonly"
        @update:model-value="emit('update:category', $event as string)"
      >
        <SelectTrigger :disabled="readonly">
          <SelectValue placeholder="Choisir une catégorie" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="[key, cat] in categoryEntries" :key="key" :value="key">
            {{ cat.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>
</template>
