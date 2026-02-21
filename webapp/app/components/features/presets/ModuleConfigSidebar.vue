<script setup lang="ts">
import { X, Settings2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MODULE_COLORS } from '~/components/features/project-creator/types';
import {
  getModulePrompts,
  type ModulePromptDef,
} from '~/data/module-prompts';
import type { ModuleType } from '~~/types/type';

const props = defineProps<{
  modules: ModuleType[];
  selectedModules: string[];
  frameworkId: string | null;
  moduleAnswers: Record<string, Record<string, string | boolean>>;
}>();

const emit = defineEmits<{
  'update:moduleAnswers': [value: Record<string, Record<string, string | boolean>>];
}>();

/** Modules sélectionnés qui ont des prompts configurables */
const configurableModules = computed(() => {
  return props.selectedModules
    .map((id) => {
      const mod = props.modules.find((m) => m.id === id);
      const prompts = getModulePrompts(id, props.frameworkId ?? undefined);
      if (!mod || prompts.length === 0) return null;
      return { module: mod, prompts };
    })
    .filter(Boolean) as { module: ModuleType; prompts: ModulePromptDef[] }[];
});

const hasConfigurableModules = computed(() => configurableModules.value.length > 0);

function getAnswer(moduleId: string, promptId: string): string | boolean | undefined {
  return props.moduleAnswers[moduleId]?.[promptId];
}

function setAnswer(moduleId: string, promptId: string, value: string | boolean) {
  const updated = { ...props.moduleAnswers };
  
  if (!updated[moduleId]) updated[moduleId] = {};
  updated[moduleId] = { ...updated[moduleId], [promptId]: value };
  emit('update:moduleAnswers', updated);
}

function getModuleColor(moduleId: string) {
  return MODULE_COLORS[moduleId] || { text: 'text-muted-foreground', bg: 'bg-muted-foreground' };
}
</script>

<template>
  <aside
    class="absolute top-0 right-0 h-full w-80 border-l bg-background flex flex-col transition-transform duration-300 ease-out z-10"
    :class="hasConfigurableModules ? 'translate-x-0' : 'translate-x-full'"
  >
    <template v-if="hasConfigurableModules">
      <!-- Header -->
      <div class="px-4 py-3 border-b flex items-center gap-2">
        <Settings2 class="size-4 text-muted-foreground" />
        <h3 class="text-sm font-semibold">Configuration</h3>
        <Badge variant="secondary" class="ml-auto text-[10px]">
          {{ configurableModules.length }} module{{ configurableModules.length > 1 ? 's' : '' }}
        </Badge>
      </div>

      <!-- Scrollable content -->
      <div class="flex-1 overflow-y-auto">
        <div
          v-for="(item, idx) in configurableModules"
          :key="item.module.id"
        >
          <Separator v-if="idx > 0" />

          <!-- Module section -->
          <div class="p-4 space-y-3">
            <!-- Module name -->
            <div class="flex items-center gap-2">
              <span
                class="size-2 rounded-full shrink-0"
                :class="getModuleColor(item.module.id).bg"
              />
              <p class="text-sm font-medium">{{ item.module.name }}</p>
            </div>

            <!-- Prompts -->
            <div
              v-for="prompt in item.prompts"
              :key="prompt.id"
              class="space-y-1.5"
            >
              <Label class="text-xs text-muted-foreground">
                {{ prompt.message }}
              </Label>

              <!-- Select -->
              <Select
                v-if="prompt.type === 'select'"
                :model-value="(getAnswer(item.module.id, prompt.id) as string) ?? (prompt.default as string) ?? ''"
                @update:model-value="setAnswer(item.module.id, prompt.id, $event)"
              >
                <SelectTrigger class="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="choice in prompt.choices"
                    :key="choice.value"
                    :value="choice.value"
                  >
                    <div>
                      <span>{{ choice.name }}</span>
                      <span v-if="choice.description" class="text-muted-foreground ml-1">
                        — {{ choice.description }}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <!-- Input -->
              <Input
                v-else-if="prompt.type === 'input'"
                :model-value="(getAnswer(item.module.id, prompt.id) as string) ?? (prompt.default as string) ?? ''"
                class="h-8 text-xs"
                @update:model-value="setAnswer(item.module.id, prompt.id, $event)"
              />

              <!-- Confirm (Switch) -->
              <div
                v-else-if="prompt.type === 'confirm'"
                class="flex items-center justify-between"
              >
                <span class="text-xs text-foreground">
                  {{ (getAnswer(item.module.id, prompt.id) ?? prompt.default) ? 'Activé' : 'Désactivé' }}
                </span>
                <Switch
                  :checked="(getAnswer(item.module.id, prompt.id) as boolean) ?? (prompt.default as boolean) ?? false"
                  @update:modelValue="setAnswer(item.module.id, prompt.id, $event)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </aside>
</template>
