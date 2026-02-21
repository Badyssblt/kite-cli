<script setup lang="ts">
import {
  ChevronRight,
  Folder,
  FolderOpen,
  FileCode,
  FileJson,
  FileText,
  Database,
  Settings,
} from 'lucide-vue-next'

export interface ViewerTreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: ViewerTreeNode[]
}

const props = defineProps<{
  node: ViewerTreeNode
  depth?: number
  selectedPath?: string
}>()

const emit = defineEmits<{
  selectFile: [path: string]
}>()

const depth = props.depth ?? 0
const isOpen = ref(true)

const icon = computed(() => {
  if (props.node.type === 'folder') {
    return isOpen.value ? FolderOpen : Folder
  }
  const ext = props.node.name.split('.').pop()?.toLowerCase()
  const name = props.node.name.toLowerCase()
  if (ext === 'json') return FileJson
  if (ext === 'prisma') return Database
  if (name.includes('config')) return Settings
  if (['ts', 'js', 'vue', 'tsx', 'jsx', 'css', 'scss'].includes(ext || '')) return FileCode
  return FileText
})

function handleClick() {
  if (props.node.type === 'folder') {
    isOpen.value = !isOpen.value
  } else {
    emit('selectFile', props.node.path)
  }
}
</script>

<template>
  <div class="select-none">
    <div
      class="flex items-center gap-1 py-[3px] px-1 rounded text-[13px] cursor-pointer transition-colors"
      :class="selectedPath === node.path && node.type === 'file'
        ? 'bg-primary/15 text-accent-foreground'
        : 'hover:bg-muted/80'"
      :style="{ paddingLeft: `${depth * 14 + 4}px` }"
      @click="handleClick"
    >
      <ChevronRight
        v-if="node.type === 'folder'"
        class="size-3.5 shrink-0 transition-transform duration-150"
        :class="isOpen ? 'rotate-90' : ''"
      />
      <span v-else class="w-3.5 shrink-0" />
      <component :is="icon" class="size-4 shrink-0 opacity-70" />
      <span class="truncate flex-1">{{ node.name }}</span>
    </div>

    <template v-if="node.type === 'folder' && isOpen && node.children">
      <FileViewerNode
        v-for="child in node.children"
        :key="child.path"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select-file="emit('selectFile', $event)"
      />
    </template>
  </div>
</template>
