<script setup lang="ts">
import { Check, Search } from 'lucide-vue-next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Framework, Module, Preset } from './types';
import { MODULE_COLORS } from './types';

const props = defineProps<{
  frameworks: Framework[];
  selectedFrameworkId: string;
  selectedModules: string[];
  projectName: string;
  presets: Preset[];
  activePresetId: string | null;
}>();

const emit = defineEmits<{
  'update:projectName': [value: string];
  'update:selectedFrameworkId': [value: string];
  'update:selectedModules': [value: string[]];
  'update:activePresetId': [value: string | null];
}>();

const activePreset = computed(() => {
  if (!props.activePresetId) return null;
  return props.presets.find((p) => p.id === props.activePresetId) || null;
});

const availableFrameworks = computed(() => {
  if (!activePreset.value) return props.frameworks;
  return props.frameworks.filter((fw) => activePreset.value!.frameworks.includes(fw.id));
});

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

const PRESETS_LIMIT = 5;
const presetSearch = ref('');
const showAllPresets = ref(false);

const filteredPresets = computed(() => {
  const query = presetSearch.value.toLowerCase().trim();
  if (!query) return props.presets;
  return props.presets.filter(
    (p) =>
      p.name.toLowerCase().includes(query) ||
      p.description?.toLowerCase().includes(query) ||
      p.modules.some((m) => m.toLowerCase().includes(query))
  );
});

const visiblePresets = computed(() => {
  if (showAllPresets.value || presetSearch.value.trim()) return filteredPresets.value;
  return filteredPresets.value.slice(0, PRESETS_LIMIT);
});

const hasMorePresets = computed(() => {
  return !showAllPresets.value && !presetSearch.value.trim() && filteredPresets.value.length > PRESETS_LIMIT;
});

function togglePreset(presetId: string) {
  if (props.activePresetId === presetId) {
    emit('update:activePresetId', null);
  } else {
    emit('update:activePresetId', presetId);
  }
}
</script>

<template>
  <div class="h-full flex flex-col bg-muted/30 border-l">
    <!-- Header -->
    <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
      Configuration
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-6">
      <!-- Presets -->
      <div v-if="presets.length" class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground uppercase">
          Presets
        </Label>

        <!-- Search -->
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            v-model="presetSearch"
            placeholder="Rechercher un preset..."
            class="h-8 pl-8 text-xs"
          />
        </div>

        <div class="space-y-2">
          <button
            v-for="preset in visiblePresets"
            :key="preset.id"
            class="w-full rounded-lg border p-3 text-left transition-all"
            :class="activePresetId === preset.id
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border hover:border-muted-foreground/30 hover:bg-muted/50'"
            @click="togglePreset(preset.id)"
          >
            <div class="flex items-start gap-3">
              <!-- Image or gradient placeholder -->
              <div
                class="size-10 rounded-md shrink-0 overflow-hidden"
                :class="!preset.image ? 'bg-gradient-to-br from-primary/40 to-primary/10' : ''"
              >
                <img
                  v-if="preset.image"
                  :src="preset.image"
                  :alt="preset.name"
                  class="size-full object-cover"
                />
              </div>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium truncate">{{ preset.name }}</div>
                <p v-if="preset.description" class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {{ preset.description }}
                </p>
              </div>
            </div>
            <!-- Module badges -->
            <div v-if="preset.modules.length" class="flex flex-wrap gap-1 mt-2">
              <span
                v-for="modId in preset.modules"
                :key="modId"
                class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted"
              >
                <span
                  class="size-1.5 rounded-full shrink-0"
                  :class="getModuleColor(modId).bg"
                />
                {{ modId }}
              </span>
            </div>
          </button>

          <!-- Show more / less -->
          <button
            v-if="hasMorePresets"
            class="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            @click="showAllPresets = true"
          >
            Voir plus ({{ filteredPresets.length - PRESETS_LIMIT }} autres)
          </button>
          <button
            v-else-if="showAllPresets && !presetSearch.trim() && filteredPresets.length > PRESETS_LIMIT"
            class="w-full text-xs text-muted-foreground hover:text-foreground py-1.5 transition-colors"
            @click="showAllPresets = false"
          >
            Voir moins
          </button>

          <!-- No results -->
          <p v-if="presetSearch.trim() && !filteredPresets.length" class="text-xs text-muted-foreground text-center py-2">
            Aucun preset trouvé
          </p>
        </div>
      </div>

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
            <SelectItem v-for="fw in availableFrameworks" :key="fw.id" :value="fw.id">
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
