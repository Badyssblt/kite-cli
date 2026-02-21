<script setup lang="ts">
import { Settings } from 'lucide-vue-next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import type { Module, ModulePrompt } from './types';
import { MODULE_COLORS } from './types';

defineProps<{
  modules: Module[];
  selectedModules: string[];
}>();

const open = defineModel<boolean>('open', { required: true });
const moduleAnswers = defineModel<Record<string, Record<string, string | boolean>>>('moduleAnswers', { required: true });

function getSimpleId(compositeId: string): string {
  const idx = compositeId.indexOf('-');
  return idx !== -1 ? compositeId.slice(idx + 1) : compositeId;
}

function getModuleColor(moduleId: string) {
  const suffix = getSimpleId(moduleId);
  return MODULE_COLORS[moduleId] || MODULE_COLORS[suffix] || { text: '', bg: 'bg-muted-foreground' };
}

function getAnswer(moduleId: string, prompt: ModulePrompt): string | boolean {
  const simpleId = getSimpleId(moduleId);
  const moduleAnswersMap = moduleAnswers.value[simpleId];
  if (moduleAnswersMap && prompt.id in moduleAnswersMap) {
    return moduleAnswersMap[prompt.id];
  }
  return prompt.default ?? (prompt.type === 'confirm' ? false : '');
}

function setAnswer(moduleId: string, promptId: string, value: string | boolean) {
  const simpleId = getSimpleId(moduleId);
  const updated = { ...moduleAnswers.value };
  if (!updated[simpleId]) {
    updated[simpleId] = {};
  }
  updated[simpleId] = { ...updated[simpleId], [promptId]: value };
  moduleAnswers.value = updated;
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent side="right" class="w-[420px] flex flex-col p-0">
      <SheetHeader class="px-6 pt-6 pb-4 border-b">
        <div class="flex items-center gap-2">
          <div class="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <Settings class="size-4 text-primary" />
          </div>
          <div>
            <SheetTitle>Configuration</SheetTitle>
            <SheetDescription class="mt-0.5">
              {{ modules.length }} module{{ modules.length > 1 ? 's' : '' }} configurable{{ modules.length > 1 ? 's' : '' }}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <div
          v-for="mod in modules"
          :key="mod.id"
          class="rounded-lg border bg-card overflow-hidden"
        >
          <!-- Module header -->
          <div class="flex items-center gap-2.5 px-4 py-3 bg-muted/40 border-b">
            <span
              class="size-2.5 rounded-full shrink-0"
              :class="getModuleColor(mod.id).bg"
            />
            <span class="text-sm font-semibold flex-1">{{ mod.name }}</span>
            <Badge variant="secondary" class="text-[10px]">
              {{ mod.prompts?.length }} option{{ (mod.prompts?.length || 0) > 1 ? 's' : '' }}
            </Badge>
          </div>

          <!-- Prompts -->
          <div class="px-4 py-3 space-y-4">
            <div v-for="prompt in mod.prompts" :key="prompt.id">
              <!-- Select -->
              <template v-if="prompt.type === 'select'">
                <Label class="text-xs font-medium text-muted-foreground mb-1.5 block">{{ prompt.message }}</Label>
                <Select
                  :model-value="String(getAnswer(mod.id, prompt))"
                  @update:model-value="setAnswer(mod.id, prompt.id, $event)"
                >
                  <SelectTrigger class="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="choice in prompt.choices"
                      :key="choice.value"
                      :value="choice.value"
                    >
                      <div>
                        <div>{{ choice.name }}</div>

                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </template>

              <!-- Confirm -->
              <template v-else-if="prompt.type === 'confirm'">
                <div class="flex items-center justify-between gap-3 py-0.5">
                  <Label class="text-xs font-medium text-muted-foreground">{{ prompt.message }}</Label>
                  <Switch
                    :checked="Boolean(getAnswer(mod.id, prompt))"
                    @update:checked="setAnswer(mod.id, prompt.id, $event)"
                  />
                </div>
              </template>

              <!-- Input -->
              <template v-else-if="prompt.type === 'input'">
                <Label class="text-xs font-medium text-muted-foreground mb-1.5 block">{{ prompt.message }}</Label>
                <Input
                  :model-value="String(getAnswer(mod.id, prompt))"
                  class="h-9 text-xs"
                  @update:model-value="setAnswer(mod.id, prompt.id, $event)"
                />
              </template>
            </div>
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
</template>
