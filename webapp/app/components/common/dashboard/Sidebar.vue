<script setup lang="ts">
import { ChevronRight, Home, Folder, Plus, LogOut, User, ChevronsUpDown, Sparkles, Settings, Layers, Puzzle, Shield } from 'lucide-vue-next'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { authClient } from '~~/lib/auth-client'

const { data: session } = await useFetch('/api/session')
const { getProjects } = useProjects()
const { data: projects, pending } = await getProjects()

const router = useRouter()
const route = useRoute()

const user = computed(() => (session.value as any)?.user)
const isAdmin = computed(() => user.value?.role === 'ADMIN')

const userInitials = computed(() => {
  const name = user.value?.name || user.value?.email || ''
  return name.slice(0, 2).toUpperCase()
})

const projectItems = computed(() => {
  if (!projects.value?.length) return []
  return projects.value.map((project: any) => ({
    title: project.name,
    id: project.id,
  }))
})

const hasProjects = computed(() => (projects.value?.length ?? 0) > 0)

function isActive(path: string) {
  return route.path === path
}

async function handleSignOut() {
  await authClient.signOut()
  router.push('/login')
}
</script>

<template>
  <aside class="w-64 border-r bg-sidebar text-sidebar-foreground flex flex-col">
    <!-- Header -->
    <div class="p-4 border-b">
      <NuxtLink to="/dashboard" class="flex items-center gap-3">
        <div class="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles class="size-4" />
        </div>
        <div class="flex flex-col leading-none">
          <span class="font-semibold">Kite</span>
          <span class="text-xs text-muted-foreground">Boilerplate</span>
        </div>
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-2 space-y-1 overflow-y-auto">
      <!-- Dashboard -->
      <Button
        variant="ghost"
        as-child
        class="w-full justify-start gap-2"
        :class="isActive('/dashboard') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      >
        <NuxtLink to="/dashboard">
          <Home class="size-4" />
          <span>Dashboard</span>
        </NuxtLink>
      </Button>

      <!-- Nouveau projet -->
      <Button
        variant="ghost"
        as-child
        class="w-full justify-start gap-2"
        :class="isActive('/dashboard/project/create') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      >
        <NuxtLink to="/dashboard/project/create">
          <Plus class="size-4" />
          <span>Nouveau projet</span>
        </NuxtLink>
      </Button>

      <!-- Presets -->
      <Button
        variant="ghost"
        as-child
        class="w-full justify-start gap-2"
        :class="route.path.startsWith('/dashboard/presets') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      >
        <NuxtLink to="/dashboard/presets">
          <Layers class="size-4" />
          <span>Presets</span>
        </NuxtLink>
      </Button>

      <!-- Mes modules -->
      <Button
        variant="ghost"
        as-child
        class="w-full justify-start gap-2"
        :class="route.path.startsWith('/dashboard/modules') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      >
        <NuxtLink to="/dashboard/modules">
          <Puzzle class="size-4" />
          <span>Mes modules</span>
        </NuxtLink>
      </Button>
      <!-- Modération (admin only) -->
      <Button
        v-if="isAdmin"
        variant="ghost"
        as-child
        class="w-full justify-start gap-2"
        :class="route.path.startsWith('/dashboard/admin') ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''"
      >
        <NuxtLink to="/dashboard/admin/modules">
          <Shield class="size-4" />
          <span>Modération</span>
        </NuxtLink>
      </Button>

      <!-- Projets -->
      <Collapsible v-if="hasProjects" default-open class="group/collapsible">
        <CollapsibleTrigger as-child>
          <Button variant="ghost" class="w-full justify-start gap-2">
            <Folder class="size-4" />
            <span>Mes projets</span>
            <ChevronRight class="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent class="ml-4 mt-1 space-y-0.5 border-l pl-2">
          <div
            v-for="project in projectItems"
            :key="project.id"
            class="block rounded-md px-3 py-1.5 text-sm text-muted-foreground truncate"
          >
            {{ project.title }}
          </div>
        </CollapsibleContent>
      </Collapsible>

      

      <div v-else-if="!pending" class="px-3 py-2 text-xs text-muted-foreground">
        Aucun projet
      </div>

    </nav>

    <!-- User footer -->
    <div class="border-t p-2">
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <button class="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-sidebar-accent transition-colors">
            <Avatar class="size-8">
              <AvatarImage v-if="user?.image" :src="user.image" :alt="user?.name || ''" />
              <AvatarFallback class="text-xs">{{ userInitials }}</AvatarFallback>
            </Avatar>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium truncate">{{ user?.name || 'Utilisateur' }}</p>
              <p class="text-xs text-muted-foreground truncate">{{ user?.email }}</p>
            </div>
            <ChevronsUpDown class="size-4 text-muted-foreground shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-56" side="top" align="start" :side-offset="8">
          <DropdownMenuItem as-child>
            <NuxtLink to="/dashboard/profile" class="cursor-pointer">
              <User class="size-4 mr-2" />
              Profil
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuItem as-child>
            <NuxtLink to="/dashboard/settings" class="cursor-pointer">
              <Settings class="size-4 mr-2" />
              Paramètres
            </NuxtLink>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="cursor-pointer" @click="handleSignOut">
            <LogOut class="size-4 mr-2" />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </aside>
</template>
