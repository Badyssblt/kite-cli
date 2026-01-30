<template>
  <div class="font-mono text-sm bg-background border rounded-lg overflow-hidden">
    <div class="px-3 py-2 bg-muted/50 border-b flex items-center gap-2">
      <Folder class="size-4 text-primary" />
      <span class="font-semibold">{{ projectName }}</span>
    </div>

    <div class="p-2 max-h-[500px] overflow-y-auto">
      <FileTreeNode
        v-for="child in tree.children"
        :key="child.name"
        :node="child"
        :module-colors="moduleColors"
      />
    </div>

    <div v-if="modules.length > 0" class="px-3 py-2 bg-muted/30 border-t">
      <div class="flex flex-wrap gap-2">
        <div
          v-for="mod in modules"
          :key="mod"
          class="flex items-center gap-1.5 text-xs"
        >
          <span class="size-2 rounded-full" :class="moduleBgColors[mod] || 'bg-muted-foreground'" />
          <span class="text-muted-foreground">{{ mod }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Folder } from 'lucide-vue-next'
import FileTreeNode from './FileTreeNode.vue'

interface TreeNode {
  name: string
  type: 'file' | 'folder'
  source?: string
  children?: TreeNode[]
}

const props = defineProps<{
  tree: TreeNode
  projectName: string
  modules: string[]
}>()

const moduleColors: Record<string, string> = {
  prisma: 'text-emerald-500',
  tailwind: 'text-cyan-500',
  'better-auth': 'text-violet-500',
  stripe: 'text-purple-500',
  docker: 'text-blue-500',
  shadcn: 'text-orange-500',
  'nuxt-ui': 'text-green-500',
  pinia: 'text-yellow-500',
  i18n: 'text-pink-500',
  eslint: 'text-indigo-500',
  vitest: 'text-lime-500',
  supabase: 'text-teal-500',
}

const moduleBgColors: Record<string, string> = {
  prisma: 'bg-emerald-500',
  tailwind: 'bg-cyan-500',
  'better-auth': 'bg-violet-500',
  stripe: 'bg-purple-500',
  docker: 'bg-blue-500',
  shadcn: 'bg-orange-500',
  'nuxt-ui': 'bg-green-500',
  pinia: 'bg-yellow-500',
  i18n: 'bg-pink-500',
  eslint: 'bg-indigo-500',
  vitest: 'bg-lime-500',
  supabase: 'bg-teal-500',
}
</script>
