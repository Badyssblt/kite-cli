<script setup lang="ts">
import { Plus, Trash2, MessageSquare } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { CommunityModulePrompt } from '~~/types/type'

const props = defineProps<{
  prompts: CommunityModulePrompt[]
  readonly?: boolean
}>()

const emit = defineEmits<{
  'update:prompts': [value: CommunityModulePrompt[]]
}>()

function addPrompt() {
  const id = `prompt_${Date.now()}`
  emit('update:prompts', [...props.prompts, { id, type: 'input', message: '' }])
}

function removePrompt(index: number) {
  emit('update:prompts', props.prompts.filter((_, i) => i !== index))
}

function updateField(index: number, field: string, value: any) {
  const updated = props.prompts.map((p, i) => {
    if (i !== index) return p
    const copy = { ...p, [field]: value }
    // Clear choices when switching away from select
    if (field === 'type' && value !== 'select') {
      delete copy.choices
    }
    // Set default for confirm type
    if (field === 'type' && value === 'confirm') {
      copy.default = false
    }
    return copy
  })
  emit('update:prompts', updated)
}

function updateChoices(index: number, raw: string) {
  const choices = raw.split(',').map((c) => c.trim()).filter(Boolean)
  updateField(index, 'choices', choices)
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <p class="text-sm text-muted-foreground">
        Prompts interactifs posés à l'utilisateur lors de l'installation (optionnel).
      </p>
      <Button v-if="!readonly" size="sm" variant="outline" @click="addPrompt">
        <Plus class="size-4 mr-1" />
        Prompt
      </Button>
    </div>

    <div v-if="prompts.length === 0" class="rounded-lg border border-dashed p-8 text-center">
      <MessageSquare class="size-10 text-muted-foreground mx-auto mb-3" />
      <p class="text-sm text-muted-foreground">Aucun prompt ajouté.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="(prompt, index) in prompts"
        :key="prompt.id"
        class="rounded-md border p-3 space-y-3"
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 space-y-1">
            <Label class="text-xs">Type</Label>
            <Select
              :model-value="prompt.type"
              :disabled="readonly"
              @update:model-value="updateField(index, 'type', $event)"
            >
              <SelectTrigger :disabled="readonly">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="input">Texte (input)</SelectItem>
                <SelectItem value="select">Choix (select)</SelectItem>
                <SelectItem value="confirm">Confirmation (oui/non)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button v-if="!readonly" size="icon" variant="ghost" class="mt-5" @click="removePrompt(index)">
            <Trash2 class="size-4 text-muted-foreground" />
          </Button>
        </div>

        <div class="space-y-1">
          <Label class="text-xs">Message</Label>
          <Input
            :model-value="prompt.message"
            placeholder="Question posée à l'utilisateur"
            :disabled="readonly"
            @update:model-value="updateField(index, 'message', $event)"
          />
        </div>

        <div v-if="prompt.type === 'select'" class="space-y-1">
          <Label class="text-xs">Choix (séparés par des virgules)</Label>
          <Input
            :model-value="(prompt.choices || []).join(', ')"
            placeholder="option1, option2, option3"
            :disabled="readonly"
            @update:model-value="updateChoices(index, $event as string)"
          />
        </div>

        <div v-if="prompt.type === 'input'" class="space-y-1">
          <Label class="text-xs">Valeur par défaut</Label>
          <Input
            :model-value="(prompt.default as string) || ''"
            placeholder="Valeur par défaut (optionnel)"
            :disabled="readonly"
            @update:model-value="updateField(index, 'default', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
