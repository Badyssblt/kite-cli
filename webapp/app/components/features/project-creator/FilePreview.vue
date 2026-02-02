<script setup lang="ts">
import { ref, watch } from 'vue';
import { FileCode } from 'lucide-vue-next';
import { useShiki } from '~/composables/useShiki';
import type { OpenFile } from './types';

const props = defineProps<{
  file: OpenFile | null;
  isLoading?: boolean;
}>();

const { highlight } = useShiki();
const highlightedCode = ref('');
const isHighlighting = ref(false);

watch(
  () => props.file,
  async (file) => {
    if (!file) {
      highlightedCode.value = '';
      return;
    }

    isHighlighting.value = true;
    try {
      highlightedCode.value = await highlight(file.content, file.language);
    } catch (err) {
      console.error('Highlighting error:', err);
      highlightedCode.value = `<pre><code>${file.content}</code></pre>`;
    } finally {
      isHighlighting.value = false;
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="h-full flex flex-col bg-muted/20">
    <!-- Empty State -->
    <div v-if="!file && !isLoading" class="flex-1 flex flex-col items-center justify-center text-muted-foreground">
      <FileCode class="size-16 mb-4 opacity-20" />
      <p class="text-sm">Sélectionnez un fichier pour voir son contenu</p>
    </div>

    <!-- Loading -->
    <div v-else-if="isLoading" class="flex-1 flex items-center justify-center text-muted-foreground">
      <p class="text-sm">Chargement...</p>
    </div>

    <!-- File Content -->
    <template v-else-if="file">
      <div class="flex-1 overflow-auto">
        <div v-if="isHighlighting" class="p-4 text-muted-foreground text-sm">
          Chargement...
        </div>
        <div
          v-else
          class="shiki-container text-[13px] leading-6"
          v-html="highlightedCode"
        />
      </div>
    </template>
  </div>
</template>

<style>
.shiki-container pre {
  margin: 0;
  padding: 1rem;
  background: transparent !important;
  overflow-x: auto;
}

.shiki-container code {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
}

.shiki-container .line {
  display: inline-block;
  width: 100%;
}
</style>
