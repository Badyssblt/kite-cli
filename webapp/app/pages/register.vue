<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);
const loadingGithub = ref(false);

async function handleRegister() {
  loading.value = true;
  error.value = "";

  const result = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
  });

  if (result.error) {
    error.value = result.error.message || "Erreur lors de l'inscription";
  } else {
    navigateTo("/dashboard");
  }

  loading.value = false;
}

async function handleGitHubLogin() {
  if (loadingGithub.value) return;
  loadingGithub.value = true;
  error.value = "";

  try {
    const result = await authClient.signIn.social({
      provider: "github",
      scopes: ["read:user", "user:email", "repo"],
      callbackURL: "/dashboard",
      errorCallbackURL: "/register",
    });

    if (result?.error) {
      error.value = result.error.message || "Erreur de connexion GitHub";
    }
  } catch {
    error.value = "Erreur de connexion GitHub";
  } finally {
    loadingGithub.value = false;
  }
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-background">
    <div
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-background to-background dark:from-neutral-900"
    />
    <div class="absolute -left-16 top-10 h-64 w-64 rounded-full bg-neutral-200/60 blur-3xl dark:bg-neutral-800/40" />
    <div class="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-neutral-300/40 blur-3xl dark:bg-neutral-700/30" />

    <div class="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <p class="text-sm font-medium text-muted-foreground">Bienvenue sur Kite</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Inscription
          </h1>
          <p class="mt-2 text-sm text-muted-foreground">
            Créez votre compte pour commencer à générer des projets.
          </p>
        </div>

        <div
          class="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/5 backdrop-blur"
        >
          <!-- GitHub -->
          <Button
            type="button"
            class="w-full justify-center gap-2"
            :disabled="loadingGithub"
            @click="handleGitHubLogin"
          >
            {{ loadingGithub ? "Connexion..." : "Continuer avec GitHub" }}
          </Button>

          <div class="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator class="flex-1" />
            <span>ou par email</span>
            <Separator class="flex-1" />
          </div>

          <!-- Form -->
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <Label for="name">Nom</Label>
              <Input
                id="name"
                v-model="name"
                type="text"
                required
                placeholder="Votre nom"
              />
            </div>

            <div class="space-y-2">
              <Label for="email">Email</Label>
              <Input
                id="email"
                v-model="email"
                type="email"
                required
                placeholder="votre@email.com"
              />
            </div>

            <div class="space-y-2">
              <Label for="password">Mot de passe</Label>
              <Input
                id="password"
                v-model="password"
                type="password"
                required
                minlength="8"
                placeholder="8 caractères minimum"
              />
            </div>

            <p v-if="error" class="text-sm font-medium text-destructive">
              {{ error }}
            </p>

            <Button type="submit" class="w-full" :disabled="loading">
              {{ loading ? "Inscription..." : "S'inscrire" }}
            </Button>
          </form>
        </div>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          Déjà un compte ?
          <NuxtLink to="/login" class="font-medium text-foreground hover:underline">
            Se connecter
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
