"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.eslintModule = void 0;
exports.eslintModule = {
    id: 'eslint',
    name: 'ESLint + Prettier (Linting)',
    description: 'Linting et formatage de code',
    dependsOn: [],
    hasSetupScript: false,
    instructions: {
        title: 'ESLint + Prettier',
        steps: [
            'Exécuter: npm run lint (pour vérifier)',
            'Exécuter: npm run lint:fix (pour corriger automatiquement)',
            'Configurer votre IDE pour utiliser ESLint et Prettier'
        ],
        links: ['https://eslint.nuxt.com']
    }
};
