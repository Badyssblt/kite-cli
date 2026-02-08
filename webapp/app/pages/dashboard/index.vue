<script setup lang="ts">
import { Plus, Folder, Sparkles, ArrowRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
definePageMeta({
  layout: 'dashboard',
})

const { data: session } = await useFetch('/api/session')
const { getProjects } = useProjects()
const { data: projects, pending } = await getProjects()

const user = computed(() => (session.value as any)?.user)
const projectCount = computed(() => projects.value?.length ?? 0)

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bonjour'
  if (hour < 18) return 'Bon après-midi'
  return 'Bonsoir'
})
</script>

<template>
  <div class="space-y-8">
    <!-- Welcome -->
    <div>
      <h1 class="text-2xl font-bold tracking-tight">
        {{ greeting }}, {{ user?.name || 'Utilisateur' }}
      </h1>
      <p class="text-muted-foreground mt-1">
        Voici un aperçu de votre espace.
      </p>
    </div>

    <!-- Stats -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Projets</CardTitle>
          <Folder class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ projectCount }}</div>
          <p class="text-xs text-muted-foreground mt-1">
            {{ projectCount === 0 ? 'Aucun projet pour le moment' : `projet${projectCount > 1 ? 's' : ''} créé${projectCount > 1 ? 's' : ''}` }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="flex flex-row items-center justify-between pb-2">
          <CardTitle class="text-sm font-medium">Démarrage rapide</CardTitle>
          <Sparkles class="size-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p class="text-sm text-muted-foreground">
            Créez un projet en quelques clics avec les presets.
          </p>
          <Button variant="link" as-child class="px-0 mt-2">
            <NuxtLink to="/dashboard/project/create">
              Créer un projet
              <ArrowRight class="size-3.5 ml-1" />
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Recent projects -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Projets récents</h2>

      <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card v-for="i in 3" :key="i" class="animate-pulse">
          <CardHeader>
            <div class="h-4 w-32 bg-muted rounded" />
            <div class="h-3 w-48 bg-muted rounded mt-2" />
          </CardHeader>
        </Card>
      </div>

      <div v-else-if="projectCount === 0" class="rounded-lg border border-dashed p-8 text-center">
        <Folder class="size-10 text-muted-foreground mx-auto mb-3" />
        <h3 class="font-medium">Aucun projet</h3>
        <p class="text-sm text-muted-foreground mt-1 mb-4">
          Commencez par créer votre premier projet.
        </p>
        <Button as-child>
          <NuxtLink to="/dashboard/project/create">
            <Plus class="size-4 mr-2" />
            Nouveau projet
          </NuxtLink>
        </Button>
      </div>

      <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          v-for="project in projects"
          :key="project.id"
          class="transition-colors hover:bg-muted/50 cursor-pointer"
        >
          <CardHeader>
            <div class="flex items-center justify-between">
              <CardTitle class="text-base">{{ project.name }}</CardTitle>
            </div>
            <CardDescription>
              {{ project.framework?.name || project.frameworkId }}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  </div>
</template>
