import type { ModuleDefinition } from '../../../types';

export const vitestModule: ModuleDefinition = {
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
