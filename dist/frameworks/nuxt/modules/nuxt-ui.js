"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nuxtUiModule = void 0;
exports.nuxtUiModule = {
    id: 'nuxt-ui',
    name: 'NuxtUI (UI avec Tailwind)',
    description: 'Bibliothèque de composants UI officielle pour Nuxt',
    dependsOn: ['tailwind'],
    hasSetupScript: false,
    instructions: {
        title: 'NuxtUI',
        steps: [
            'Les composants sont disponibles directement: <UButton>, <UCard>, etc.',
            'Personnaliser les couleurs dans nuxt.config.ts > colorMode'
        ],
        links: ['https://ui.nuxt.com']
    }
};
