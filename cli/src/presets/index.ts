import type { PresetDefinition } from '../types';

export const presets: Record<string, PresetDefinition> = {
  saas: {
    name: 'SaaS Starter',
    description: 'Auth, base de données et paiements',
    framework: ['nuxt', 'nextjs'],
    modules: ['prisma', 'better-auth', 'stripe', 'tailwind'],
    answers: {
      prisma: { database: 'postgresql' },
    },
  },
};