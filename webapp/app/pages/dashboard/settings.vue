<script setup lang="ts">
import { Monitor, Moon, Sun } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

definePageMeta({
  layout: 'dashboard',
})

// Theme
type Theme = 'light' | 'dark' | 'system'

const theme = ref<Theme>('system')

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(t: Theme) {
  const resolved = t === 'system' ? getSystemTheme() : t
  document.documentElement.classList.toggle('dark', resolved === 'dark')
}

onMounted(() => {
  const saved = localStorage.getItem('kite-theme') as Theme | null
  if (saved) {
    theme.value = saved
  }
  applyTheme(theme.value)

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
    if (theme.value === 'system') applyTheme('system')
  })
})

watch(theme, (t) => {
  localStorage.setItem('kite-theme', t)
  applyTheme(t)
})

const themes = [
  { id: 'light' as const, label: 'Clair', icon: Sun },
  { id: 'dark' as const, label: 'Sombre', icon: Moon },
  { id: 'system' as const, label: 'Système', icon: Monitor },
]

// Default package manager
const defaultPM = ref('npm')

onMounted(() => {
  const savedPM = localStorage.getItem('kite-default-pm')
  if (savedPM) defaultPM.value = savedPM
})

watch(defaultPM, (pm) => {
  localStorage.setItem('kite-default-pm', pm)
})
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Paramètres</h1>
      <p class="text-muted-foreground mt-1">Personnalisez votre expérience.</p>
    </div>

    <!-- Appearance -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Apparence</CardTitle>
        <CardDescription>Choisissez le thème de l'interface.</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="flex gap-2">
          <Button
            v-for="t in themes"
            :key="t.id"
            :variant="theme === t.id ? 'default' : 'outline'"
            size="sm"
            @click="theme = t.id"
          >
            <component :is="t.icon" class="size-4 mr-2" />
            {{ t.label }}
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Default PM -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Package manager par défaut</CardTitle>
        <CardDescription>Utilisé comme valeur par défaut lors de la création de projets.</CardDescription>
      </CardHeader>
      <CardContent>
        <Select v-model="defaultPM">
          <SelectTrigger class="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="npm">npm</SelectItem>
            <SelectItem value="pnpm">pnpm</SelectItem>
            <SelectItem value="yarn">yarn</SelectItem>
            <SelectItem value="bun">bun</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  </div>
</template>
