import type { ModuleDefinition } from '../../../types';

export const piniaModule: ModuleDefinition = {
  id: 'pinia',
  name: "Pinia (Gestion d'état)",
  description: "Store intuitif pour Vue.js",
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: "Pinia (Gestion d'état)",
    steps: [
      'Les stores sont dans /stores',
      'Utiliser: const store = useCounterStore()',
      'Documentation complète disponible'
    ],
    links: ['https://pinia.vuejs.org']
  }
};
