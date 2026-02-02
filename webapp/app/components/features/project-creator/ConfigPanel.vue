<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Framework, Module } from './types';
import { MODULE_COLORS } from './types';

const props = defineProps<{
  frameworks: Framework[];
  selectedFrameworkId: string;
  selectedModules: string[];
  projectName: string;
}>();

const emit = defineEmits<{
  'update:projectName': [value: string];
  'update:selectedFrameworkId': [value: string];
  'update:selectedModules': [value: string[]];
}>();

const selectedFramework = computed(() => {
  return props.frameworks.find(fw => fw.id === props.selectedFrameworkId);
});

const modules = computed(() => {
  return (selectedFramework.value?.modules || []).slice().sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '');
  });
});

function toggleModule(moduleId: string) {
  const newModules = props.selectedModules.includes(moduleId)
    ? props.selectedModules.filter(id => id !== moduleId)
    : [...props.selectedModules, moduleId];
  emit('update:selectedModules', newModules);
}

function getModuleColor(moduleId: string) {
  return MODULE_COLORS[moduleId] || { text: '', bg: 'bg-muted-foreground' };
}
</script>

<template>
  <div class="h-full flex flex-col bg-muted/30 border-l">
    <!-- Header -->
    <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
      Configuration
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Project Name -->
      <div class="space-y-2">
        <Label for="projectName" class="text-xs font-medium text-muted-foreground uppercase">
          Nom du projet
        </Label>
        <Input
          id="projectName"
          :model-value="projectName"
          placeholder="my-project"
          class="h-9"
          @update:model-value="emit('update:projectName', $event)"
        />
      </div>

      <!-- Framework -->
      <div class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground uppercase">
          Framework
        </Label>
        <Select
          :model-value="selectedFrameworkId"
          @update:model-value="emit('update:selectedFrameworkId', $event)"
        >
          <SelectTrigger class="h-9">
            <SelectValue placeholder="Choisir un framework" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="fw in frameworks" :key="fw.id" :value="fw.id">
              {{ fw.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Modules -->
      <div v-if="selectedFrameworkId" class="space-y-3">
        <Label class="text-xs font-medium text-muted-foreground uppercase">
          Modules
        </Label>

        <div class="space-y-1">
          <button
            v-for="mod in modules"
            :key="mod.id"
            class="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors"
            :class="selectedModules.includes(mod.id) ? 'bg-primary/10' : 'hover:bg-muted'"
            @click="toggleModule(mod.id)"
          >
            <!-- Checkbox -->
            <div
              class="size-4 rounded border-2 flex items-center justify-center transition-colors shrink-0"
              :class="selectedModules.includes(mod.id)
                ? 'bg-primary border-primary'
                : 'border-muted-foreground/30'"
            >
              <Check v-if="selectedModules.includes(mod.id)" class="size-3 text-primary-foreground" />
            </div>

            <!-- Module Info -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span
                  class="size-2 rounded-full shrink-0"
                  :class="getModuleColor(mod.id).bg"
                />
                <span class="font-medium truncate" :class="selectedModules.includes(mod.id) ? getModuleColor(mod.id).text : ''">
                  {{ mod.name }}
                </span>
              </div>
              <p v-if="mod.description" class="text-xs text-muted-foreground truncate mt-0.5">
                {{ mod.description }}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
