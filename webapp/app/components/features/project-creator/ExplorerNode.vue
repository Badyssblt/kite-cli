<script setup lang="ts">
import { ref, computed } from 'vue';
import { ChevronRight, Folder, FolderOpen, FileCode, FileJson, FileText, Database, Settings } from 'lucide-vue-next';
import type { TreeNode } from './types';
import { MODULE_COLORS } from './types';

const props = defineProps<{
  node: TreeNode;
  depth?: number;
  selectedPath?: string;
}>();

const emit = defineEmits<{
  select: [node: TreeNode, path: string];
}>();

const depth = props.depth ?? 0;
const isOpen = ref(true);

const nodeColor = computed(() => {
  if (!props.node.source) return '';
  return MODULE_COLORS[props.node.source]?.text || '';
});

const icon = computed(() => {
  if (props.node.type === 'folder') {
    return isOpen.value ? FolderOpen : Folder;
  }

  const name = props.node.name.toLowerCase();
  const ext = name.split('.').pop();

  if (ext === 'json') return FileJson;
  if (ext === 'prisma') return Database;
  if (name.includes('config')) return Settings;
  if (['ts', 'js', 'vue', 'tsx', 'jsx'].includes(ext || '')) return FileCode;

  return FileText;
});

const nodePath = computed(() => {
  return props.node.name;
});

function toggle() {
  if (props.node.type === 'folder') {
    isOpen.value = !isOpen.value;
  }
}

function handleClick() {
  if (props.node.type === 'file') {
    emit('select', props.node, nodePath.value);
  } else {
    toggle();
  }
}

function handleChildSelect(node: TreeNode, childPath: string) {
  emit('select', node, `${props.node.name}/${childPath}`);
}
</script>

<template>
  <div class="select-none">
    <div
      class="flex items-center gap-1 py-0.5 px-1 rounded text-[13px] cursor-pointer transition-colors"
      :class="[
        nodeColor,
        selectedPath === nodePath ? 'bg-primary/20' : 'hover:bg-muted'
      ]"
      :style="{ paddingLeft: `${depth * 12 + 4}px` }"
      @click="handleClick"
    >
      <ChevronRight
        v-if="node.type === 'folder'"
        class="size-3.5 shrink-0 transition-transform duration-150"
        :class="isOpen ? 'rotate-90' : ''"
      />
      <span v-else class="w-3.5 shrink-0" />

      <component :is="icon" class="size-4 shrink-0 opacity-70" />
      <span class="truncate">{{ node.name }}</span>
    </div>

    <template v-if="node.type === 'folder' && isOpen && node.children">
      <ExplorerNode
        v-for="child in node.children"
        :key="child.name"
        :node="child"
        :depth="depth + 1"
        :selected-path="selectedPath"
        @select="handleChildSelect"
      />
    </template>
  </div>
</template>
