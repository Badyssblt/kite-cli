"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.i18nModule = void 0;
exports.i18nModule = {
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
