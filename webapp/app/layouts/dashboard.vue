<script setup lang="ts">
import DashboardSidebar from '~/components/common/dashboard/Sidebar.vue'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const route = useRoute()

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  const items: Array<{ label: string; path?: string }> = []

  const labels: Record<string, string> = {
    dashboard: 'Dashboard',
    project: 'Projets',
    create: 'Nouveau projet',
    profile: 'Profil',
    settings: 'Paramètres',
  }

  let currentPath = ''
  for (let i = 0; i < parts.length; i++) {
    currentPath += `/${parts[i]}`
    const label = labels[parts[i]] || parts[i]
    const isLast = i === parts.length - 1
    items.push({ label, path: isLast ? undefined : currentPath })
  }

  return items
})
</script>

<template>
  <div class="flex min-h-screen">
    <DashboardSidebar />
    <div class="flex-1 flex flex-col">
      <header class="flex h-14 shrink-0 items-center gap-2 border-b px-6">
        <Breadcrumb>
          <BreadcrumbList>
            <template v-for="(crumb, index) in breadcrumbs" :key="index">
              <BreadcrumbSeparator v-if="index > 0" />
              <BreadcrumbItem>
                <BreadcrumbLink v-if="crumb.path" as-child>
                  <NuxtLink :to="crumb.path">{{ crumb.label }}</NuxtLink>
                </BreadcrumbLink>
                <BreadcrumbPage v-else>{{ crumb.label }}</BreadcrumbPage>
              </BreadcrumbItem>
            </template>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <main class="flex-1 p-6">
        <slot />
      </main>
    </div>
  </div>
</template>
