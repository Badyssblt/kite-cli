<script setup lang="ts">
import { Check, Search, ChevronRight, Settings } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Framework, Module } from './types';
import { MODULE_COLORS, MODULE_CATEGORIES } from './types';

const props = defineProps<{
  frameworks: Framework[];
  selectedFrameworkId: string;
  selectedModules: string[];
  projectName: string;
  packageManager: string;
}>();

const emit = defineEmits<{
  'update:projectName': [value: string];
  'update:selectedModules': [value: string[]];
  'update:packageManager': [value: string];
  'openConfig': [];
}>();

const PACKAGE_MANAGERS = [
  { id: 'npm', name: 'npm' },
  { id: 'pnpm', name: 'pnpm' },
  { id: 'yarn', name: 'yarn' },
  { id: 'bun', name: 'bun' },
];

const selectedFramework = computed(() => {
  return props.frameworks.find(fw => fw.id === props.selectedFrameworkId);
});

const modules = computed(() => {
  return (selectedFramework.value?.modules || []).slice().sort((a, b) => {
    return (a.name || '').localeCompare(b.name || '');
  });
});

// Module search & categories
const moduleSearch = ref('');
const openCategories = ref<Set<string>>(new Set());

const filteredModules = computed(() => {
  const query = moduleSearch.value.toLowerCase().trim();
  if (!query) return modules.value;
  return modules.value.filter(
    (m) =>
      m.name.toLowerCase().includes(query) ||
      m.description?.toLowerCase().includes(query)
  );
});

const modulesByCategory = computed(() => {
  const grouped: Record<string, Module[]> = {};
  for (const mod of filteredModules.value) {
    const cat = mod.category || 'other';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(mod);
  }
  return grouped;
});

const sortedCategories = computed(() => {
  return Object.keys(modulesByCategory.value).sort((a, b) => {
    const orderA = MODULE_CATEGORIES[a]?.order ?? 99;
    const orderB = MODULE_CATEGORIES[b]?.order ?? 99;
    return orderA - orderB;
  });
});

function selectedCountForCategory(cat: string): number {
  return (modulesByCategory.value[cat] || []).filter((m) =>
    props.selectedModules.includes(m.id)
  ).length;
}

const totalSelectedCount = computed(() => props.selectedModules.length);

const configurableModulesCount = computed(() => {
  return modules.value.filter(
    m => props.selectedModules.includes(m.id) && m.prompts && m.prompts.length > 0
  ).length;
});

// Open all categories when framework changes
watch(
  () => props.selectedFrameworkId,
  () => {
    openCategories.value = new Set(sortedCategories.value);
  }
);

// Open categories of selected modules when selection changes (e.g. via preset)
watch(
  () => props.selectedModules,
  (newVal) => {
    for (const mod of modules.value) {
      if (newVal.includes(mod.id)) {
        openCategories.value.add(mod.category || 'other');
      }
    }
  }
);

function toggleCategory(cat: string) {
  if (openCategories.value.has(cat)) {
    openCategories.value.delete(cat);
  } else {
    openCategories.value.add(cat);
  }
}

function toggleModule(moduleId: string) {
  const newModules = props.selectedModules.includes(moduleId)
    ? props.selectedModules.filter(id => id !== moduleId)
    : [...props.selectedModules, moduleId];
  emit('update:selectedModules', newModules);
}

function getModuleColor(moduleId: string) {
  // Support composite ids (e.g. "nuxt-prisma" -> lookup "prisma")
  const suffix = moduleId.includes('-') ? moduleId.substring(moduleId.indexOf('-') + 1) : moduleId;
  return MODULE_COLORS[moduleId] || MODULE_COLORS[suffix] || { text: '', bg: 'bg-muted-foreground' };
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

      <!-- Package Manager -->
      <div class="space-y-2">
        <Label class="text-xs font-medium text-muted-foreground uppercase">
          Package Manager
        </Label>
        <Select
          :model-value="packageManager"
          @update:model-value="emit('update:packageManager', $event)"
        >
          <SelectTrigger class="h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="pm in PACKAGE_MANAGERS" :key="pm.id" :value="pm.id">
              {{ pm.name }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <!-- Modules -->
      <div v-if="selectedFrameworkId" class="space-y-3">
        <div class="flex items-center justify-between">
          <Label class="text-xs font-medium text-muted-foreground uppercase">
            Modules
          </Label>
          <span v-if="totalSelectedCount > 0" class="text-xs text-muted-foreground">
            {{ totalSelectedCount }} sélectionné{{ totalSelectedCount > 1 ? 's' : '' }}
          </span>
        </div>

        <!-- Module search -->
        <div class="relative">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            v-model="moduleSearch"
            placeholder="Rechercher un module..."
            class="h-8 pl-8 text-xs"
          />
        </div>

        <!-- Categories -->
        <div class="space-y-1">
          <Collapsible
            v-for="cat in sortedCategories"
            :key="cat"
            :open="openCategories.has(cat)"
          >
            <CollapsibleTrigger
              class="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-sm font-medium hover:bg-muted transition-colors"
              @click="toggleCategory(cat)"
            >
              <ChevronRight
                class="size-3.5 text-muted-foreground transition-transform duration-200"
                :class="openCategories.has(cat) ? 'rotate-90' : ''"
              />
              <span class="flex-1 text-left text-xs uppercase tracking-wide text-muted-foreground">
                {{ MODULE_CATEGORIES[cat]?.label || cat }}
              </span>
              <span
                v-if="selectedCountForCategory(cat) > 0"
                class="text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5"
              >
                {{ selectedCountForCategory(cat) }}
              </span>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div class="space-y-0.5 mt-0.5">
                <button
                  v-for="mod in modulesByCategory[cat]"
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
                      <Badge
                        v-if="mod.isCommunity"
                        variant="outline"
                        class="text-[10px] px-1 py-0 border-amber-500/50 text-amber-500"
                      >
                        Communautaire
                      </Badge>
                      <Badge
                        v-else
                        variant="outline"
                        class="text-[10px] px-1 py-0 border-blue-500/50 text-blue-500"
                      >
                        Officiel
                      </Badge>
                    </div>
                    <p v-if="mod.description" class="text-xs text-muted-foreground truncate mt-0.5">
                      {{ mod.description }}
                    </p>
                  </div>
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <!-- No results -->
          <p v-if="moduleSearch.trim() && !sortedCategories.length" class="text-xs text-muted-foreground text-center py-3">
            Aucun module trouvé
          </p>
        </div>

      </div>
    </div>

    <!-- Sticky configure button -->
    <div v-if="configurableModulesCount > 0" class="px-4 py-3 border-t bg-background">
      <Button
        class="w-full"
        size="sm"
        @click="emit('openConfig')"
      >
        <Settings class="size-4 mr-2" />
        Configurer {{ configurableModulesCount }} module{{ configurableModulesCount > 1 ? 's' : '' }}
      </Button>
    </div>
  </div>
</template>
