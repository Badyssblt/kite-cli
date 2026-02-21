<script setup lang="ts">
import { Plus, Trash2, Package } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { CommunityModuleDependency } from '~~/types/type'

const props = defineProps<{
  dependencies: CommunityModuleDependency[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:dependencies': [value: CommunityModuleDependency[]]
}>()

function addDependency() {
  emit('update:dependencies', [...props.dependencies, { name: '', isDev: false }])
}

function removeDependency(index: number) {
  emit('update:dependencies', props.dependencies.filter((_, i) => i !== index))
}

function updateName(index: number, name: string) {
  const updated = props.dependencies.map((d, i) => (i === index ? { ...d, name } : d))
  emit('update:dependencies', updated)
}

function updateIsDev(index: number, isDev: boolean) {
  const updated = props.dependencies.map((d, i) => (i === index ? { ...d, isDev } : d))
  emit('update:dependencies', updated)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Packages npm nécessaires pour votre module (optionnel).
      </p>
      <Button v-if="!readonly" size="sm" variant="outline" @click="addDependency">
        <Plus class="size-4 mr-1" />
        Dépendance
      </Button>
    </div>

    <div v-if="dependencies.length === 0" class="rounded-lg border border-dashed p-8 text-center">
      <Package class="size-10 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">Aucune dépendance ajoutée.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(dep, index) in dependencies"
        :key="index"
        class="flex items-center gap-3 rounded-md border p-3"
      >
        <div class="flex-1">
          <Input
            :model-value="dep.name"
            placeholder="nom-du-package"
            :disabled="readonly"
            @update:model-value="updateName(index, $event as string)"
          />
        </div>
        <div class="flex items-center gap-2">
          <Label :for="`dev-${index}`" class="text-xs text-muted-foreground whitespace-nowrap">
            Dev
          </Label>
          <Switch
            :id="`dev-${index}`"
            :checked="dep.isDev"
            :disabled="readonly"
            @update:checked="updateIsDev(index, $event)"
          />
        </div>
        <Button v-if="!readonly" size="icon" variant="ghost" @click="removeDependency(index)">
          <Trash2 class="size-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  </div>
</template>
