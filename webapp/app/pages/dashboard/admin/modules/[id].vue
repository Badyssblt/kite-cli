<script setup lang="ts">
import { Check, X, ArrowLeft } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import ModuleEditor from '~/components/features/community-modules/ModuleEditor.vue'
import ModuleStatusBadge from '~/components/features/community-modules/ModuleStatusBadge.vue'
import type { CommunityModuleResponse } from '~~/types/type'
import { toast } from 'vue-sonner'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const moduleId = route.params.id as string

const { getModule } = useCommunityModules()
const { reviewModule } = useAdminModules()

const { data: moduleData, pending, error } = await getModule(moduleId)

const reviewing = ref(false)
const rejectDialogOpen = ref(false)
const rejectReason = ref('')

const isPending = computed(() => moduleData.value?.status?.status === 'WAITING_FOR_APPROVAL')

async function handleApprove() {
  reviewing.value = true
  try {
    await reviewModule(moduleId, 'approve')
    toast.success('Module approuvé')
    router.push('/dashboard/admin/modules')
  } catch {
    toast.error("Erreur lors de l'approbation")
  } finally {
    reviewing.value = false
  }
}

async function handleReject() {
  if (!rejectReason.value.trim()) return
  reviewing.value = true
  try {
    await reviewModule(moduleId, 'reject', rejectReason.value)
    toast.success('Module refusé')
    rejectDialogOpen.value = false
    router.push('/dashboard/admin/modules')
  } catch {
    toast.error('Erreur lors du refus')
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="router.push('/dashboard/admin/modules')">
          <ArrowLeft class="size-4" />
        </Button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="text-2xl font-bold tracking-tight">
              {{ moduleData?.name || 'Module' }}
            </h1>
            <ModuleStatusBadge v-if="moduleData?.status" :status="moduleData.status.status" />
          </div>
          <p v-if="moduleData?.author" class="text-sm text-muted-foreground mt-0.5">
            par {{ moduleData.author.name }} &middot; {{ moduleData.framework?.name }}
          </p>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <!-- Error -->
    <div v-else-if="error" class="rounded-lg border border-dashed p-8 text-center">
      <p class="text-sm text-muted-foreground">Module introuvable ou accès interdit.</p>
    </div>

    <!-- Module editor in readonly mode -->
    <ModuleEditor
      v-else-if="moduleData"
      mode="readonly"
      :initial-data="moduleData as CommunityModuleResponse"
    >
      <template #actions>
        <template v-if="isPending">
          <Button
            size="sm"
            :disabled="reviewing"
            @click="handleApprove"
          >
            <Check class="size-4 mr-1" />
            Approuver
          </Button>
          <Button
            size="sm"
            variant="destructive"
            :disabled="reviewing"
            @click="rejectDialogOpen = true"
          >
            <X class="size-4 mr-1" />
            Refuser
          </Button>
        </template>
      </template>
    </ModuleEditor>

    <!-- Reject dialog -->
    <Dialog v-model:open="rejectDialogOpen">
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Refuser le module</DialogTitle>
          <DialogDescription>
            Indiquez la raison du refus. L'auteur pourra la consulter.
          </DialogDescription>
        </DialogHeader>
        <textarea
          v-model="rejectReason"
          rows="3"
          placeholder="Raison du refus..."
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <DialogFooter>
          <Button variant="outline" @click="rejectDialogOpen = false">
            Annuler
          </Button>
          <Button
            variant="destructive"
            :disabled="!rejectReason.trim() || reviewing"
            @click="handleReject"
          >
            Confirmer le refus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
