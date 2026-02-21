<script setup lang="ts">
import { toast } from 'vue-sonner'
import { User, Mail, Calendar, Shield, Github, Pencil, Check, X, LogOut, Trash2 } from 'lucide-vue-next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { authClient } from '~~/lib/auth-client'

definePageMeta({
  layout: 'dashboard',
})

const { data: session, refresh: refreshSession } = await useFetch('/api/session')
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

// Edit name
const isEditingName = ref(false)
const editName = ref('')
const isSavingName = ref(false)

function startEditName() {
  editName.value = user.value?.name || ''
  isEditingName.value = true
}

function cancelEditName() {
  isEditingName.value = false
}

async function saveName() {
  if (!editName.value.trim()) return
  isSavingName.value = true
  try {
    await authClient.updateUser({ name: editName.value.trim() })
    await refreshSession()
    isEditingName.value = false
    toast.success('Nom mis à jour')
  } catch {
    toast.error('Impossible de mettre à jour le nom')
  } finally {
    isSavingName.value = false
  }
}

// Connected accounts
const accounts = ref<any[]>([])
const isLoadingAccounts = ref(true)

onMounted(async () => {
  try {
    const result = await authClient.listAccounts()
    accounts.value = result.data || []
  } catch {
    accounts.value = []
  } finally {
    isLoadingAccounts.value = false
  }
})

const hasGithub = computed(() => accounts.value.some((a: any) => a.provider === 'github'))
const hasPassword = computed(() => accounts.value.some((a: any) => a.provider === 'credential'))

async function linkGithub() {
  try {
    await authClient.signIn.social({
      provider: 'github',
      scopes: ['read:user', 'user:email', 'repo'],
      callbackURL: '/dashboard/profile',
    })
  } catch {
    toast.error('Erreur lors de la connexion GitHub')
  }
}

// Delete account dialog
const showDeleteDialog = ref(false)
const isDeleting = ref(false)

async function deleteAccount() {
  isDeleting.value = true
  try {
    await authClient.deleteUser()
    router.push('/login')
  } catch {
    toast.error('Impossible de supprimer le compte')
  } finally {
    isDeleting.value = false
  }
}

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
        <!-- Name (editable) -->
        <div class="flex items-center gap-3">
          <User class="size-4 text-muted-foreground shrink-0" />
          <div class="flex-1">
            <p class="text-sm font-medium">Nom</p>
            <div v-if="isEditingName" class="flex items-center gap-2 mt-1">
              <Input
                v-model="editName"
                class="h-8 text-sm"
                @keyup.enter="saveName"
                @keyup.escape="cancelEditName"
              />
              <Button size="icon-sm" variant="ghost" :disabled="isSavingName" @click="saveName">
                <Check class="size-4" />
              </Button>
              <Button size="icon-sm" variant="ghost" @click="cancelEditName">
                <X class="size-4" />
              </Button>
            </div>
            <div v-else class="flex items-center gap-2">
              <p class="text-sm text-muted-foreground">{{ user?.name || 'Non renseigné' }}</p>
              <Button size="icon-sm" variant="ghost" class="size-6" @click="startEditName">
                <Pencil class="size-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="flex items-center gap-3">
          <Mail class="size-4 text-muted-foreground shrink-0" />
          <div>
            <p class="text-sm font-medium">Email</p>
            <p class="text-sm text-muted-foreground">{{ user?.email }}</p>
          </div>
        </div>

        <!-- Member since -->
        <div class="flex items-center gap-3">
          <Calendar class="size-4 text-muted-foreground shrink-0" />
          <div>
            <p class="text-sm font-medium">Membre depuis</p>
            <p class="text-sm text-muted-foreground">{{ memberSince || 'Inconnu' }}</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Connected accounts -->
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Comptes connectés</CardTitle>
        <CardDescription>Gérez vos méthodes de connexion.</CardDescription>
      </CardHeader>

      <CardContent class="space-y-3">
        <!-- GitHub -->
        <div class="flex items-center justify-between rounded-lg border p-3">
          <div class="flex items-center gap-3">
            <Github class="size-5" />
            <div>
              <p class="text-sm font-medium">GitHub</p>
              <p class="text-xs text-muted-foreground">
                {{ hasGithub ? 'Connecté' : 'Non connecté' }}
              </p>
            </div>
          </div>
          <Badge v-if="hasGithub" variant="secondary">Actif</Badge>
          <Button v-else variant="outline" size="sm" @click="linkGithub">
            Connecter
          </Button>
        </div>

        <!-- Email/Password -->
        <div class="flex items-center justify-between rounded-lg border p-3">
          <div class="flex items-center gap-3">
            <Mail class="size-5" />
            <div>
              <p class="text-sm font-medium">Email / Mot de passe</p>
              <p class="text-xs text-muted-foreground">
                {{ hasPassword ? 'Configuré' : 'Non configuré' }}
              </p>
            </div>
          </div>
          <Badge v-if="hasPassword" variant="secondary">Actif</Badge>
        </div>
      </CardContent>
    </Card>

    <!-- Danger zone -->
    <Card class="border-destructive/30">
      <CardHeader>
        <CardTitle class="text-base">Zone de danger</CardTitle>
        <CardDescription>Actions irréversibles sur votre compte.</CardDescription>
      </CardHeader>
      <CardContent class="flex gap-3">
        <Button variant="outline" @click="handleSignOut">
          <LogOut class="size-4 mr-2" />
          Se déconnecter
        </Button>
        <Button variant="destructive" @click="showDeleteDialog = true">
          <Trash2 class="size-4 mr-2" />
          Supprimer le compte
        </Button>
      </CardContent>
    </Card>

    <!-- Delete confirmation dialog -->
    <Dialog v-model:open="showDeleteDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Supprimer le compte</DialogTitle>
          <DialogDescription>
            Cette action est irréversible. Tous vos projets et presets seront supprimés.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="showDeleteDialog = false">Annuler</Button>
          <Button variant="destructive" :disabled="isDeleting" @click="deleteAccount">
            {{ isDeleting ? 'Suppression...' : 'Supprimer définitivement' }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
