<script setup lang="ts">
import ModuleEditor from '~/components/features/community-modules/ModuleEditor.vue'
import type { CommunityModuleResponse } from '~~/types/type'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const moduleId = route.params.id as string

const { getModule } = useCommunityModules()
const { data: moduleData, pending, error } = await getModule(moduleId)

function onSubmitted() {
  router.push('/dashboard/modules')
}
</script>

<template>
  <div class="h-full">
    <div v-if="pending" class="flex items-center justify-center py-12">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>

    <div v-else-if="error" class="rounded-lg border border-dashed p-8 text-center">
      <p class="text-sm text-muted-foreground">Module introuvable ou accès interdit.</p>
    </div>

    <ModuleEditor
      v-else-if="moduleData"
      mode="edit"
      :initial-data="moduleData as CommunityModuleResponse"
      @submitted="onSubmitted"
    />
  </div>
</template>
