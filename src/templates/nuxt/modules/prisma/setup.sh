#!/bin/bash
set -e

echo "📦 Configuration de Prisma..."

# Vérifier que DATABASE_URL est défini dans .env
if [ ! -f .env ]; then
  echo "❌ Erreur: Le fichier .env n'existe pas"
  echo "💡 Créez .env et configurez DATABASE_URL"
  exit 1
fi

if ! grep -q "^DATABASE_URL=" .env; then
  echo "❌ Erreur: DATABASE_URL n'est pas défini dans .env"
  echo "💡 Ajoutez: DATABASE_URL=\"postgresql://user:password@localhost:5432/mydb\""
  exit 1
fi

# Générer le client Prisma
echo "  ▸ Génération du client Prisma..."
npx prisma generate

# Créer et appliquer la migration initiale
echo "  ▸ Création de la première migration..."
npx prisma migrate dev --name init

echo "✅ Prisma configuré avec succès !"
echo "💡 Utilisez 'npx prisma studio' pour explorer votre base de données"
