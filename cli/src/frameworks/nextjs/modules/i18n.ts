import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const i18nModule: ModuleDefinition = {
  id: 'i18n',
  name: 'Internationalisation (next-intl)',
  description: 'Support multilingue avec next-intl',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [
    {
      id: 'defaultLocale',
      type: 'select',
      message: 'Langue par défaut ?',
      choices: [
        { name: 'Français', value: 'fr', description: 'Français comme langue par défaut' },
        { name: 'English', value: 'en', description: 'English as default language' }
      ],
      default: 'fr'
    }
  ],

  configure: (answers, context): ModuleConfiguration => {
    return {
      dependencies: {
        'next-intl': '^4.0.0'
      }
    };
  },

  instructions: {
    title: 'Internationalisation (next-intl)',
    steps: [
      '1. Ajouter vos traductions dans messages/fr.json et messages/en.json',
      '2. Utiliser useTranslations() dans vos composants',
      '3. Les routes sont préfixées par la locale (/fr/..., /en/...)',
      '4. Le middleware gère la redirection automatique'
    ],
    links: ['https://next-intl.dev/docs/getting-started/app-router']
  }
};
