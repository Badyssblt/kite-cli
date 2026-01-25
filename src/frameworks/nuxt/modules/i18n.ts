import type { ModuleDefinition } from '../../../types';

export const i18nModule: ModuleDefinition = {
  id: 'i18n',
  name: 'i18n (Internationalisation)',
  description: 'Support multilingue pour Nuxt',
  dependsOn: [],
  hasSetupScript: false,
  instructions: {
    title: 'i18n (Internationalisation)',
    steps: [
      'Les traductions sont dans /locales',
      'Ajouter de nouvelles langues dans nuxt.config.ts > i18n.locales',
      "Utiliser: {{ $t('welcome') }} dans les templates"
    ],
    links: ['https://i18n.nuxtjs.org']
  }
};
