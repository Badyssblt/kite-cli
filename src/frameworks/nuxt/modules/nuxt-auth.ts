import type { ModuleDefinition } from '../../../types';

export const nuxtAuthModule: ModuleDefinition = {
  id: 'nuxt-auth',
  name: 'NuxtAuth (Authentification Sidebase)',
  description: 'Authentification complète pour Nuxt',
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: 'NuxtAuth (Authentification)',
    steps: [
      'Générer un secret: openssl rand -base64 32',
      'Configurer AUTH_SECRET dans .env',
      'Pour GitHub OAuth: créer une app sur https://github.com/settings/developers',
      'Configurer GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET'
    ],
    links: ['https://sidebase.io/nuxt-auth/getting-started']
  },
  docker: {
    services: {
      app: {
        environment: [
          'AUTH_ORIGIN=${AUTH_ORIGIN}',
          'AUTH_SECRET=${AUTH_SECRET}',
          'GITHUB_CLIENT_ID=${GITHUB_CLIENT_ID}',
          'GITHUB_CLIENT_SECRET=${GITHUB_CLIENT_SECRET}'
        ]
      }
    }
  }
};
