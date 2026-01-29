#!/bin/bash
set -e

echo "🎨 Configuration de Shadcn Vue..."

# Installer les dépendances requises par shadcn-vue
echo "  ▸ Installation des dépendances..."
npm install -D typescript
npm install @vueuse/core @vueuse/nuxt tw-animate-css 


# Vérifier que npx est disponible
if ! command -v npx &> /dev/null; then
  echo "❌ Erreur: npx n'est pas disponible"
  echo "💡 Installez Node.js et npm"
  exit 1
fi

# Exécuter l'init de shadcn-vue
echo "  ▸ Initialisation de shadcn-nuxt..."
npx nuxi@latest module add shadcn-nuxt

echo ""
echo "✅ Shadcn Vue configuré avec succès !"
echo "💡 Ajoutez des composants avec: npx shadcn-vue@latest add <component>"
echo "   Exemple: npx shadcn-vue@latest add button"
