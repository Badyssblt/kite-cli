<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";

const name = ref("");
const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

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
</script>

<template>
  <div class="auth-container">
    <h1>Inscription</h1>

    <form @submit.prevent="handleRegister" class="auth-form">
      <div class="form-group">
        <label for="name">Nom</label>
        <input
          id="name"
          v-model="name"
          type="text"
          required
          placeholder="Votre nom"
        />
      </div>

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
          minlength="8"
          placeholder="••••••••"
        />
      </div>

      <p v-if="error" class="error">{{ error }}</p>

      <button type="submit" :disabled="loading">
        {{ loading ? "Inscription..." : "S'inscrire" }}
      </button>
    </form>

    <p class="link">
      Déjà un compte ?
      <NuxtLink to="/login">Se connecter</NuxtLink>
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
  background: #000;
  color: #fff;
}

button:disabled {
  opacity: 0.5;
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
