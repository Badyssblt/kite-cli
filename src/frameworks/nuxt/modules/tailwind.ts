import type { ModuleDefinition } from '../../../types';

export const tailwindModule: ModuleDefinition = {
  id: 'tailwind',
  name: 'Tailwind CSS (Styling)',
  description: 'Framework CSS utilitaire',
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: 'Tailwind CSS',
    steps: [
      'Le fichier CSS principal est dans ./app/assets/css/main.css',
      'Personnaliser tailwind.config.js pour vos besoins'
    ],
    links: ['https://tailwindcss.com/docs']
  }
};
