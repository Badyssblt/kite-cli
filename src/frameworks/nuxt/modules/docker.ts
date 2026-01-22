import type { ModuleDefinition } from '../../../types';

export const dockerModule: ModuleDefinition = {
  id: 'docker',
  name: 'Docker (Containerisation)',
  description: 'Containerisation de votre application',
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: 'Docker',
    steps: [
      'Le docker-compose.yml a été généré selon vos modules',
      'Démarrer tous les services: docker-compose up -d',
      'Voir les logs: docker-compose logs -f',
      'Arrêter: docker-compose down',
      'Note: Si vous avez Prisma, la DB PostgreSQL est incluse'
    ],
    links: ['https://docs.docker.com']
  },
  docker: {
    services: {
      app: {
        build: '.',
        ports: ['3000:3000'],
        environment: ['NODE_ENV=production'],
        restart: 'unless-stopped',
        volumes: ['./:/app']
      }
    }
  }
};
