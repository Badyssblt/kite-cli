import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const zustandModule: ModuleDefinition = {
  id: 'zustand',
  name: 'Zustand',
  description: 'Gestion d\'état légère et simple pour React',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [
    {
      id: 'withPersist',
      type: 'confirm',
      message: 'Activer la persistance (localStorage) ?',
      default: false
    },
    {
      id: 'withDevtools',
      type: 'confirm',
      message: 'Activer les devtools Redux ?',
      default: true
    }
  ],

  configure: (answers, context): ModuleConfiguration => {
    return {
      dependencies: {
        'zustand': '^5.0.0'
      }
    };
  },

  instructions: {
    title: 'Zustand',
    steps: [
      '1. Créer vos stores dans lib/stores/',
      '2. Utiliser useStore() dans vos composants Client',
      '3. Les Server Components ne peuvent pas utiliser Zustand directement',
      '4. Passer les données du serveur via props pour l\'hydratation'
    ],
    links: ['https://zustand.docs.pmnd.rs/guides/nextjs']
  }
};
