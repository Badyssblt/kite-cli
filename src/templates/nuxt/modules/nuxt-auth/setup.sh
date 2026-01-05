#!/bin/bash
set -e

echo "🔐 Configuration de NuxtAuth..."

# Vérifier que .env existe
if [ ! -f .env ]; then
  echo "❌ Erreur: Le fichier .env n'existe pas"
  exit 1
fi

# Vérifier que AUTH_SECRET est défini
if ! grep -q "^AUTH_SECRET=" .env || grep -q "^AUTH_SECRET=your-secret-key" .env; then
  echo "⚠️  AUTH_SECRET n'est pas configuré"
  echo "  ▸ Génération d'un secret aléatoire..."

  # Générer un secret avec openssl ou fallback
  if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
  else
    SECRET=$(head -c 32 /dev/urandom | base64)
  fi

  # Remplacer ou ajouter AUTH_SECRET dans .env
  if grep -q "^AUTH_SECRET=" .env; then
    # Remplacer (compatible macOS et Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
    else
      sed -i "s|^AUTH_SECRET=.*|AUTH_SECRET=\"$SECRET\"|" .env
    fi
  else
    echo "AUTH_SECRET=\"$SECRET\"" >> .env
  fi

  echo "  ✅ AUTH_SECRET généré et ajouté à .env"
fi

echo "✅ NuxtAuth configuré !"
echo "💡 Configurez aussi GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET pour OAuth"
