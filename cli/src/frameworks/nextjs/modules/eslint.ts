import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const eslintModule: ModuleDefinition = {
  id: 'eslint',
  name: 'ESLint',
  description: 'Linter JavaScript/TypeScript',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [],

  configure: (answers, context): ModuleConfiguration => {
    return {
      env: {},
      dependencies: {},
      devDependencies: {
        'eslint': '^9.0.0',
        'eslint-config-next': '^15.0.0',
        '@typescript-eslint/eslint-plugin': '^8.0.0',
        '@typescript-eslint/parser': '^8.0.0'
      }
    };
  },

  instructions: {
    title: 'ESLint',
    steps: [
      '1. Lancer le linter: npm run lint',
      '2. Corriger automatiquement: npm run lint -- --fix'
    ],
    links: ['https://eslint.org/docs']
  }
};
