"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shadcnModule = void 0;
exports.shadcnModule = {
    id: 'shadcn',
    name: 'Shadcn Vue (Composants UI)',
    description: 'Composants UI réutilisables et personnalisables',
    dependsOn: ['tailwind'],
    hasSetupScript: false, // Requires interactive setup (npx shadcn-vue@latest init)
    instructions: {
        title: 'Shadcn Vue',
        steps: [
            '1. Exécuter: npx shadcn-vue@latest init (configuration interactive)',
            '2. Les composants seront dans /components/ui',
            '3. Ajouter des composants: npx shadcn-vue@latest add button',
            'Voir tous les composants: https://www.shadcn-vue.com'
        ],
        links: ['https://www.shadcn-vue.com']
    }
};
