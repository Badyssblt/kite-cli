<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { toast } from 'vue-sonner';
import { Download } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import Explorer from './Explorer.vue';
import FilePreview from './FilePreview.vue';
import ConfigPanel from './ConfigPanel.vue';
import StatusBar from './StatusBar.vue';
import type { TreeNode, OpenFile, Framework } from './types';

const props = defineProps<{
  frameworks: Framework[];
}>();

// State
const projectName = ref('my-project');
const selectedFrameworkId = ref('');
const selectedModules = ref<string[]>([]);
const fileTree = ref<TreeNode | null>(null);
const isLoadingTree = ref(false);
const openFile = ref<OpenFile | null>(null);
const isLoadingFile = ref(false);
const selectedFilePath = ref<string | undefined>();
const isCreating = ref(false);

// Computed
const canCreate = computed(() => {
  return projectName.value.trim() && selectedFrameworkId.value;
});

const fileCount = computed(() => {
  if (!fileTree.value) return 0;
  return countFiles(fileTree.value);
});

function countFiles(node: TreeNode): number {
  if (node.type === 'file') return 1;
  return (node.children || []).reduce((acc, child) => acc + countFiles(child), 0);
}

// Reset modules when framework changes
watch(selectedFrameworkId, () => {
  selectedModules.value = [];
  openFile.value = null;
  selectedFilePath.value = undefined;
});

// Fetch file tree
watch(
  [selectedFrameworkId, selectedModules],
  async () => {
    if (!selectedFrameworkId.value) {
      fileTree.value = null;
      return;
    }

    isLoadingTree.value = true;
    try {
      const response = await $fetch<{ success: boolean; tree: TreeNode }>('/api/cli/preview-tree', {
        method: 'POST',
        body: {
          framework: selectedFrameworkId.value,
          modules: selectedModules.value
        }
      });

      if (response.success && response.tree) {
        fileTree.value = response.tree;
      }
    } catch (err) {
      console.error('Error fetching tree:', err);
    } finally {
      isLoadingTree.value = false;
    }
  },
  { deep: true }
);

// Handle file selection
async function handleSelectFile(node: TreeNode, path: string) {
  selectedFilePath.value = path;
  isLoadingFile.value = true;

  try {
    const response = await $fetch<{
      success: boolean;
      content?: string;
      language?: string;
      error?: string;
    }>('/api/cli/file-content', {
      method: 'POST',
      body: {
        framework: selectedFrameworkId.value,
        path: path,
        module: node.source
      }
    });

    if (response.success && response.content) {
      openFile.value = {
        path,
        name: node.name,
        content: response.content,
        language: response.language || 'text',
        source: node.source
      };
    } else {
      toast.error('Erreur', { description: response.error || 'Impossible de charger le fichier' });
    }
  } catch (err) {
    console.error('Error fetching file:', err);
    toast.error('Erreur', { description: 'Impossible de charger le fichier' });
  } finally {
    isLoadingFile.value = false;
  }
}


// Create project
async function createProject() {
  if (!canCreate.value) return;

  isCreating.value = true;

  try {
    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: projectName.value,
        framework: selectedFrameworkId.value,
        modules: selectedModules.value
      })
    });

    const contentType = response.headers.get('Content-Type');

    if (contentType?.includes('application/zip')) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.value}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Projet créé !', {
        description: `${projectName.value}.zip téléchargé`
      });
    } else {
      const data = await response.json();
      toast.error('Erreur', {
        description: data.error || 'Une erreur est survenue'
      });
    }
  } catch (err) {
    toast.error('Erreur', { description: 'Une erreur est survenue' });
  } finally {
    isCreating.value = false;
  }
}
</script>

<template>
  <div class="h-full flex flex-col rounded-lg border overflow-hidden bg-background">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium">{{ projectName || 'my-project' }}</span>
        <span class="text-xs text-muted-foreground">
          {{ selectedFrameworkId ? `• ${selectedFrameworkId}` : '' }}
        </span>
      </div>

      <Button
        size="sm"
        :disabled="!canCreate || isCreating"
        @click="createProject"
      >
        <Download v-if="!isCreating" class="size-4 mr-2" />
        {{ isCreating ? 'Création...' : 'Télécharger' }}
      </Button>
    </div>

    <!-- Main Content -->
    <div class="flex-1 flex min-h-0">
      <!-- Explorer -->
      <div class="w-56 shrink-0">
        <Explorer
          :tree="fileTree"
          :project-name="projectName || 'my-project'"
          :selected-path="selectedFilePath"
          :is-loading="isLoadingTree"
          @select-file="handleSelectFile"
        />
      </div>

      <!-- File Preview -->
      <div class="flex-1 min-w-0">
        <FilePreview
          :file="openFile"
          :is-loading="isLoadingFile"
        />
      </div>

      <!-- Config Panel -->
      <div class="w-72 shrink-0">
        <ConfigPanel
          :frameworks="frameworks"
          :selected-framework-id="selectedFrameworkId"
          :selected-modules="selectedModules"
          :project-name="projectName"
          @update:project-name="projectName = $event"
          @update:selected-framework-id="selectedFrameworkId = $event"
          @update:selected-modules="selectedModules = $event"
        />
      </div>
    </div>

    <!-- Status Bar -->
    <StatusBar
      :selected-modules="selectedModules"
      :file-count="fileCount"
    />
  </div>
</template>
