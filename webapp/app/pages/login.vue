<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const error = ref("");
const loadingGithub = ref(false);

async function handleGitHubLogin() {
  if (loadingGithub.value) return;
  loadingGithub.value = true;
  error.value = "";

  try {
    const result = await authClient.signIn.social({
      provider: "github",
      scopes: ["read:user", "user:email", "repo"],
      callbackURL: "/dashboard",
      errorCallbackURL: "/login",
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
      class="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-neutral-100 via-background to-background"
    />
    <div class="absolute -left-16 top-10 h-64 w-64 rounded-full bg-neutral-200/60 blur-3xl" />
    <div class="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-neutral-300/40 blur-3xl" />

    <div class="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
      <div class="w-full max-w-md">
        <div class="mb-6 text-center">
          <p class="text-sm font-medium text-muted-foreground">Bienvenue sur Kite</p>
          <h1 class="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            Connexion
          </h1>
          <p class="mt-2 text-sm text-muted-foreground">
            Accédez à votre espace et reprenez là où vous étiez.
          </p>
        </div>

        <div
          class="rounded-2xl border border-border/60 bg-card/80 p-6 shadow-lg shadow-black/5 backdrop-blur"
        >
          <div class="grid gap-4">
            <Button
              type="button"
              class="w-full justify-center gap-2"
              :disabled="loadingGithub"
              @click="handleGitHubLogin"
            >
              {{ loadingGithub ? "Connexion..." : "Continuer avec GitHub" }}
            </Button>

            <p v-if="error" class="text-sm font-medium text-destructive">
              {{ error }}
            </p>
          </div>

          <div class="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Separator class="flex-1" />
            <span>ou</span>
            <Separator class="flex-1" />
          </div>

          <p class="text-xs text-muted-foreground text-center">
            Connexion sécurisée via OAuth GitHub.
          </p>
        </div>

        <p class="mt-6 text-center text-sm text-muted-foreground">
          Pas encore de compte ?
          <NuxtLink to="/register" class="font-medium text-foreground hover:underline">
            S'inscrire
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
