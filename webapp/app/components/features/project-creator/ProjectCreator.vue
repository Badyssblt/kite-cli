<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { toast } from 'vue-sonner';
import { Download, Github, ChevronDown, Lock, Globe, ArrowLeft } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Explorer from './Explorer.vue';
import FilePreview from './FilePreview.vue';
import ConfigPanel from './ConfigPanel.vue';
import ModuleConfigSheet from './ModuleConfigSheet.vue';
import StatusBar from './StatusBar.vue';
import type { TreeNode, OpenFile, Framework, Preset } from './types';

const props = defineProps<{
  frameworks: Framework[];
  presets: Preset[];
  initialPresetId?: string | null;
  initialFrameworkId: string;
}>();

const emit = defineEmits<{ back: [] }>();

// State
const projectName = ref('my-project');
const packageManager = ref(import.meta.client ? (localStorage.getItem('kite-default-pm') || 'npm') : 'npm');
const selectedFrameworkId = ref(props.initialFrameworkId);
const selectedModules = ref<string[]>([]);
const moduleAnswers = ref<Record<string, Record<string, string | boolean>>>({});
const fileTree = ref<TreeNode | null>(null);
const isLoadingTree = ref(false);
const openFile = ref<OpenFile | null>(null);
const isLoadingFile = ref(false);
const selectedFilePath = ref<string | undefined>();
const isCreating = ref(false);
const showConfigSheet = ref(false);

// Apply initial preset if provided (once)
if (props.initialPresetId) {
  const preset = props.presets.find(p => p.id === props.initialPresetId);
  if (preset) {
    const fw = props.frameworks.find(f => f.id === selectedFrameworkId.value);
    const fwModuleIds = fw ? fw.modules.map(m => m.id) : [];
    selectedModules.value = preset.modules.filter(m => fwModuleIds.includes(m));
    moduleAnswers.value = preset.answers ? { ...preset.answers } : {};
  }
}

const configurableModules = computed(() => {
  const fw = props.frameworks.find(f => f.id === selectedFrameworkId.value);
  if (!fw) return [];
  return fw.modules.filter(
    m => selectedModules.value.includes(m.id) && m.prompts?.length
  );
});

// GitHub state
const isGithubConnected = ref(false);
const hasRepoScope = ref(false);
const githubUsername = ref('');
const showGithubDialog = ref(false);
const repoName = ref('');
const isPrivateRepo = ref(false);
const isPushing = ref(false);

// Check GitHub connection status
onMounted(async () => {
  try {
    const response = await $fetch<{ connected: boolean; username?: string; hasRepoScope?: boolean }>('/api/github/status');
    isGithubConnected.value = response.connected;
    hasRepoScope.value = response.hasRepoScope ?? false;
    if (response.username) {
      githubUsername.value = response.username;
    }
  } catch (err) {
    console.error('Error checking GitHub status:', err);
  }
});

// Computed: can push to GitHub
const canPushToGithub = computed(() => isGithubConnected.value && hasRepoScope.value);

// Sync repo name with project name
watch(projectName, (newName) => {
  repoName.value = newName;
});

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

// When framework changes: reset modules + clear file/preview
watch(selectedFrameworkId, (_newVal, oldVal) => {
  if (!oldVal) return;
  openFile.value = null;
  selectedFilePath.value = undefined;
  selectedModules.value = [];
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


// Open GitHub dialog
function openGithubDialog() {
  repoName.value = projectName.value;
  showGithubDialog.value = true;
}

// Push to GitHub
async function pushToGithub() {
  if (!canCreate.value || !repoName.value.trim()) return;

  isPushing.value = true;

  try {
    const response = await $fetch<{
      success: boolean;
      repoUrl?: string;
      message?: string;
    }>('/api/github/push', {
      method: 'POST',
      body: {
        projectName: projectName.value,
        framework: selectedFrameworkId.value,
        modules: selectedModules.value,
        answers: Object.keys(moduleAnswers.value).length > 0 ? moduleAnswers.value : undefined,
        packageManager: packageManager.value,
        repoName: repoName.value,
        isPrivate: isPrivateRepo.value,
      },
    });

    if (response.success && response.repoUrl) {
      showGithubDialog.value = false;
      toast.success('Repository créé !', {
        description: `Projet pushé sur GitHub`,
        action: {
          label: 'Ouvrir',
          onClick: () => window.open(response.repoUrl, '_blank'),
        },
      });
    }
  } catch (err: any) {
    const message = err.data?.message || err.message || 'Erreur lors du push';
    toast.error('Erreur', { description: message });
  } finally {
    isPushing.value = false;
  }
}

// Download project (create ZIP)
async function downloadProject() {
  if (!canCreate.value) return;

  isCreating.value = true;

  try {
    const response = await fetch('/api/projects/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: projectName.value,
        framework: selectedFrameworkId.value,
        modules: selectedModules.value,
        answers: Object.keys(moduleAnswers.value).length > 0 ? moduleAnswers.value : undefined,
        packageManager: packageManager.value,
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
        <Button variant="ghost" size="icon" class="size-7" @click="emit('back')">
          <ArrowLeft class="size-4" />
        </Button>
        <Badge variant="outline" class="text-xs">
          {{ frameworks.find(f => f.id === selectedFrameworkId)?.name }}
        </Badge>
        <span class="text-sm font-medium">{{ projectName || 'my-project' }}</span>
      </div>

      <!-- GitHub connected: show dropdown with both options -->
      <DropdownMenu v-if="isGithubConnected">
        <DropdownMenuTrigger as-child>
          <Button size="sm" :disabled="!canCreate || isCreating || isPushing">
            <Github v-if="!isCreating && !isPushing" class="size-4 mr-2" />
            {{ isCreating || isPushing ? 'Création...' : 'Créer' }}
            <ChevronDown class="size-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="openGithubDialog">
            <Github class="size-4 mr-2" />
            Push vers GitHub
          </DropdownMenuItem>
          <DropdownMenuItem @click="downloadProject">
            <Download class="size-4 mr-2" />
            Télécharger (.zip)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <!-- Not connected: show download button only -->
      <Button
        v-else
        size="sm"
        :disabled="!canCreate || isCreating"
        @click="downloadProject"
      >
        <Download v-if="!isCreating" class="size-4 mr-2" />
        {{ isCreating ? 'Création...' : 'Télécharger' }}
      </Button>
    </div>

    <!-- GitHub Push Dialog -->
    <Dialog v-model:open="showGithubDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Push vers GitHub</DialogTitle>
          <DialogDescription>
            Créer un nouveau repository et y pusher votre projet.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="repo-name">Nom du repository</Label>
            <div class="flex items-center gap-2">
              <span class="text-sm text-muted-foreground">{{ githubUsername }} /</span>
              <Input
                id="repo-name"
                v-model="repoName"
                placeholder="my-project"
                class="flex-1"
              />
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="space-y-0.5">
              <Label for="private-repo">Repository privé</Label>
              <p class="text-sm text-muted-foreground">
                {{ isPrivateRepo ? 'Seul vous pourrez voir ce repo' : 'Tout le monde pourra voir ce repo' }}
              </p>
            </div>
            <Switch
              id="private-repo"
              v-model:checked="isPrivateRepo"
            />
          </div>

          <div class="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <component :is="isPrivateRepo ? Lock : Globe" class="size-4 text-muted-foreground" />
            <span class="text-sm">
              {{ isPrivateRepo ? 'Private' : 'Public' }} repository
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showGithubDialog = false">
            Annuler
          </Button>
          <Button
            :disabled="!repoName.trim() || isPushing"
            @click="pushToGithub"
          >
            <Github v-if="!isPushing" class="size-4 mr-2" />
            {{ isPushing ? 'Push en cours...' : 'Push' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

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
          :package-manager="packageManager"
          @update:project-name="projectName = $event"
          @update:package-manager="packageManager = $event"
          @update:selected-modules="selectedModules = $event"
          @open-config="showConfigSheet = true"
        />
      </div>
    </div>

    <!-- Module Config Sheet -->
    <ModuleConfigSheet
      v-model:open="showConfigSheet"
      v-model:module-answers="moduleAnswers"
      :modules="configurableModules"
      :selected-modules="selectedModules"
    />

    <!-- Status Bar -->
    <StatusBar
      :selected-modules="selectedModules"
      :file-count="fileCount"
    />
  </div>
</template>
