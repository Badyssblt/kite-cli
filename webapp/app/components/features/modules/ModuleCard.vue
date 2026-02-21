<template>
  <button
    type="button"
    class="group relative w-full text-left rounded-xl border px-4 py-3.5 cursor-pointer transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    :class="[
      selected
        ? 'border-foreground/20 bg-foreground/[0.08] shadow-sm dark:bg-foreground/[0.12]'
        : 'border-border bg-card hover:border-foreground/15 hover:bg-muted/60 hover:shadow-sm active:scale-[0.985]',
    ]"
    @click="handleClick"
  >
    <!-- Selection indicator -->
    <div
      class="absolute top-3 right-3 flex items-center justify-center size-5 rounded-md transition-all duration-200"
      :class="[
        selected
          ? 'bg-foreground'
          : 'border border-border bg-muted group-hover:border-foreground/25',
      ]"
    >
      <Check
        class="size-3 transition-opacity duration-200"
        :class="[
          selected
            ? 'text-primary-foreground opacity-100'
            : 'text-muted-foreground opacity-0 group-hover:opacity-30',
        ]"
        :stroke-width="2.5"
      />
    </div>

    <!-- Content -->
    <div class="pr-7">
      <p
        class="text-[13px] font-semibold tracking-tight leading-tight transition-colors duration-200"
        :class="selected ? 'text-foreground' : 'text-foreground'"
      >
        {{ module.name }}
      </p>
      <p
        v-if="module.description"
        class="mt-1.5 text-xs leading-relaxed line-clamp-2 transition-colors duration-200"
        :class="selected ? 'text-muted-foreground' : 'text-muted-foreground'"
      >
        {{ module.description }}
      </p>
    </div>
  </button>

  <!-- Details Modal -->
  <Dialog v-model:open="isDetailsOpen">
    <DialogContent class="sm:max-w-md gap-0 p-0 overflow-hidden">
      <!-- Header with color accent -->
      <div
        class="relative px-6 pt-6 pb-4"
        :class="moduleColor.bg + '/10'"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div
              class="flex items-center justify-center size-10 rounded-lg"
              :class="moduleColor.bg + '/20'"
            >
              <Package class="size-5" :class="moduleColor.text" />
            </div>
            <div>
              <DialogTitle class="text-lg font-semibold tracking-tight">
                {{ module.name }}
              </DialogTitle>
              <p v-if="module.framework" class="text-xs text-muted-foreground mt-0.5">
                {{ module.framework.name }}
              </p>
            </div>
          </div>

          <Badge
            v-if="selected"
            variant="secondary"
            class="text-[10px] font-medium"
          >
            <Check class="size-3 mr-1" />
            Sélectionné
          </Badge>
        </div>
      </div>

      <Separator />

      <!-- Body -->
      <div class="px-6 py-4 space-y-4">
        <!-- Description -->
        <div v-if="module.description" class="space-y-1.5">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Description
          </p>
          <p class="text-sm leading-relaxed text-foreground">
            {{ module.description }}
          </p>
        </div>

        <!-- Info grid -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Module ID -->
          <div class="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Identifiant
            </p>
            <p class="text-sm font-mono text-foreground">{{ module.id }}</p>
          </div>

          <!-- Framework -->
          <div class="rounded-lg border bg-muted/30 px-3 py-2.5">
            <p class="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Framework
            </p>
            <p class="text-sm text-foreground">
              {{ module.framework?.name || module.frameworkId || '—' }}
            </p>
          </div>
        </div>

        <!-- Framework description -->
        <div v-if="module.framework?.description" class="space-y-1.5">
          <p class="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            À propos du framework
          </p>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ module.framework.description }}
          </p>
        </div>
      </div>

      <Separator />

      <!-- Footer -->
      <div class="px-6 py-4 flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
          Double-cliquez une carte pour voir les détails
        </p>
        <div class="flex gap-2">
          <DialogClose as-child>
            <Button variant="outline" size="sm">
              Fermer
            </Button>
          </DialogClose>
          <Button
            size="sm"
            :variant="selected ? 'destructive' : 'default'"
            @click="selectModule(); isDetailsOpen = false"
          >
            {{ selected ? 'Retirer' : 'Sélectionner' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Check, Package } from 'lucide-vue-next';
import type { ModuleType } from '~~/types/type';
import { MODULE_COLORS } from '~/components/features/project-creator/types';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

const props = defineProps<{
  module: ModuleType;
  selected?: boolean;
}>();

const isDetailsOpen = ref(false);

const emits = defineEmits<{
  (e: 'select', module: ModuleType): void;
}>();

const moduleColor = computed(() => {
  return MODULE_COLORS[props.module.id] || { text: 'text-muted-foreground', bg: 'bg-muted-foreground' };
});

const DOUBLE_CLICK_DELAY = 300;
let lastClickTime = 0;

const handleClick = () => {
  const now = Date.now();

  if (now - lastClickTime < DOUBLE_CLICK_DELAY) {
    // Double-click → ouvre le modal
    isDetailsOpen.value = true;
  } else {
    // Simple clic → select immédiat
    emits('select', props.module);
  }

  lastClickTime = now;
};
</script>
