<script setup lang="ts">
import { Plus, Sparkles, Package, Layers } from 'lucide-vue-next';
import { MODULE_COLORS } from '~/components/features/project-creator/types';

definePageMeta({
  layout: 'dashboard',
});

const { getPresets } = usePresets();
const { data: presets, status } = await getPresets();

function getModuleColor(moduleId: string) {
  return MODULE_COLORS[moduleId] || { text: 'text-muted-foreground', bg: 'bg-muted-foreground' };
}
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Presets</h1>
        <p class="text-sm text-muted-foreground mt-1">
          Vos configurations pré-faites pour démarrer un projet en un clic.
        </p>
      </div>
      <Button as-child>
        <NuxtLink to="/dashboard/presets/create">
          <Plus class="size-4 mr-2" />
          Créer un preset
        </NuxtLink>
      </Button>
    </div>

    <!-- Empty state -->
    <div
      v-if="!presets?.length && status !== 'pending'"
      class="flex flex-col items-center justify-center py-20 space-y-4"
    >
      <div class="flex items-center justify-center size-14 rounded-xl bg-muted">
        <Sparkles class="size-6 text-muted-foreground" />
      </div>
      <div class="text-center space-y-1">
        <p class="font-medium">Aucun preset</p>
        <p class="text-sm text-muted-foreground">
          Créez votre premier preset pour accélérer la création de projets.
        </p>
      </div>
      <Button as-child variant="outline" size="sm">
        <NuxtLink to="/dashboard/presets/create">
          <Plus class="size-4 mr-2" />
          Créer un preset
        </NuxtLink>
      </Button>
    </div>

    <!-- Preset list -->
    <div v-else class="grid gap-3">
      <NuxtLink
        v-for="preset in presets"
        :key="preset.id"
        :to="`/dashboard/project/create?preset=${preset.id}`"
        class="group flex items-start gap-4 rounded-xl border-2 border-border bg-card p-5 transition-all duration-200 hover:border-foreground/20 hover:bg-muted/60 hover:shadow-md"
      >
        <!-- Image or placeholder -->
        <div
          class="size-12 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
          :class="preset.image ? '' : 'bg-foreground/[0.06] dark:bg-foreground/[0.1]'"
        >
          <img
            v-if="preset.image"
            :src="preset.image"
            :alt="preset.name"
            class="size-full object-cover"
          />
          <Sparkles v-else class="size-5 text-muted-foreground" />
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <h2 class="text-sm font-semibold truncate">{{ preset.name }}</h2>
          </div>

          <p
            v-if="preset.description"
            class="text-xs text-muted-foreground line-clamp-1 mb-2.5"
          >
            {{ preset.description }}
          </p>

          <div class="flex items-center gap-3">
            <!-- Frameworks -->
            <div class="flex items-center gap-1.5">
              <Layers class="size-3 text-muted-foreground shrink-0" />
              <div class="flex gap-1">
                <span
                  v-for="fw in preset.frameworks"
                  :key="fw"
                  class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground"
                >
                  {{ fw }}
                </span>
              </div>
            </div>

            <!-- Modules -->
            <div class="flex items-center gap-1.5">
              <Package class="size-3 text-muted-foreground shrink-0" />
              <div class="flex gap-1 flex-wrap">
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
            </div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
