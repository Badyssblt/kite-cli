<script setup lang="ts">
import ModuleEditor from '~/components/features/community-modules/ModuleEditor.vue'

definePageMeta({
  layout: 'dashboard',
})

const router = useRouter()

function onSubmitted() {
  router.push('/dashboard/modules')
}
</script>

<template>
  <div class="h-full">
    <ModuleEditor mode="create" @submitted="onSubmitted" />
  </div>
</template>
