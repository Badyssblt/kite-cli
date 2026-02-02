<script setup lang="ts">
import { ChevronRight, Home, Settings, Users, FileText, BarChart3, Mail, Folder } from "lucide-vue-next"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"

const navigation = [
  {
    title: "Dashboard",
    icon: Home,
    url: "/dashboard",
  },
  {
    title: "Projets",
    icon: Folder,
    items: [
      { title: "Créer un projet", url: "/project/create" },
      
    ],
  }
]
</script>

<template>
  <aside class="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col">
    <div class="p-4 border-b">
      <h2 class="text-lg font-semibold">Mon App</h2>
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
            <NuxtLink
              v-for="subItem in item.items"
              :key="subItem.title"
              :to="subItem.url"
              class="block rounded-md px-3 py-2 text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              {{ subItem.title }}
            </NuxtLink>
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