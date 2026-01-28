"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dockerModule = void 0;
exports.dockerModule = {
    id: 'docker',
    name: 'Docker (Développement)',
    description: 'Environnement de développement containerisé',
    dependsOn: [],
    hasSetupScript: false,
    instructions: {
        title: 'Docker (Dev)',
        steps: [
            'Démarrer: docker-compose up -d',
            'Voir les logs: docker-compose logs -f app',
            'Arrêter: docker-compose down',
            'Le hot-reload est actif (volumes montés)',
            'Les node_modules sont dans un volume séparé pour la performance'
        ],
        links: ['https://docs.docker.com']
    },
    docker: {
        services: {
            app: {
                build: '.',
                ports: ['3000:3000'],
                environment: ['NODE_ENV=development'],
                volumes: [
                    '.:/app', // Code source monté
                    '/app/node_modules', // node_modules isolés dans le container
                    '/app/.nuxt' // Cache Nuxt isolé
                ],
                restart: 'unless-stopped'
            }
        }
    }
};
