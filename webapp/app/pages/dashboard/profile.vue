<script setup lang="ts">
import { User, Mail, Calendar, Shield } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { authClient } from '~~/lib/auth-client'

definePageMeta({
  layout: 'dashboard',
})

const { data: session } = await useFetch('/api/session')
const router = useRouter()

const user = computed(() => (session.value as any)?.user)

const userInitials = computed(() => {
  const name = user.value?.name || user.value?.email || ''
  return name.slice(0, 2).toUpperCase()
})

const memberSince = computed(() => {
  if (!user.value?.createdAt) return ''
  return new Date(user.value.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
})

async function handleSignOut() {
  await authClient.signOut()
  router.push('/login')
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">Profil</h1>
      <p class="text-muted-foreground mt-1">Gérez vos informations personnelles.</p>
    </div>

    <!-- User info card -->
    <Card>
      <CardHeader>
        <div class="flex items-center gap-4">
          <Avatar class="size-16">
            <AvatarImage v-if="user?.image" :src="user.image" :alt="user?.name || ''" />
            <AvatarFallback class="text-lg">{{ userInitials }}</AvatarFallback>
          </Avatar>
          <div class="flex-1 min-w-0">
            <CardTitle class="text-xl">{{ user?.name || 'Utilisateur' }}</CardTitle>
            <CardDescription class="mt-0.5">{{ user?.email }}</CardDescription>
          </div>
          <Badge v-if="user?.emailVerified" variant="secondary">
            <Shield class="size-3 mr-1" />
            Vérifié
          </Badge>
        </div>
      </CardHeader>

      <Separator />

      <CardContent class="pt-6 space-y-4">
        <div class="flex items-center gap-3">
          <User class="size-4 text-muted-foreground shrink-0" />
          <div>
            <p class="text-sm font-medium">Nom</p>
            <p class="text-sm text-muted-foreground">{{ user?.name || 'Non renseigné' }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Mail class="size-4 text-muted-foreground shrink-0" />
          <div>
            <p class="text-sm font-medium">Email</p>
            <p class="text-sm text-muted-foreground">{{ user?.email }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <Calendar class="size-4 text-muted-foreground shrink-0" />
          <div>
            <p class="text-sm font-medium">Membre depuis</p>
            <p class="text-sm text-muted-foreground">{{ memberSince || 'Inconnu' }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Danger zone -->
    <Card class="border-destructive/30">
      <CardHeader>
        <CardTitle class="text-base">Zone de danger</CardTitle>
        <CardDescription>Actions irréversibles sur votre compte.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="destructive" @click="handleSignOut">
          Se déconnecter
        </Button>
      </CardContent>
    </Card>
  </div>
</template>
