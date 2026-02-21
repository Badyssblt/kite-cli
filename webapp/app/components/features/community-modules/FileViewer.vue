<script setup lang="ts">
import { FileCode } from 'lucide-vue-next'
import type { CommunityModuleFile } from '~~/types/type'
import type { ViewerTreeNode } from './FileViewerNode.vue'
import FileViewerNode from './FileViewerNode.vue'
import FileEditor from './FileEditor.vue'

const props = defineProps<{
  files: CommunityModuleFile[]
}>()

const selectedPath = ref<string | null>(props.files.length > 0 ? props.files[0].path : null)

const selectedFile = computed(() => {
  if (!selectedPath.value) return null
  return props.files.find((f) => f.path === selectedPath.value) || null
})

// Build tree from flat file list
const tree = computed<ViewerTreeNode>(() => {
  const root: ViewerTreeNode = { name: '.', type: 'folder', path: '', children: [] }

  function ensureFolder(path: string): ViewerTreeNode {
    const parts = path.split('/')
    let current = root
    let currentPath = ''
    for (const part of parts) {
      currentPath = currentPath ? `${currentPath}/${part}` : part
      let existing = current.children!.find(
        (c) => c.type === 'folder' && c.name === part
      )
      if (!existing) {
        existing = { name: part, type: 'folder', path: currentPath, children: [] }
        current.children!.push(existing)
      }
      current = existing
    }
    return current
  }

  for (const f of props.files) {
    if (!f.path) continue
    const lastSlash = f.path.lastIndexOf('/')
    if (lastSlash === -1) {
      root.children!.push({ name: f.path, type: 'file', path: f.path })
    } else {
      const parentPath = f.path.substring(0, lastSlash)
      const fileName = f.path.substring(lastSlash + 1)
      const parent = ensureFolder(parentPath)
      parent.children!.push({ name: fileName, type: 'file', path: f.path })
    }
  }

  function sortChildren(node: ViewerTreeNode) {
    if (node.children) {
      node.children.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
      node.children.forEach(sortChildren)
    }
  }
  sortChildren(root)

  return root
})
</script>

<template>
  <div class="flex border rounded-lg overflow-hidden h-[500px]">
    <!-- File explorer sidebar -->
    <div class="w-56 shrink-0 border-r flex flex-col bg-muted/30">
      <div class="px-3 py-2 border-b bg-muted/50">
        <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Fichiers
        </span>
      </div>
      <div class="flex-1 overflow-y-auto py-1">
        <FileViewerNode
          v-for="child in tree.children"
          :key="child.path"
          :node="child"
          :depth="0"
          :selected-path="selectedPath ?? undefined"
          @select-file="selectedPath = $event"
        />
      </div>
    </div>

    <!-- Editor area (read-only) -->
    <div class="flex-1 flex flex-col min-w-0">
      <template v-if="selectedFile">
        <div class="flex items-center px-3 py-1.5 border-b bg-muted/30 text-sm">
          <FileCode class="size-3.5 mr-2 opacity-60" />
          <span class="text-muted-foreground font-mono text-xs">{{ selectedFile.path }}</span>
        </div>
        <div class="flex-1">
          <FileEditor
            :model-value="selectedFile.content"
            :filename="selectedFile.path"
            readonly
          />
        </div>
      </template>
      <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        Sélectionnez un fichier pour le visualiser
      </div>
    </div>
  </div>
</template>
