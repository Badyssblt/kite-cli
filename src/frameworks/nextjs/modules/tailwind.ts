import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const tailwindModule: ModuleDefinition = {
  id: 'tailwind',
  name: 'Tailwind CSS',
  description: 'Framework CSS utilitaire',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [],

  configure: (answers, context): ModuleConfiguration => {
    return {
      env: {},
      dependencies: {},
      devDependencies: {
        'tailwindcss': '^3.4.0',
        'postcss': '^8.4.0',
        'autoprefixer': '^10.4.0'
      }
    };
  },

  instructions: {
    title: 'Tailwind CSS',
    steps: [
      '1. Tailwind est déjà configuré',
      '2. Utilisez les classes utilitaires dans vos composants'
    ],
    links: ['https://tailwindcss.com/docs']
  }
};
