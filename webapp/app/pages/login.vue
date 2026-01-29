<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleEmailLogin() {
  loading.value = true;
  error.value = "";

  const result = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  });

  if (result.error) {
    error.value = result.error.message || "Erreur de connexion";
  } else {
    navigateTo("/dashboard");
  }

  loading.value = false;
}

async function handleGitHubLogin() {
  await authClient.signIn.social({ provider: "github" });
}

async function handleGoogleLogin() {
  await authClient.signIn.social({ provider: "google" });
}
</script>

<template>
  <div class="auth-container">
    <h1>Connexion</h1>

    <form @submit.prevent="handleEmailLogin" class="auth-form">
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          required
          placeholder="votre@email.com"
        />
      </div>

      <div class="form-group">
        <label for="password">Mot de passe</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          placeholder="••••••••"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? "Connexion..." : "Se connecter" }}
      </button>
    </form>

    <div class="divider">
      <span>ou</span>
    </div>

    <div class="social-buttons">
      <button @click="handleGitHubLogin" class="github">
        Continuer avec GitHub
      </button>
      <button @click="handleGoogleLogin" class="google">
        Continuer avec Google
      </button>
    </div>

    <p class="link">
      Pas encore de compte ?
      <NuxtLink to="/register">S'inscrire</NuxtLink>
    </p>
  </div>
</template>

<style scoped>
.auth-container {
  max-width: 400px;
  margin: 2rem auto;
  padding: 2rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

input {
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

button {
  padding: 0.75rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

button[type="submit"] {
  background: #000;
  color: #fff;
}

button:disabled {
  opacity: 0.5;
}

.divider {
  text-align: center;
  margin: 1.5rem 0;
  color: #666;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.github {
  background: #24292e;
  color: #fff;
}

.google {
  background: #4285f4;
  color: #fff;
}

.error {
  color: red;
  font-size: 0.875rem;
}

.link {
  text-align: center;
  margin-top: 1rem;
}
</style>
