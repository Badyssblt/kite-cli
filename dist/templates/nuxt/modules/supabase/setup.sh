#!/bin/bash
set -e

echo "🚀 Configuration de Supabase..."

# Vérifier que .env existe et contient les variables
if [ ! -f .env ]; then
  echo "❌ Erreur: Le fichier .env n'existe pas"
  exit 1
fi

if ! grep -q "^SUPABASE_URL=" .env || grep -q "^SUPABASE_URL=https://your-project.supabase.co" .env; then
  echo "⚠️  SUPABASE_URL n'est pas configuré"
  echo "💡 Créez un projet sur https://supabase.com"
  echo "💡 Puis configurez SUPABASE_URL et SUPABASE_KEY dans .env"
  exit 1
fi

echo "✅ Supabase configuré !"
echo "💡 Vos clés sont disponibles dans: Settings > API sur votre dashboard Supabase"
