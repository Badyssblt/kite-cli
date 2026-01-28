import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const shadcnModule: ModuleDefinition = {
  id: 'shadcn',
  name: 'shadcn/ui',
  description: 'Composants UI accessibles et personnalisables',
  dependsOn: ['tailwind'],
  hasSetupScript: true,

  prompts: [],

  configure: (answers, context): ModuleConfiguration => {
    return {
      env: {},
      dependencies: {
        'class-variance-authority': '^0.7.0',
        'clsx': '^2.1.0',
        'tailwind-merge': '^2.2.0',
        'lucide-react': '^0.400.0',
        '@radix-ui/react-slot': '^1.0.0'
      },
      devDependencies: {}
    };
  },

  instructions: {
    title: 'shadcn/ui',
    steps: [
      '1. Ajouter un composant: npx shadcn@latest add button',
      '2. Les composants sont dans components/ui/',
      '3. Personnaliser les styles dans globals.css'
    ],
    links: ['https://ui.shadcn.com/docs']
  }
};
