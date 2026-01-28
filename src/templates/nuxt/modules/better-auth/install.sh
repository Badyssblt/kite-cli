#!/bin/bash

# Install Better Auth
npm install better-auth
npm install -D @better-auth/cli

# Create lib/auth.ts
mkdir -p lib
cat > lib/auth.ts << 'EOF'
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
});
EOF

# Create lib/auth-client.ts
cat > lib/auth-client.ts << 'EOF'
import { createAuthClient } from "better-auth/vue";

export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
EOF

# Create server API route
mkdir -p server/api/auth
cat > "server/api/auth/[...all].ts" << 'EOF'
import { auth } from "~~/lib/auth";
import { toWebRequest } from "better-auth/utils";

export default defineEventHandler((event) => {
  return auth.handler(toWebRequest(event));
});
EOF

# Create session API route (for SSR)
mkdir -p server/api
cat > server/api/session.get.ts << 'EOF'
import { auth } from "~~/lib/auth";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  return session;
});
EOF

# Create login page
mkdir -p app/pages
cat > app/pages/login.vue << 'EOF'
<script setup lang="ts">
import { authClient } from "~~/lib/auth-client";

const email = ref("");
const password = ref("");
const error = ref("");
const loading = ref(false);

async function handleLogin() {
  loading.value = true;
  error.value = "";

  const result = await authClient.signIn.email({
    email: email.value,
    password: password.value,
  });

  if (result.error) {
    error.value = result.error.message || "Login failed";
  } else {
    navigateTo("/dashboard");
  }
  loading.value = false;
}
</script>

<template>
  <div style="max-width: 400px; margin: 4rem auto; padding: 2rem">
    <h1>Login</h1>
    <form @submit.prevent="handleLogin">
      <div style="margin-bottom: 1rem">
        <label>Email</label>
        <input v-model="email" type="email" required style="width: 100%; padding: 0.5rem" />
      </div>
      <div style="margin-bottom: 1rem">
        <label>Password</label>
        <input v-model="password" type="password" required style="width: 100%; padding: 0.5rem" />
      </div>
      <p v-if="error" style="color: red">{{ error }}</p>
      <button type="submit" :disabled="loading" style="width: 100%; padding: 0.75rem">
        {{ loading ? "Loading..." : "Login" }}
      </button>
    </form>
    <p style="margin-top: 1rem; text-align: center">
      No account? <NuxtLink to="/register">Register</NuxtLink>
    </p>
  </div>
</template>
EOF

# Create register page
cat > app/pages/register.vue << 'EOF'
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
    error.value = result.error.message || "Registration failed";
  } else {
    navigateTo("/dashboard");
  }
  loading.value = false;
}
</script>

<template>
  <div style="max-width: 400px; margin: 4rem auto; padding: 2rem">
    <h1>Register</h1>
    <form @submit.prevent="handleRegister">
      <div style="margin-bottom: 1rem">
        <label>Name</label>
        <input v-model="name" type="text" required style="width: 100%; padding: 0.5rem" />
      </div>
      <div style="margin-bottom: 1rem">
        <label>Email</label>
        <input v-model="email" type="email" required style="width: 100%; padding: 0.5rem" />
      </div>
      <div style="margin-bottom: 1rem">
        <label>Password</label>
        <input v-model="password" type="password" required style="width: 100%; padding: 0.5rem" />
      </div>
      <p v-if="error" style="color: red">{{ error }}</p>
      <button type="submit" :disabled="loading" style="width: 100%; padding: 0.75rem">
        {{ loading ? "Loading..." : "Register" }}
      </button>
    </form>
    <p style="margin-top: 1rem; text-align: center">
      Have an account? <NuxtLink to="/login">Login</NuxtLink>
    </p>
  </div>
</template>
EOF

# Create dashboard page (SSR)
cat > app/pages/dashboard.vue << 'EOF'
<template>
  <div style="max-width: 600px; margin: 4rem auto; padding: 2rem">
    <h1>Dashboard</h1>
    <div v-if="session">
      <p>Welcome, {{ session.user?.name || session.user?.email }}!</p>
      <pre style="background: #f5f5f5; padding: 1rem; border-radius: 4px">{{ session }}</pre>
      <button @click="handleSignOut" style="margin-top: 1rem; padding: 0.5rem 1rem">
        Sign Out
      </button>
    </div>
    <div v-else>
      <p>Not logged in</p>
      <NuxtLink to="/login">Login</NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { authClient } from "~~/lib/auth-client";

const { data: session } = await useFetch("/api/session");

async function handleSignOut() {
  await authClient.signOut();
  navigateTo("/login");
}
</script>
EOF

# Add env variables
if [ -f ".env" ]; then
  echo "" >> .env
  echo "# Better Auth" >> .env
  echo "BETTER_AUTH_SECRET=change-me-run-openssl-rand-base64-32" >> .env
  echo "BETTER_AUTH_URL=http://localhost:3000" >> .env
  echo "GITHUB_CLIENT_ID=" >> .env
  echo "GITHUB_CLIENT_SECRET=" >> .env
fi

echo "✓ Better Auth installed"
echo "  Next steps:"
echo "  1. Generate secret: openssl rand -base64 32"
echo "  2. Update BETTER_AUTH_SECRET in .env"
echo "  3. Run: npx @better-auth/cli migrate"
