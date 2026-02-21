<script setup lang="ts">
import { ArrowRight, Sparkles, Plus, Blocks } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { ProjectCreator } from '~/components/features/project-creator';
import { FRAMEWORK_VISUAL, MODULE_COLORS } from '~/components/features/project-creator/types';

definePageMeta({
  layout: 'dashboard',
});

const { getFrameworks } = useFrameworks();
const { getPresets } = usePresets();

const [{ data: frameworks }, { data: presets }] = await Promise.all([
  getFrameworks(),
  getPresets(),
]);

const route = useRoute();
const presetParam = route.query.preset as string | undefined;

const mode = ref<'entry' | 'configurator'>(presetParam ? 'configurator' : 'entry');
const selectedFrameworkId = ref('');
const initialPresetId = ref<string | null>(presetParam ?? null);

// Resolve framework from preset if deep-link
if (presetParam && presets.value) {
  const preset = presets.value.find(p => p.id === presetParam);
  if (preset?.frameworks.length) {
    selectedFrameworkId.value = preset.frameworks[0];
  } else {
    mode.value = 'entry';
    initialPresetId.value = null;
  }
}

function handleSelectFramework(frameworkId: string) {
  selectedFrameworkId.value = frameworkId;
  initialPresetId.value = null;
  mode.value = 'configurator';
}

function handleSelectPreset(presetId: string) {
  const preset = presets.value?.find(p => p.id === presetId);
  if (!preset?.frameworks.length) return;
  selectedFrameworkId.value = preset.frameworks[0];
  initialPresetId.value = presetId;
  mode.value = 'configurator';
}

function handleBack() {
  mode.value = 'entry';
  selectedFrameworkId.value = '';
  initialPresetId.value = null;
}

function getModuleColor(moduleId: string) {
  const suffix = moduleId.includes('-') ? moduleId.substring(moduleId.indexOf('-') + 1) : moduleId;
  return MODULE_COLORS[moduleId] || MODULE_COLORS[suffix] || { text: '', bg: 'bg-muted-foreground' };
}
</script>

<template>
  <!-- Entry screen -->
  <div
    v-if="mode === 'entry'"
    class="h-[calc(100svh-theme(spacing.14)-theme(spacing.12))] flex items-center justify-center p-6"
  >
    <div class="w-full max-w-3xl space-y-10">
      <div class="text-center space-y-2">
        <h1 class="text-2xl font-bold tracking-tight">Créer un projet</h1>
        <p class="text-muted-foreground">
          Choisissez un framework pour commencer
        </p>
      </div>

      <!-- Frameworks -->
      <div class="grid grid-cols-2 gap-4">
        <button
          v-for="fw in frameworks"
          :key="fw.id"
          class="group relative text-left rounded-xl border-2 border-border bg-card p-8 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/60 hover:shadow-md active:scale-[0.98] cursor-pointer"
          @click="handleSelectFramework(fw.id)"
        >
          <div class="flex items-center justify-between mb-4">
            <div
              class="flex items-center justify-center size-12 rounded-lg"
              :class="FRAMEWORK_VISUAL[fw.id]?.iconBg || 'bg-foreground/[0.06]'"
            >
              <Blocks
                class="size-6"
                :class="FRAMEWORK_VISUAL[fw.id]?.iconText || 'text-foreground'"
              />
            </div>
            <ArrowRight class="size-4 text-muted-foreground opacity-0 -translate-x-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0" />
          </div>
          <h2 class="text-lg font-semibold mb-1">{{ fw.name }}</h2>
          <p v-if="fw.description" class="text-sm text-muted-foreground leading-relaxed mb-3">
            {{ fw.description }}
          </p>
          <span class="text-xs text-muted-foreground">
            {{ fw.modules.length }} module{{ fw.modules.length > 1 ? 's' : '' }} disponible{{ fw.modules.length > 1 ? 's' : '' }}
          </span>
        </button>
      </div>

      <!-- Presets -->
      <div v-if="presets?.length" class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Sparkles class="size-4 text-muted-foreground" />
            <h2 class="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vos presets</h2>
          </div>
          <Button variant="ghost" size="sm" as-child>
            <NuxtLink to="/dashboard/presets/create" class="flex items-center gap-1.5">
              <Plus class="size-3.5" />
              Créer un preset
            </NuxtLink>
          </Button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            v-for="preset in presets"
            :key="preset.id"
            class="group text-left rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/60 hover:shadow-sm active:scale-[0.99] cursor-pointer"
            @click="handleSelectPreset(preset.id)"
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
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium truncate">{{ preset.name }}</span>
                  <ArrowRight class="size-3.5 text-muted-foreground opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 shrink-0 ml-2" />
                </div>
                <p v-if="preset.description" class="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {{ preset.description }}
                </p>
              </div>
            </div>
            <!-- Module badges -->
            <div v-if="preset.modules.length" class="flex flex-wrap gap-1 mt-2.5">
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
        </div>
      </div>
    </div>
  </div>

  <!-- Configurator -->
  <div
    v-else
    class="h-[calc(100svh-theme(spacing.14)-theme(spacing.12))]"
  >
    <ProjectCreator
      :key="selectedFrameworkId + '-' + (initialPresetId || '')"
      :frameworks="frameworks || []"
      :presets="presets || []"
      :initial-preset-id="initialPresetId"
      :initial-framework-id="selectedFrameworkId"
      @back="handleBack"
    />
  </div>
</template>
