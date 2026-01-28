#!/bin/bash
set -e

echo "🎨 Configuration de Shadcn Vue..."

# Vérifier que npx est disponible
if ! command -v npx &> /dev/null; then
  echo "❌ Erreur: npx n'est pas disponible"
  echo "💡 Installez Node.js et npm"
  exit 1
fi

# Exécuter l'init de shadcn-vue
echo "  ▸ Initialisation de shadcn-vue..."
echo "  💡 Répondez aux questions (Tailwind devrait être détecté automatiquement)"
echo ""

npx shadcn-vue@latest init

echo ""
echo "✅ Shadcn Vue configuré avec succès !"
echo "💡 Ajoutez des composants avec: npx shadcn-vue@latest add <component>"
echo "   Exemple: npx shadcn-vue@latest add button"
