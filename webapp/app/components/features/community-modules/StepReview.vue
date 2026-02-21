<script setup lang="ts">
import { FileCode, Package, KeyRound, MessageSquare } from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import { MODULE_CATEGORIES } from '@/components/features/project-creator/types'
import type {
  CommunityModuleFile,
  CommunityModuleDependency,
  CommunityModuleEnvVar,
  CommunityModulePrompt,
} from '~~/types/type'

defineProps<{
  name: string
  description: string
  frameworkName: string
  category: string
  files: CommunityModuleFile[]
  dependencies: CommunityModuleDependency[]
  envVars: CommunityModuleEnvVar[]
  prompts: CommunityModulePrompt[]
}>()
</script>

<template>
  <div class="space-y-6">
    <p class="text-sm text-muted-foreground">
      Vérifiez les informations avant de soumettre votre module pour modération.
    </p>

    <!-- Metadata -->
    <div class="rounded-md border p-4 space-y-2">
      <h4 class="font-medium text-sm">Informations générales</h4>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span class="text-muted-foreground">Nom :</span>
          <span class="ml-1 font-medium">{{ name }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Framework :</span>
          <span class="ml-1 font-medium">{{ frameworkName }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Catégorie :</span>
          <span class="ml-1 font-medium">{{ MODULE_CATEGORIES[category]?.label || category }}</span>
        </div>
      </div>
      <div v-if="description" class="text-sm">
        <span class="text-muted-foreground">Description :</span>
        <span class="ml-1">{{ description }}</span>
      </div>
    </div>

    <!-- Files -->
    <div class="rounded-md border p-4 space-y-2">
      <div class="flex items-center gap-2">
        <FileCode class="size-4 text-muted-foreground" />
        <h4 class="font-medium text-sm">Fichiers ({{ files.length }})</h4>
      </div>
      <div class="space-y-1">
        <div
          v-for="file in files"
          :key="file.path"
          class="text-sm font-mono text-muted-foreground"
        >
          {{ file.path }}
        </div>
      </div>
    </div>

    <!-- Dependencies -->
    <div v-if="dependencies.length > 0" class="rounded-md border p-4 space-y-2">
      <div class="flex items-center gap-2">
        <Package class="size-4 text-muted-foreground" />
        <h4 class="font-medium text-sm">Dépendances ({{ dependencies.length }})</h4>
      </div>
      <div class="flex flex-wrap gap-2">
        <Badge v-for="dep in dependencies" :key="dep.name" variant="secondary">
          {{ dep.name }}
          <span v-if="dep.isDev" class="text-xs opacity-60 ml-1">(dev)</span>
        </Badge>
      </div>
    </div>

    <!-- Env vars -->
    <div v-if="envVars.length > 0" class="rounded-md border p-4 space-y-2">
      <div class="flex items-center gap-2">
        <KeyRound class="size-4 text-muted-foreground" />
        <h4 class="font-medium text-sm">Variables d'environnement ({{ envVars.length }})</h4>
      </div>
      <div class="space-y-1">
        <div v-for="env in envVars" :key="env.key" class="text-sm">
          <span class="font-mono">{{ env.key }}</span>
          <span v-if="env.defaultValue" class="text-muted-foreground">
            = {{ env.defaultValue }}
          </span>
          <span v-if="env.description" class="text-muted-foreground ml-2">
            — {{ env.description }}
          </span>
        </div>
      </div>
    </div>

    <!-- Prompts -->
    <div v-if="prompts.length > 0" class="rounded-md border p-4 space-y-2">
      <div class="flex items-center gap-2">
        <MessageSquare class="size-4 text-muted-foreground" />
        <h4 class="font-medium text-sm">Prompts ({{ prompts.length }})</h4>
      </div>
      <div class="space-y-1">
        <div v-for="prompt in prompts" :key="prompt.id" class="text-sm">
          <Badge variant="outline" class="mr-2 text-xs">{{ prompt.type }}</Badge>
          {{ prompt.message }}
        </div>
      </div>
    </div>
  </div>
</template>
