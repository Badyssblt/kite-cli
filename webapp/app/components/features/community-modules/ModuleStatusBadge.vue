<script setup lang="ts">
import { Badge } from '@/components/ui/badge'

const props = defineProps<{
  status: string
}>()

const config = computed(() => {
  switch (props.status) {
    case 'WAITING_FOR_APPROVAL':
      return { label: 'En attente', class: 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/15' }
    case 'ACTIVE':
      return { label: 'Approuvé', class: 'bg-green-500/15 text-green-600 border-green-500/20 hover:bg-green-500/15' }
    case 'REFUSED':
      return { label: 'Refusé', class: 'bg-red-500/15 text-red-600 border-red-500/20 hover:bg-red-500/15' }
    case 'DEPRECATED':
      return { label: 'Déprécié', class: 'bg-gray-500/15 text-gray-600 border-gray-500/20 hover:bg-gray-500/15' }
    default:
      return { label: props.status, class: '' }
  }
})
</script>

<template>
  <Badge variant="outline" :class="config.class">
    {{ config.label }}
  </Badge>
</template>
