<script setup lang="ts">
import DashboardSidebar from '~/components/common/dashboard/Sidebar.vue'

const { getProjects } = useProjects()
const { data: projects } = await getProjects()
</script>

<template>
  <div class="flex min-h-screen">
    <DashboardSidebar />
    <main class="flex-1 p-4">
      <slot />
    </main>
  </div>
</template>