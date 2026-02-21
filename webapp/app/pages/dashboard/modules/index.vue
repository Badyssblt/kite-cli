<script setup lang="ts">
import { Plus, Puzzle, Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ModuleStatusBadge from '~/components/features/community-modules/ModuleStatusBadge.vue'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'dashboard',
})

const { getMyModules, deleteModule } = useCommunityModules()
const { data: modules, pending, refresh } = await getMyModules()

async function handleDelete(id: string) {
  if (!confirm('Supprimer ce module ?')) return
  try {
    await deleteModule(id)
    toast.success('Module supprimé')
    refresh()
  } catch {
    toast.error('Erreur lors de la suppression')
  }
}
</script>

<template>
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold tracking-tight">Mes modules</h1>
        <p class="text-muted-foreground mt-1">
          Créez et gérez vos modules communautaires.
        </p>
      </div>
      <Button as-child>
        <NuxtLink to="/dashboard/modules/create">
          <Plus class="size-4 mr-2" />
          Créer un module
        </NuxtLink>
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <CardHeader>
          <div class="h-4 w-32 bg-muted rounded" />
          <div class="h-3 w-48 bg-muted rounded mt-2" />
        </CardHeader>
      </Card>
    </div>

    <!-- Empty state -->
    <div v-else-if="!modules?.length" class="rounded-lg border border-dashed p-8 text-center">
      <Puzzle class="size-10 text-muted-foreground mx-auto mb-3" />
      <h3 class="font-medium">Aucun module</h3>
      <p class="text-sm text-muted-foreground mt-1 mb-4">
        Créez votre premier module communautaire.
      </p>
      <Button as-child>
        <NuxtLink to="/dashboard/modules/create">
          <Plus class="size-4 mr-2" />
          Créer un module
        </NuxtLink>
      </Button>
    </div>

    <!-- Module grid -->
    <div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Card
        v-for="mod in modules"
        :key="mod.id"
        class="transition-colors hover:bg-muted/50"
      >
        <CardHeader>
          <div class="flex items-center justify-between">
            <CardTitle class="text-base">
              <NuxtLink
                :to="`/dashboard/modules/${mod.id}`"
                class="hover:underline"
              >
                {{ mod.name }}
              </NuxtLink>
            </CardTitle>
            <ModuleStatusBadge v-if="mod.status" :status="mod.status.status" />
          </div>
          <CardDescription>
            {{ mod.framework?.name }}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p v-if="mod.description" class="text-sm text-muted-foreground line-clamp-2 mb-3">
            {{ mod.description }}
          </p>
          <div v-if="mod.status?.status === 'REFUSED' && mod.status.reason" class="text-sm text-red-500 mb-3">
            Raison du refus : {{ mod.status.reason }}
          </div>
          <div class="flex items-center justify-end gap-2">
            <Button size="sm" variant="outline" as-child>
              <NuxtLink :to="`/dashboard/modules/${mod.id}`">
                Modifier
              </NuxtLink>
            </Button>
            <Button size="sm" variant="ghost" @click="handleDelete(mod.id)">
              <Trash2 class="size-4 text-muted-foreground" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
