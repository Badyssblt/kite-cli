import { moduleRegistry } from '../../../core/module-registry';
import type { ModuleDefinition, ModuleConfiguration, PromptContext } from '../../../types';

export const betterAuthModule: ModuleDefinition = {
  id: 'better-auth',
  name: 'Better Auth (Authentification)',
  description: 'Authentification moderne et flexible pour Nuxt',
  dependsOn: [],
  hasSetupScript: false,

  // Fragments conditionnels selon l'ORM choisi
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
        { name: 'MySQL (direct)', value: 'mysql', description: 'Connexion directe avec mysql2' },
        { name: 'SQLite', value: 'sqlite', description: 'Base locale fichier' },
        { name: 'MongoDB', value: 'mongodb', description: 'Base NoSQL' }
      ],
      default: 'prisma'
    },
    {
      id: 'emailPassword',
      type: 'confirm',
      message: 'Activer authentification email/password ?',
      default: true
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

  /**
   * 
   * @param answers Réponse du module courant
   * @param context Contient le contexte de tous les autres modules
   * @returns 
   */
  configure: (answers, context): ModuleConfiguration => {
    const database = answers.database as string;
    const emailPassword = answers.emailPassword as boolean;
    const githubOAuth = answers.githubOAuth as boolean;
    const googleOAuth = answers.googleOAuth as boolean;
    const hasPrisma = context.selectedModules.includes('prisma');

    // Variables d'environnement
    const env: Record<string, string> = {
      BETTER_AUTH_SECRET: 'change-me-generate-with-openssl-rand-base64-32',
      BETTER_AUTH_URL: 'http://localhost:3000'
    };
      

    betterAuthModule.placeholderDefinition = {
      PROVIDER: context.answers?.prisma?.database
    };
    

    if (githubOAuth) {
      env['GITHUB_CLIENT_ID'] = '';
      env['GITHUB_CLIENT_SECRET'] = '';
    }

    if (googleOAuth) {
      env['GOOGLE_CLIENT_ID'] = '';
      env['GOOGLE_CLIENT_SECRET'] = '';
    }

    // Dépendances selon l'adaptateur
    const dependencies: Record<string, string> = {
      'better-auth': '^1.4.17'
    };

    const devDependencies: Record<string, string> = {
      '@better-auth/cli': '^1.4.17'
    };

    // Ajouter le driver de base de données si pas Prisma
    if (database === 'pg' && !hasPrisma) {
      dependencies['pg'] = '^8.13.0';
    } else if (database === 'mysql') {
      dependencies['mysql2'] = '^3.11.0';
    } else if (database === 'sqlite') {
      dependencies['better-sqlite3'] = '^11.0.0';
    } else if (database === 'mongodb') {
      dependencies['mongodb'] = '^6.10.0';
    } else if (database === 'drizzle') {
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
