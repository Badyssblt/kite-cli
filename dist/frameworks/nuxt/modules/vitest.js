"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vitestModule = void 0;
exports.vitestModule = {
    id: 'vitest',
    name: 'Vitest (Tests unitaires)',
    description: 'Framework de test rapide pour Vite',
    dependsOn: [],
    hasSetupScript: false,
    instructions: {
        title: 'Vitest (Tests)',
        steps: [
            'Créer vos tests dans /tests',
            'Exécuter: npm test',
            'Avec UI: npm run test:ui',
            'Coverage: npm run test:coverage'
        ],
        links: ['https://vitest.dev']
    }
};
