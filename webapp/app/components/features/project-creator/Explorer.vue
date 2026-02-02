<script setup lang="ts">
import { Folder } from 'lucide-vue-next';
import ExplorerNode from './ExplorerNode.vue';
import type { TreeNode } from './types';

defineProps<{
  tree: TreeNode | null;
  projectName: string;
  selectedPath?: string;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  selectFile: [node: TreeNode, path: string];
}>();

function handleSelect(node: TreeNode, path: string) {
  emit('selectFile', node, path);
}
</script>

<template>
  <div class="h-full flex flex-col bg-muted/30 border-r">
    <!-- Header -->
    <div class="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
      Explorer
    </div>

    <!-- Project Name -->
    <div class="px-3 py-2 flex items-center gap-2 text-sm font-medium border-b bg-muted/50">
      <Folder class="size-4 text-primary" />
      <span class="truncate">{{ projectName }}</span>
    </div>

    <!-- Tree -->
    <div class="flex-1 overflow-y-auto py-1">
      <div v-if="isLoading" class="px-3 py-8 text-center text-sm text-muted-foreground">
        Chargement...
      </div>

      <div v-else-if="!tree" class="px-3 py-8 text-center text-sm text-muted-foreground">
        Sélectionnez un framework
      </div>

      <template v-else-if="tree.children">
        <ExplorerNode
          v-for="child in tree.children"
          :key="child.name"
          :node="child"
          :selected-path="selectedPath"
          @select="handleSelect"
        />
      </template>
    </div>
  </div>
</template>
