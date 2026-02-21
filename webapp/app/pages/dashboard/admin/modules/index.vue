<script setup lang="ts">
import { ChevronRight } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ModuleStatusBadge from '~/components/features/community-modules/ModuleStatusBadge.vue'

definePageMeta({
  layout: 'dashboard',
})

const { getPendingModules } = useAdminModules()

const activeTab = ref<string>('WAITING_FOR_APPROVAL')

const tabs = [
  { value: 'WAITING_FOR_APPROVAL', label: 'En attente' },
  { value: 'ACTIVE', label: 'Approuvés' },
  { value: 'REFUSED', label: 'Refusés' },
]

const { data: modules, pending } = await getPendingModules(activeTab)
</script>

<template>
  <div class="space-y-8">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Modération des modules</h1>
      <p class="text-muted-foreground mt-1">
        Approuvez ou refusez les modules communautaires.
      </p>
    </div>

    <!-- Tab filters -->
    <div class="flex gap-2">
      <Button
        v-for="tab in tabs"
        :key="tab.value"
        :variant="activeTab === tab.value ? 'default' : 'outline'"
        size="sm"
        @click="activeTab = tab.value"
      >
        {{ tab.label }}
      </Button>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="space-y-4">
      <Card v-for="i in 3" :key="i" class="animate-pulse">
        <CardHeader>
          <div class="h-4 w-48 bg-muted rounded" />
        </CardHeader>
      </Card>
    </div>

    <!-- Empty state -->
    <div v-else-if="!modules?.length" class="rounded-lg border border-dashed p-8 text-center">
      <p class="text-sm text-muted-foreground">Aucun module dans cette catégorie.</p>
    </div>

    <!-- Module list -->
    <div v-else class="space-y-4">
      <NuxtLink
        v-for="mod in modules"
        :key="mod.id"
        :to="`/dashboard/admin/modules/${mod.id}`"
        class="block"
      >
        <Card class="transition-colors hover:border-muted-foreground/30 hover:bg-muted/50 cursor-pointer">
          <CardHeader>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <CardTitle class="text-base">{{ mod.name }}</CardTitle>
                <ModuleStatusBadge v-if="mod.status" :status="mod.status.status" />
                <Badge variant="secondary" class="text-xs">{{ mod.framework?.name }}</Badge>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="mod.author" class="text-sm text-muted-foreground">
                  par {{ mod.author.name }}
                </span>
                <ChevronRight class="size-4 text-muted-foreground" />
              </div>
            </div>
            <p v-if="mod.description" class="text-sm text-muted-foreground">
              {{ mod.description }}
            </p>
            <p v-if="mod.status?.reason" class="text-sm text-red-500 mt-1">
              Raison du refus : {{ mod.status.reason }}
            </p>
          </CardHeader>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
