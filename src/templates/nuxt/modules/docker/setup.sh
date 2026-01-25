#!/bin/bash
set -e

echo "🐳 Configuration de Docker..."

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
  echo "❌ Erreur: Docker n'est pas installé"
  echo "Installez Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
  echo "❌ Erreur: Docker Compose n'est pas installé ou n'est pas disponible"
  echo "Installez Docker Compose"
  exit 1
fi

# Build les images Docker
echo "  ▸ Build des images Docker..."
docker-compose build

echo "✅ Docker configuré avec succès !"
echo "Démarrez avec: docker-compose up -d"
