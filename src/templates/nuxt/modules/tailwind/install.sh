#!/bin/bash

# Install Tailwind CSS for Nuxt
npm install -D @nuxtjs/tailwindcss

# Add module to nuxt.config.ts
if grep -q "modules:" nuxt.config.ts; then
  # Module array exists, add to it
  sed -i "s/modules: \[/modules: ['@nuxtjs\/tailwindcss', /" nuxt.config.ts
else
  # Add modules array
  sed -i "s/export default defineNuxtConfig({/export default defineNuxtConfig({\n  modules: ['@nuxtjs\/tailwindcss'],/" nuxt.config.ts
fi

# Initialize Tailwind config
npx tailwindcss init

echo "✓ Tailwind CSS installed for Nuxt"
