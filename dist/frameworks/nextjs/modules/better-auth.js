"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.betterAuthModule = void 0;
exports.betterAuthModule = {
    id: 'better-auth',
    name: 'Better Auth (Authentification)',
    description: 'Authentification moderne et flexible pour Next.js',
    dependsOn: [],
    hasSetupScript: false,
    fragments: [
        {
            source: '_fragments/prisma/schema.prisma',
            target: 'prisma/schema.prisma',
            ifModule: 'prisma',
            strategy: 'append',
            separator: '\n\n'
        }
    ],
    placeholderDefinition: {
        PROVIDER: 'postgresql'
    },
    prompts: [
        {
            id: 'database',
            type: 'select',
            message: 'Quel adaptateur de base de données ?',
            choices: [
                { name: 'Prisma', value: 'prisma', description: 'Utilise ton schema Prisma existant' },
                { name: 'Drizzle', value: 'drizzle', description: 'ORM TypeScript léger' },
                { name: 'PostgreSQL (direct)', value: 'pg', description: 'Connexion directe avec pg' },
                { name: 'MySQL (direct)', value: 'mysql', description: 'Connexion directe avec mysql2' }
            ],
            default: 'prisma'
        },
        {
            id: 'githubOAuth',
            type: 'confirm',
            message: 'Activer GitHub OAuth ?',
            default: true
        },
        {
            id: 'googleOAuth',
            type: 'confirm',
            message: 'Activer Google OAuth ?',
            default: false
        }
    ],
    configure: (answers, context) => {
        const database = answers.database;
        const githubOAuth = answers.githubOAuth;
        const googleOAuth = answers.googleOAuth;
        const env = {
            BETTER_AUTH_SECRET: 'change-me-generate-with-openssl-rand-base64-32',
            BETTER_AUTH_URL: 'http://localhost:3000'
        };
        exports.betterAuthModule.placeholderDefinition = {
            PROVIDER: context.answers?.prisma?.database || 'postgresql'
        };
        if (githubOAuth) {
            env['GITHUB_CLIENT_ID'] = '';
            env['GITHUB_CLIENT_SECRET'] = '';
        }
        if (googleOAuth) {
            env['GOOGLE_CLIENT_ID'] = '';
            env['GOOGLE_CLIENT_SECRET'] = '';
        }
        const dependencies = {
            'better-auth': '^1.4.17'
        };
        const devDependencies = {
            '@better-auth/cli': '^1.4.17'
        };
        if (database === 'drizzle') {
            dependencies['drizzle-orm'] = '^0.36.0';
            devDependencies['drizzle-kit'] = '^0.28.0';
        }
        return {
            env,
            dependencies,
            devDependencies
        };
    },
    instructions: {
        title: 'Better Auth',
        steps: [
            '1. Générer un secret: openssl rand -base64 32',
            '2. Mettre le secret dans BETTER_AUTH_SECRET (.env)',
            '3. Créer les tables: npx @better-auth/cli migrate',
            '4. Pour GitHub OAuth: https://github.com/settings/developers',
            '5. Pour Google OAuth: https://console.cloud.google.com/apis/credentials'
        ],
        links: ['https://www.better-auth.com/docs']
    },
    docker: {
        services: {
            app: {
                environment: [
                    'BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}',
                    'BETTER_AUTH_URL=${BETTER_AUTH_URL}'
                ]
            }
        }
    }
};
