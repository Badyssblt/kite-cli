import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl);

// Keys
export const CACHE_KEYS = {
  // Arbre de base d'un framework
  BASE_TREE: (framework: string) => `kite:tree:${framework}:base`,
  // Arbre d'un module spécifique
  MODULE_TREE: (framework: string, module: string) => `kite:tree:${framework}:module:${module}`,
  // Contenu d'un fichier
  FILE: (framework: string, path: string, module?: string) =>
    `kite:file:${framework}:${module || 'base'}:${path}`,
};

// Pas d'expiration, mise à jour manuelle via `kite sync`
