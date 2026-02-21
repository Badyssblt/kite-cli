<script setup lang="ts">
import { Plus, Trash2, KeyRound } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { CommunityModuleEnvVar } from '~~/types/type'

const props = defineProps<{
  envVars: CommunityModuleEnvVar[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:envVars': [value: CommunityModuleEnvVar[]]
}>()

function addEnvVar() {
  emit('update:envVars', [...props.envVars, { key: '', defaultValue: '', description: '' }])
}

function removeEnvVar(index: number) {
  emit('update:envVars', props.envVars.filter((_, i) => i !== index))
}

function update(index: number, field: keyof CommunityModuleEnvVar, value: string) {
  const updated = props.envVars.map((e, i) => (i === index ? { ...e, [field]: value } : e))
  emit('update:envVars', updated)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Variables d'environnement requises par votre module (optionnel).
      </p>
      <Button v-if="!readonly" size="sm" variant="outline" @click="addEnvVar">
        <Plus class="size-4 mr-1" />
        Variable
      </Button>
    </div>

    <div v-if="envVars.length === 0" class="rounded-lg border border-dashed p-8 text-center">
      <KeyRound class="size-10 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">Aucune variable d'environnement ajoutée.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(env, index) in envVars"
        :key="index"
        class="rounded-md border p-3 space-y-3"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 space-y-1">
            <Label class="text-xs">Clé</Label>
            <Input
              :model-value="env.key"
              placeholder="MA_VARIABLE"
              :disabled="readonly"
              @update:model-value="update(index, 'key', $event as string)"
            />
          </div>
          <div class="flex-1 space-y-1">
            <Label class="text-xs">Valeur par défaut</Label>
            <Input
              :model-value="env.defaultValue"
              placeholder="valeur"
              :disabled="readonly"
              @update:model-value="update(index, 'defaultValue', $event as string)"
            />
          </div>
          <Button v-if="!readonly" size="icon" variant="ghost" class="mt-5" @click="removeEnvVar(index)">
            <Trash2 class="size-4 text-muted-foreground" />
          </Button>
        </div>
        <div class="space-y-1">
          <Label class="text-xs">Description</Label>
          <Input
            :model-value="env.description || ''"
            placeholder="Description de la variable (optionnel)"
            :disabled="readonly"
            @update:model-value="update(index, 'description', $event as string)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
