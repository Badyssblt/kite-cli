<script setup lang="ts">
import { ProjectCreator } from '~/components/features/project-creator';
import { getFrameworks } from '~/services/frameworkService';
import { getPresets } from '~/services/presetService';

definePageMeta({
  layout: 'dashboard',
});

const [{ data: frameworks }, { data: presets }] = await Promise.all([
  useAsyncData('frameworks', () => getFrameworks()),
  useAsyncData('presets', () => getPresets()),
]);
</script>

<template>
  <div class="h-[calc(100svh-theme(spacing.14)-theme(spacing.12))]">
    <ProjectCreator :frameworks="frameworks || []" :presets="presets || []" />
  </div>
</template>
