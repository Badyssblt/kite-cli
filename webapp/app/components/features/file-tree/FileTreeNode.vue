<template>
  <div class="select-none">
    <div
      class="flex items-center gap-1.5 py-0.5 px-2 rounded cursor-pointer hover:bg-muted/50 text-sm"
      :class="node.source ? moduleColors[node.source] || 'text-foreground' : 'text-foreground'"
      @click="toggle"
    >
      <ChevronRight
        v-if="node.type === 'folder'"
        class="size-3.5 shrink-0 transition-transform"
        :class="isOpen ? 'rotate-90' : ''"
      />
      <span v-else class="w-3.5" />

      <component :is="icon" class="size-4 shrink-0" />
      <span class="truncate">{{ node.name }}</span>

      <span
        v-if="node.source"
        class="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
      >
        {{ node.source }}
      </span>
    </div>

    <div v-if="node.type === 'folder' && isOpen" class="ml-3 border-l border-border pl-1">
      <FileTreeNode
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :module-colors="moduleColors"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileJson,
  FileType,
  Settings,
  Database,
} from 'lucide-vue-next'

interface TreeNode {
  name: string
  type: 'file' | 'folder'
  source?: string
  children?: TreeNode[]
}

const props = defineProps<{
  node: TreeNode
  moduleColors?: Record<string, string>
}>()

const isOpen = ref(props.node.type === 'folder')

const toggle = () => {
  if (props.node.type === 'folder') {
    isOpen.value = !isOpen.value
  }
}

const icon = computed(() => {
  if (props.node.type === 'folder') {
    return isOpen.value ? FolderOpen : Folder
  }

  const ext = props.node.name.split('.').pop()?.toLowerCase()
  const name = props.node.name.toLowerCase()

  if (name === 'package.json' || ext === 'json') return FileJson
  if (ext === 'ts' || ext === 'tsx' || ext === 'js' || ext === 'jsx') return FileCode
  if (ext === 'vue') return FileCode
  if (ext === 'prisma') return Database
  if (name.includes('config')) return Settings
  if (ext === 'css' || ext === 'scss') return FileType

  return FileText
})
</script>
