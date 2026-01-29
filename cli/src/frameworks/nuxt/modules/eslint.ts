import type { ModuleDefinition } from '../../../types';

export const eslintModule: ModuleDefinition = {
  id: 'eslint',
  name: 'ESLint + Prettier (Linting)',
  description: 'Linting et formatage de code',
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: 'ESLint + Prettier',
    steps: [
      'Exécuter: npm run lint (pour vérifier)',
      'Exécuter: npm run lint:fix (pour corriger automatiquement)',
      'Configurer votre IDE pour utiliser ESLint et Prettier'
    ],
    links: ['https://eslint.nuxt.com']
  }
};
