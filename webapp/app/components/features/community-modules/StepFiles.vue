<script setup lang="ts">
import { FilePlus, FolderPlus, FileCode } from 'lucide-vue-next'
import type { CommunityModuleFile } from '~~/types/type'
import type { TreeNode } from './FileExplorerNode.vue'
import FileExplorerNode from './FileExplorerNode.vue'
import FileEditor from './FileEditor.vue'

const props = defineProps<{
  files: CommunityModuleFile[]
  frameworkId: string
}>()

const emit = defineEmits<{
  'update:files': [value: CommunityModuleFile[]]
}>()

// --- Framework path suggestions ---
const frameworkSuggestions: Record<string, { folders: string[]; files: string[] }> = {
  nuxt: {
    folders: [
      'app', 'app/components', 'app/composables', 'app/layouts', 'app/middleware',
      'app/pages', 'app/plugins', 'app/assets', 'app/assets/css',
      'server', 'server/api', 'server/middleware', 'server/plugins', 'server/utils',
      'public', 'prisma', 'types',
    ],
    files: [
      'nuxt.config.ts', 'app/app.vue', 'app/error.vue',
      'server/utils/db.ts', 'prisma/schema.prisma',
      'app/assets/css/main.css', '.env', '.env.example',
      'types/index.ts', 'package.json', 'tsconfig.json',
    ],
  },
  nextjs: {
    folders: [
      'app', 'app/api', 'app/(auth)', 'app/(dashboard)',
      'components', 'components/ui', 'lib', 'hooks',
      'public', 'prisma', 'styles', 'types',
    ],
    files: [
      'next.config.ts', 'app/layout.tsx', 'app/page.tsx',
      'app/globals.css', 'app/loading.tsx', 'app/not-found.tsx',
      'lib/db.ts', 'lib/utils.ts', 'prisma/schema.prisma',
      '.env', '.env.example', 'types/index.ts',
      'package.json', 'tsconfig.json', 'middleware.ts',
    ],
  },
}

function getSuggestions(parentFolder: string, type: 'file' | 'folder'): string[] {
  const fw = frameworkSuggestions[props.frameworkId]
  if (!fw) return []

  const pool = type === 'folder' ? fw.folders : fw.files
  const existingPaths = new Set([
    ...props.files.map((f) => f.path),
    ...emptyFolders.value,
  ])

  return pool
    .filter((p) => {
      // Must be a direct child of parentFolder
      const relative = parentFolder ? (p.startsWith(parentFolder + '/') ? p.substring(parentFolder.length + 1) : null) : p
      if (!relative) return false
      // Direct child = no more slashes
      return !relative.includes('/')
    })
    .map((p) => {
      const relative = parentFolder ? p.substring(parentFolder.length + 1) : p
      return relative
    })
    .filter((name) => {
      // Exclude already existing
      const fullPath = parentFolder ? `${parentFolder}/${name}` : name
      return !existingPaths.has(fullPath)
    })
}

const selectedPath = ref<string | null>(null)

// Folders explicitly created (that may have no files yet)
const emptyFolders = ref<Set<string>>(new Set())

// Inline creation state
const creatingIn = ref<string | null>(null)
const creatingType = ref<'file' | 'folder' | null>(null)
const inlineInputValue = ref('')
const activeSuggestionIndex = ref(-1)

const suggestions = computed(() => {
  if (creatingIn.value === null || !creatingType.value) return []
  const all = getSuggestions(creatingIn.value, creatingType.value)
  if (!inlineInputValue.value) return all
  return all.filter((s) => s.toLowerCase().includes(inlineInputValue.value.toLowerCase()))
})

function onInlineInput(value: string) {
  inlineInputValue.value = value
  activeSuggestionIndex.value = -1
}

function onInlineKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (suggestions.value.length > 0) {
      activeSuggestionIndex.value = Math.min(activeSuggestionIndex.value + 1, suggestions.value.length - 1)
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIndex.value = Math.max(activeSuggestionIndex.value - 1, -1)
  } else if (e.key === 'Tab' && suggestions.value.length > 0) {
    e.preventDefault()
    const idx = activeSuggestionIndex.value >= 0 ? activeSuggestionIndex.value : 0
    inlineInputValue.value = suggestions.value[idx]
    activeSuggestionIndex.value = -1
  } else if (e.key === 'Enter') {
    if (activeSuggestionIndex.value >= 0) {
      pickSuggestion(suggestions.value[activeSuggestionIndex.value])
    } else {
      onConfirmCreate(inlineInputValue.value.trim())
    }
  } else if (e.key === 'Escape') {
    onCancelCreate()
  }
}

function pickSuggestion(name: string) {
  inlineInputValue.value = name
  activeSuggestionIndex.value = -1
  onConfirmCreate(name)
}

// Build tree from flat file list + empty folders
const tree = computed<TreeNode>(() => {
  const root: TreeNode = { name: '.', type: 'folder', path: '', children: [] }

  const folderSet = new Set<string>()
  for (const f of props.files) {
    const parts = f.path.split('/')
    let current = ''
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i]
      folderSet.add(current)
    }
  }
  for (const folder of emptyFolders.value) {
    folderSet.add(folder)
  }

  function ensureFolder(path: string): TreeNode {
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

  const sortedFolders = [...folderSet].sort()
  for (const fp of sortedFolders) {
    ensureFolder(fp)
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

  function sortChildren(node: TreeNode) {
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

// Currently selected file data
const selectedFile = computed(() => {
  if (!selectedPath.value) return null
  return props.files.find((f) => f.path === selectedPath.value) || null
})

const selectedFileIndex = computed(() => {
  if (!selectedPath.value) return -1
  return props.files.findIndex((f) => f.path === selectedPath.value)
})

// Actions
function onSelectFile(path: string) {
  selectedPath.value = path
}

function startCreate(parentFolder: string, type: 'file' | 'folder') {
  creatingIn.value = parentFolder
  creatingType.value = type
  inlineInputValue.value = ''
  activeSuggestionIndex.value = -1
}

function onConfirmCreate(name: string) {
  if (creatingIn.value === null || !creatingType.value || !name) {
    onCancelCreate()
    return
  }

  const parentPath = creatingIn.value
  const fullPath = parentPath ? `${parentPath}/${name}` : name

  if (creatingType.value === 'folder') {
    emptyFolders.value.add(fullPath)
    emptyFolders.value = new Set(emptyFolders.value)
  } else {
    const updated = [...props.files, { path: fullPath, content: '' }]
    emit('update:files', updated)
    selectedPath.value = fullPath
    if (emptyFolders.value.has(parentPath)) {
      emptyFolders.value.delete(parentPath)
      emptyFolders.value = new Set(emptyFolders.value)
    }
  }

  creatingIn.value = null
  creatingType.value = null
  inlineInputValue.value = ''
  activeSuggestionIndex.value = -1
}

function onCancelCreate() {
  creatingIn.value = null
  creatingType.value = null
  inlineInputValue.value = ''
  activeSuggestionIndex.value = -1
}

function onDeleteNode(path: string, type: 'file' | 'folder') {
  if (type === 'file') {
    const updated = props.files.filter((f) => f.path !== path)
    emit('update:files', updated)
    if (selectedPath.value === path) {
      selectedPath.value = updated.length > 0 ? updated[0].path : null
    }
  } else {
    const prefix = path + '/'
    const updated = props.files.filter(
      (f) => f.path !== path && !f.path.startsWith(prefix)
    )
    emit('update:files', updated)
    const toDelete = [...emptyFolders.value].filter(
      (f) => f === path || f.startsWith(prefix)
    )
    for (const d of toDelete) {
      emptyFolders.value.delete(d)
    }
    emptyFolders.value = new Set(emptyFolders.value)
    if (selectedPath.value === path || selectedPath.value?.startsWith(prefix)) {
      selectedPath.value = updated.length > 0 ? updated[0].path : null
    }
  }
}

function onMoveNode(sourcePath: string, targetFolder: string) {
  const sourceName = sourcePath.includes('/')
    ? sourcePath.substring(sourcePath.lastIndexOf('/') + 1)
    : sourcePath
  const newPath = targetFolder ? `${targetFolder}/${sourceName}` : sourceName

  const fileIndex = props.files.findIndex((f) => f.path === sourcePath)
  if (fileIndex !== -1) {
    const updated = props.files.map((f) =>
      f.path === sourcePath ? { ...f, path: newPath } : f
    )
    emit('update:files', updated)
    if (selectedPath.value === sourcePath) {
      selectedPath.value = newPath
    }
    return
  }

  const prefix = sourcePath + '/'
  const updated = props.files.map((f) => {
    if (f.path.startsWith(prefix)) {
      const relative = f.path.substring(sourcePath.length)
      return { ...f, path: newPath + relative }
    }
    return f
  })
  emit('update:files', updated)

  const foldersToMove = [...emptyFolders.value].filter(
    (f) => f === sourcePath || f.startsWith(prefix)
  )
  for (const f of foldersToMove) {
    emptyFolders.value.delete(f)
    const relative = f.substring(sourcePath.length)
    emptyFolders.value.add(newPath + relative)
  }
  emptyFolders.value = new Set(emptyFolders.value)

  if (selectedPath.value?.startsWith(prefix)) {
    const relative = selectedPath.value.substring(sourcePath.length)
    selectedPath.value = newPath + relative
  }
}

// Drop on root zone
function onRootDragOver(e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
}

function onRootDrop(e: DragEvent) {
  e.preventDefault()
  const sourcePath = e.dataTransfer!.getData('text/plain')
  if (!sourcePath) return
  if (!sourcePath.includes('/')) return
  onMoveNode(sourcePath, '')
}

function updateFileContent(content: string) {
  if (selectedFileIndex.value === -1) return
  const updated = props.files.map((f, i) =>
    i === selectedFileIndex.value ? { ...f, content } : f
  )
  emit('update:files', updated)
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- Explorer + Editor layout -->
    <div class="flex border rounded-lg overflow-hidden flex-1 min-h-0">
      <!-- File explorer sidebar -->
      <div class="w-60 shrink-0 border-r flex flex-col bg-muted/30">
        <!-- Explorer header -->
        <div class="flex items-center justify-between px-3 py-2 border-b bg-muted/50">
          <span class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Fichiers
          </span>
          <div class="flex items-center gap-1">
            <button
              class="p-1 rounded hover:bg-muted-foreground/20"
              title="Nouveau fichier"
              @click="startCreate('', 'file')"
            >
              <FilePlus class="size-3.5 text-muted-foreground" />
            </button>
            <button
              class="p-1 rounded hover:bg-muted-foreground/20"
              title="Nouveau dossier"
              @click="startCreate('', 'folder')"
            >
              <FolderPlus class="size-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <!-- Tree -->
        <div
          class="flex-1 overflow-y-auto py-1"
          @dragover="onRootDragOver"
          @drop="onRootDrop"
        >
          <!-- Root level inline input -->
          <div
            v-if="creatingIn === '' && creatingType"
            class="relative"
          >
            <div
              class="flex items-center gap-1 py-[3px] px-1"
              style="padding-left: 4px;"
            >
              <span class="w-3.5 shrink-0" />
              <component
                :is="creatingType === 'folder' ? FolderPlus : FilePlus"
                class="size-4 shrink-0 opacity-50"
              />
              <input
                type="text"
                :value="inlineInputValue"
                class="flex-1 bg-transparent border border-primary/50 rounded px-1.5 py-0.5 text-[13px] outline-none focus:border-primary"
                :placeholder="creatingType === 'folder' ? 'nom-dossier' : 'fichier.ts'"
                autofocus
                @input="onInlineInput(($event.target as HTMLInputElement).value)"
                @keydown="onInlineKeydown"
                @blur="onConfirmCreate(inlineInputValue.trim())"
              />
            </div>
            <!-- Suggestions dropdown -->
            <div
              v-if="suggestions.length > 0"
              class="absolute left-0 right-0 z-10 mx-1 mt-0.5 rounded border bg-popover shadow-md max-h-40 overflow-y-auto"
            >
              <button
                v-for="(s, i) in suggestions"
                :key="s"
                class="w-full text-left px-2 py-1 text-[13px] transition-colors"
                :class="i === activeSuggestionIndex ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
                @mousedown.prevent="pickSuggestion(s)"
              >
                {{ s }}
              </button>
            </div>
          </div>

          <FileExplorerNode
            v-for="child in tree.children"
            :key="child.path"
            :node="child"
            :depth="0"
            :selected-path="selectedPath ?? undefined"
            :creating-in="creatingIn"
            :creating-type="creatingType"
            :framework-id="frameworkId"
            :suggestions-fn="getSuggestions"
            @select-file="onSelectFile"
            @create-file="startCreate($event, 'file')"
            @create-folder="startCreate($event, 'folder')"
            @delete-node="onDeleteNode"
            @confirm-create="onConfirmCreate"
            @cancel-create="onCancelCreate"
            @move-node="onMoveNode"
          />
        </div>
      </div>

      <!-- Editor area -->
      <div class="flex-1 flex flex-col min-w-0">
        <template v-if="selectedFile">
          <!-- File tab bar -->
          <div class="flex items-center px-3 py-1.5 border-b bg-muted/30 text-sm">
            <FileCode class="size-3.5 mr-2 opacity-60" />
            <span class="text-muted-foreground font-mono text-xs">{{ selectedFile.path }}</span>
          </div>
          <!-- Monaco Editor -->
          <div class="flex-1">
            <FileEditor
              :model-value="selectedFile.content"
              :filename="selectedFile.path"
              :framework-id="frameworkId"
              @update:model-value="updateFileContent"
            />
          </div>
        </template>
        <div v-else class="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Sélectionnez un fichier pour l'éditer
        </div>
      </div>
    </div>
  </div>
</template>
