<script setup lang="ts">
import { MODULE_COLORS } from './types';

defineProps<{
  selectedModules: string[];
  fileCount: number;
}>();
</script>

<template>
  <div class="flex items-center justify-between px-3 py-1.5 bg-muted/50 border-t text-xs text-muted-foreground">
    <!-- Module Legend -->
    <div class="flex items-center gap-3">
      <div
        v-for="moduleId in selectedModules"
        :key="moduleId"
        class="flex items-center gap-1.5"
      >
        <span
          class="size-2 rounded-full"
          :class="MODULE_COLORS[moduleId]?.bg || 'bg-muted-foreground'"
        />
        <span>{{ moduleId }}</span>
      </div>
      <span v-if="selectedModules.length === 0" class="italic">Aucun module</span>
    </div>

    <!-- File Count -->
    <div>
      {{ fileCount }} fichier{{ fileCount > 1 ? 's' : '' }}
    </div>
  </div>
</template>
