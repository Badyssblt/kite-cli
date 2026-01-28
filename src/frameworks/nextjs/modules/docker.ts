import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const dockerModule: ModuleDefinition = {
  id: 'docker',
  name: 'Docker',
  description: 'Configuration Docker pour le développement',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [],

  configure: (answers, context): ModuleConfiguration => {
    return {
      env: {},
      dependencies: {},
      devDependencies: {}
    };
  },

  instructions: {
    title: 'Docker',
    steps: [
      '1. Démarrer: docker-compose up -d',
      '2. Voir les logs: docker-compose logs -f',
      '3. Arrêter: docker-compose down'
    ],
    links: ['https://docs.docker.com/compose/']
  },

  docker: {
    services: {
      app: {
        build: '.',
        ports: ['3000:3000'],
        volumes: ['.:/app', '/app/node_modules', '/app/.next'],
        environment: ['NODE_ENV=development'],
        restart: 'unless-stopped'
      }
    }
  }
};
