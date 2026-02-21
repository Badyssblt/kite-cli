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
  FilePlus,
  FolderPlus,
  Trash2,
} from 'lucide-vue-next'

export interface TreeNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: TreeNode[]
}

const props = defineProps<{
  node: TreeNode
  depth?: number
  selectedPath?: string
  creatingIn?: string | null
  creatingType?: 'file' | 'folder' | null
  frameworkId?: string
  suggestionsFn?: (parentFolder: string, type: 'file' | 'folder') => string[]
}>()

const emit = defineEmits<{
  selectFile: [path: string]
  createFile: [parentFolder: string]
  createFolder: [parentFolder: string]
  deleteNode: [path: string, type: 'file' | 'folder']
  confirmCreate: [name: string]
  cancelCreate: []
  moveNode: [sourcePath: string, targetFolder: string]
}>()

const depth = props.depth ?? 0
const isOpen = ref(true)
const isHovered = ref(false)
const isDragOver = ref(false)

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

// Inline input for this folder
const showInlineInput = computed(() => {
  return props.node.type === 'folder' && props.creatingIn === props.node.path
})

const inlineValue = ref('')
const inlineRef = ref<HTMLInputElement | null>(null)
const activeSuggestionIdx = ref(-1)

const inlineSuggestions = computed(() => {
  if (!showInlineInput.value || !props.suggestionsFn || !props.creatingType) return []
  const all = props.suggestionsFn(props.node.path, props.creatingType)
  if (!inlineValue.value) return all
  return all.filter((s) => s.toLowerCase().includes(inlineValue.value.toLowerCase()))
})

watch(showInlineInput, (val) => {
  if (val) {
    inlineValue.value = ''
    activeSuggestionIdx.value = -1
    nextTick(() => inlineRef.value?.focus())
  }
})

function handleClick() {
  if (props.node.type === 'folder') {
    isOpen.value = !isOpen.value
  } else {
    emit('selectFile', props.node.path)
  }
}

function onCreateFile(e: Event) {
  e.stopPropagation()
  if (!isOpen.value) isOpen.value = true
  emit('createFile', props.node.path)
}

function onCreateFolder(e: Event) {
  e.stopPropagation()
  if (!isOpen.value) isOpen.value = true
  emit('createFolder', props.node.path)
}

function onDelete(e: Event) {
  e.stopPropagation()
  emit('deleteNode', props.node.path, props.node.type)
}

function onInlineConfirm() {
  if (inlineValue.value.trim()) {
    emit('confirmCreate', inlineValue.value.trim())
  } else {
    emit('cancelCreate')
  }
}

function onInlineKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    if (inlineSuggestions.value.length > 0) {
      activeSuggestionIdx.value = Math.min(activeSuggestionIdx.value + 1, inlineSuggestions.value.length - 1)
    }
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeSuggestionIdx.value = Math.max(activeSuggestionIdx.value - 1, -1)
  } else if (e.key === 'Tab' && inlineSuggestions.value.length > 0) {
    e.preventDefault()
    const idx = activeSuggestionIdx.value >= 0 ? activeSuggestionIdx.value : 0
    inlineValue.value = inlineSuggestions.value[idx]
    activeSuggestionIdx.value = -1
  } else if (e.key === 'Enter') {
    if (activeSuggestionIdx.value >= 0) {
      pickSuggestion(inlineSuggestions.value[activeSuggestionIdx.value])
    } else {
      onInlineConfirm()
    }
  } else if (e.key === 'Escape') {
    emit('cancelCreate')
  }
}

function pickSuggestion(name: string) {
  inlineValue.value = name
  activeSuggestionIdx.value = -1
  emit('confirmCreate', name)
}

// --- Drag & Drop ---
function onDragStart(e: DragEvent) {
  e.dataTransfer!.setData('text/plain', props.node.path)
  e.dataTransfer!.setData('application/x-node-type', props.node.type)
  e.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(e: DragEvent) {
  if (props.node.type !== 'folder') return
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(e: DragEvent) {
  e.preventDefault()
  isDragOver.value = false
  if (props.node.type !== 'folder') return

  const sourcePath = e.dataTransfer!.getData('text/plain')
  if (!sourcePath) return

  if (sourcePath === props.node.path || props.node.path.startsWith(sourcePath + '/')) return

  const sourceParent = sourcePath.includes('/') ? sourcePath.substring(0, sourcePath.lastIndexOf('/')) : ''
  if (sourceParent === props.node.path) return

  if (!isOpen.value) isOpen.value = true
  emit('moveNode', sourcePath, props.node.path)
}
</script>

<template>
  <div class="select-none">
    <div
      class="group flex items-center gap-1 py-[3px] px-1 rounded text-[13px] cursor-pointer transition-colors"
      :class="[
        selectedPath === node.path && node.type === 'file'
          ? 'bg-primary/15 text-accent-foreground'
          : isDragOver
            ? 'bg-primary/20 ring-1 ring-primary/40'
            : 'hover:bg-muted/80',
      ]"
      :style="{ paddingLeft: `${depth * 14 + 4}px` }"
      draggable="true"
      @click="handleClick"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <ChevronRight
        v-if="node.type === 'folder'"
        class="size-3.5 shrink-0 transition-transform duration-150"
        :class="isOpen ? 'rotate-90' : ''"
      />
      <span v-else class="w-3.5 shrink-0" />

      <component :is="icon" class="size-4 shrink-0 opacity-70" />
      <span class="truncate flex-1">{{ node.name }}</span>

      <!-- Hover actions -->
      <div
        v-show="isHovered"
        class="flex items-center gap-0.5 shrink-0"
      >
        <template v-if="node.type === 'folder'">
          <button
            class="p-0.5 rounded hover:bg-muted-foreground/20"
            title="Nouveau fichier"
            @click="onCreateFile"
          >
            <FilePlus class="size-3.5 text-muted-foreground" />
          </button>
          <button
            class="p-0.5 rounded hover:bg-muted-foreground/20"
            title="Nouveau dossier"
            @click="onCreateFolder"
          >
            <FolderPlus class="size-3.5 text-muted-foreground" />
          </button>
        </template>
        <button
          class="p-0.5 rounded hover:bg-destructive/20"
          title="Supprimer"
          @click="onDelete"
        >
          <Trash2 class="size-3.5 text-muted-foreground" />
        </button>
      </div>
    </div>

    <!-- Children + inline input -->
    <template v-if="node.type === 'folder' && isOpen">
      <!-- Inline input with suggestions -->
      <div v-if="showInlineInput" class="relative">
        <div
          class="flex items-center gap-1 py-[3px] px-1"
          :style="{ paddingLeft: `${(depth + 1) * 14 + 4}px` }"
        >
          <span class="w-3.5 shrink-0" />
          <component
            :is="creatingType === 'folder' ? Folder : FileText"
            class="size-4 shrink-0 opacity-50"
          />
          <input
            ref="inlineRef"
            v-model="inlineValue"
            type="text"
            class="flex-1 bg-transparent border border-primary/50 rounded px-1.5 py-0.5 text-[13px] outline-none focus:border-primary"
            :placeholder="creatingType === 'folder' ? 'nom-dossier' : 'fichier.ts'"
            @keydown="onInlineKeydown"
            @blur="onInlineConfirm"
          />
        </div>
        <!-- Suggestions dropdown -->
        <div
          v-if="inlineSuggestions.length > 0"
          class="absolute left-0 right-0 z-10 mx-1 mt-0.5 rounded border bg-popover shadow-md max-h-40 overflow-y-auto"
        >
          <button
            v-for="(s, i) in inlineSuggestions"
            :key="s"
            class="w-full text-left px-2 py-1 text-[13px] transition-colors"
            :class="i === activeSuggestionIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-muted'"
            @mousedown.prevent="pickSuggestion(s)"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <template v-if="node.children">
        <FileExplorerNode
          v-for="child in node.children"
          :key="child.path"
          :node="child"
          :depth="depth + 1"
          :selected-path="selectedPath"
          :creating-in="creatingIn"
          :creating-type="creatingType"
          :framework-id="frameworkId"
          :suggestions-fn="suggestionsFn"
          @select-file="emit('selectFile', $event)"
          @create-file="emit('createFile', $event)"
          @create-folder="emit('createFolder', $event)"
          @delete-node="(path, type) => emit('deleteNode', path, type)"
          @confirm-create="emit('confirmCreate', $event)"
          @cancel-create="emit('cancelCreate')"
          @move-node="(source, target) => emit('moveNode', source, target)"
        />
      </template>
    </template>
  </div>
</template>
