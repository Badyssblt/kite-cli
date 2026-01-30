<script setup lang="ts">
import { ProjectCreator } from '~/components/features/project-creator';
import { getFrameworks } from '~/services/frameworkService';

definePageMeta({
  layout: 'dashboard',
});

const { data: frameworks } = await useAsyncData('frameworks', () => getFrameworks());
</script>

<template>
  <div class="h-[calc(100vh-120px)]">
    <ProjectCreator :frameworks="frameworks || []" />
  </div>
</template>
