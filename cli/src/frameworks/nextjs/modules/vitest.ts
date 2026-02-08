import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const vitestModule: ModuleDefinition = {
  id: 'vitest',
  name: 'Vitest',
  description: 'Framework de test rapide et moderne',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [],

  configure: (answers, context): ModuleConfiguration => {
    return {
      devDependencies: {
        'vitest': '^3.0.0',
        '@vitejs/plugin-react': '^4.0.0',
        'jsdom': '^26.0.0',
        '@testing-library/react': '^16.0.0',
        '@testing-library/dom': '^10.0.0',
        'vite-tsconfig-paths': '^5.0.0'
      }
    };
  },

  instructions: {
    title: 'Vitest',
    steps: [
      '1. Écrire vos tests dans des fichiers *.test.ts ou *.spec.ts',
      '2. Lancer les tests: npm run test',
      '3. Mode watch: npm run test:watch',
      '4. Couverture: npm run test:coverage'
    ],
    links: ['https://nextjs.org/docs/app/guides/testing/vitest']
  }
};
