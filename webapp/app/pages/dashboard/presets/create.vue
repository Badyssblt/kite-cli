<script setup lang="ts">
import { toast } from 'vue-sonner';
import ModuleCard from '~/components/features/modules/ModuleCard.vue';
import ModuleConfigSidebar from '~/components/features/presets/ModuleConfigSidebar.vue';
import { useFrameworks } from '~/composables/useFrameworks';
import { useModules } from '~/composables/useModules';
import type { ModuleType, PresetType } from '~~/types/type';
import { usePresets } from '~/composables/usePresets';
import { getModulePrompts } from '~/data/module-prompts';

definePageMeta({
  layout: 'dashboard',
});

const { getFrameworks } = useFrameworks();
const { fetchModulesByFramework } = useModules();
const { createPreset: submitPreset } = usePresets();

const { data: frameworks } = await getFrameworks();

const presetName = ref('');
const presetDescription = ref('');
const selectedFramework = ref<string | null>(null);
const selectedModules = ref<string[]>([]);
const modules = ref<ModuleType[]>([]);
const moduleAnswers = ref<Record<string, Record<string, string | boolean>>>({});

const selectFramework = (framework: ModuleType) => {
  selectedFramework.value = framework.id;
};


const initModuleDefaults = (moduleId: string) => {
  const prompts = getModulePrompts(moduleId, selectedFramework.value ?? undefined);
  if (prompts.length === 0) return;

  const defaults: Record<string, string | boolean> = {};
  for (const prompt of prompts) {
    if (prompt.default !== undefined) {
      defaults[prompt.id] = prompt.default;
    }
  }
  if (Object.keys(defaults).length > 0) {
    moduleAnswers.value = { ...moduleAnswers.value, [moduleId]: defaults };
  }
};

const toggleModule = (mod: ModuleType) => {
  const idx = selectedModules.value.indexOf(mod.id);
  if (idx === -1) {
    selectedModules.value.push(mod.id);
    initModuleDefaults(mod.id);
  } else {
    selectedModules.value.splice(idx, 1);
    const updated = { ...moduleAnswers.value };
    delete updated[mod.id];
    moduleAnswers.value = updated;
  }
};

watch(selectedFramework, async (frameworkId) => {
  selectedModules.value = [];
  moduleAnswers.value = {};
  if (!frameworkId) {
    modules.value = [];
    return;
  }
  modules.value = await fetchModulesByFramework(frameworkId);
});

const isSubmitting = ref(false);
const router = useRouter();

const createPreset = async () => {
  if (!selectedFramework.value || selectedModules.value.length === 0) return;

  isSubmitting.value = true;

  try {
    const preset: PresetType = {
      name: presetName.value,
      description: presetDescription.value || undefined,
      framework: selectedFramework.value,
      modules: [...selectedModules.value],
      answers: Object.keys(moduleAnswers.value).length > 0 ? { ...moduleAnswers.value } : undefined,
    };

    await submitPreset(preset);
    toast.success('Preset créé !', { description: `"${presetName.value}" est prêt à l'emploi.` });
    router.push('/dashboard/presets');
  } catch (err: any) {
    toast.error('Erreur', { description: err.data?.message || err.message || 'Impossible de créer le preset' });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="relative h-[calc(100svh-theme(spacing.14)-theme(spacing.12))] overflow-hidden">
    <!-- Main content -->
    <div class="h-full flex flex-col">
      <div class="flex-1 overflow-y-auto p-6">
        <form class="max-w-2xl mx-auto space-y-6">
          <Label class="flex flex-col items-start gap-1.5">
            <span class="text-sm font-medium">Nom du preset</span>
            <Input v-model="presetName" placeholder="Mon preset" />
          </Label>

          <Label class="flex flex-col items-start gap-1.5">
            <span class="text-sm font-medium">Description</span>
            <Input v-model="presetDescription" placeholder="Description optionnelle" />
          </Label>

          <div class="space-y-3">
            <p class="text-sm font-medium">Frameworks disponibles</p>
            <div class="grid grid-cols-2 gap-3">
              <ModuleCard
                v-for="framework in frameworks"
                :key="framework.id"
                :module="framework"
                :selected="selectedFramework === framework.id"
                @select="selectFramework"
              />
            </div>
          </div>

          <div v-if="selectedFramework" class="space-y-3">
            <p class="text-sm font-medium">Modules disponibles</p>
            <div class="grid grid-cols-2 gap-3">
              <ModuleCard
                v-for="mod in modules"
                :key="mod.id"
                :module="mod"
                :selected="selectedModules.includes(mod.id)"
                @select="toggleModule"
              />
            </div>
          </div>
        </form>
      </div>

      <!-- Bouton fixé en bas -->
      <div class="border-t bg-background px-6 py-3">
        <Button @click="createPreset" class="w-full max-w-2xl mx-auto block" :disabled="isSubmitting || !presetName.trim() || !selectedFramework || selectedModules.length === 0">
          {{ isSubmitting ? 'Création...' : 'Créer le preset' }}
        </Button>
      </div>
    </div>

    <!-- Config sidebar -->
    <ModuleConfigSidebar
      :modules="modules"
      :selected-modules="selectedModules"
      :framework-id="selectedFramework"
      v-model:module-answers="moduleAnswers"
    />
  </div>
</template>
