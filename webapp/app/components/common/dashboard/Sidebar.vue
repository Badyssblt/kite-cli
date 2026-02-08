<script setup lang="ts">
import { ChevronRight, Home, Settings, Users, FileText, BarChart3, Mail, Folder } from "lucide-vue-next"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

const { getProjects } = useProjects()
const { data: projects, pending, error } = await getProjects()

const projectItems = computed(() => {
  const items = [{ title: "Créer un projet", url: "/dashboard/project/create" }]

  if (!projects.value?.length) {
    return items
  }

  return [
    ...items,
    ...projects.value.map((project) => ({
      title: project.name,
    })),
  ]
})

const hasProjects = computed(() => (projects.value?.length ?? 0) > 0)

const navigation = computed(() => [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: Home,
    url: "/dashboard",
  },
  {
    id: "projects",
    title: "Projets",
    icon: Folder,
    items: projectItems.value,
  },
])
</script>

<template>
  <aside class="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">Kite Boilerplate</h2>
    </div>

    <nav class="flex-1 p-2 space-y-1">
      <template v-for="item in navigation" :key="item.title">
        <!-- Item avec sous-menu (collapsible) -->
        <Collapsible v-if="item.items" default-open class="group/collapsible">
          <CollapsibleTrigger as-child>
            <Button variant="ghost" class="w-full justify-start gap-2">
              <component :is="item.icon" class="size-4" />
              <span>{{ item.title }}</span>
              <ChevronRight class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent class="ml-4 mt-1 space-y-1 border-l pl-2">
            <template v-for="subItem in item.items" :key="subItem.title">
              <NuxtLink
                v-if="subItem.url"
                :to="subItem.url"
                class="block rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                {{ subItem.title }}
              </NuxtLink>
              <div
                v-else
                class="block rounded-md px-3 py-2 text-sm text-muted-foreground"
              >
                {{ subItem.title }}
              </div>
            </template>
            <div
              v-if="item.id === 'projects'"
              class="px-3 py-2 text-xs text-muted-foreground"
            >
              <span v-if="pending">Chargement...</span>
              <span v-else-if="error">Impossible de charger les projets</span>
              <span v-else-if="!hasProjects">Aucun projet pour le moment</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <!-- Item simple -->
        <Button v-else variant="ghost" as-child class="w-full justify-start gap-2">
          <NuxtLink :to="item.url">
            <component :is="item.icon" class="size-4" />
            <span>{{ item.title }}</span>
          </NuxtLink>
        </Button>
      </template>
    </nav>

    <div class="p-4 border-t">
      <p class="text-xs text-muted-foreground">v1.0.0</p>
    </div>
  </aside>
</template>
