import type { ModuleDefinition, ModuleConfiguration, PromptContext } from '../../../types';

// Configurations par type de base de données
const databaseConfigs = {
  postgresql: {
    image: 'postgres:16-alpine',
    port: '5432',
    volume: 'postgres_data:/var/lib/postgresql/data',
    volumeName: 'postgres_data'
  },
  mysql: {
    image: 'mariadb:11',
    port: '3306',
    volume: 'mariadb_data:/var/lib/mysql',
    volumeName: 'mariadb_data'
  },
  mongodb: {
    image: 'mongo:7',
    port: '27017',
    volume: 'mongo_data:/data/db',
    volumeName: 'mongo_data'
  },
  sqlite: {
    image: null,
    port: null,
    volume: null,
    volumeName: null
  }
};

// Dépendances par type de base de données
const adapterDependencies: Record<string, Record<string, string>> = {
  postgresql: {
    '@prisma/adapter-pg': '^6.8.2',
    'pg': '^8.13.1'
  },
  mysql: {
    '@prisma/adapter-mariadb': '^6.19.2'
  },
  sqlite: {
    '@prisma/adapter-better-sqlite3': '^6.8.2',
    'better-sqlite3': '^11.7.0'
  },
  mongodb: {}
};

export const prismaModule: ModuleDefinition = {
  id: 'prisma',
  name: 'Prisma (Base de données ORM)',
  description: 'ORM moderne pour Node.js et TypeScript',
  dependsOn: [],
  hasSetupScript: false,
  placeholderDefinition: {
    PROVIDER: 'postgresql'
  },

  // Variantes de fichiers selon la base de données
  fileVariants: [
    {
      promptId: 'database',
      targetPath: 'server/utils/db.ts',
      fallback: 'postgresql'
    }
  ],

  // Fragments à fusionner dans le schema Prisma
  fragments: [
    {
      source: '_fragments/schema.prisma',
      target: 'prisma/schema.prisma',
      strategy: 'append',
      separator: '\n\n'
    }
  ],

  // Questions interactives
  prompts: [
    {
      id: 'database',
      type: 'select',
      message: 'Quelle base de données ?',
      choices: [
        { name: 'PostgreSQL', value: 'postgresql', description: 'Base relationnelle robuste' },
        { name: 'MariaDB', value: 'mysql', description: 'Base relationnelle compatible MySQL' },
        { name: 'MongoDB', value: 'mongodb', description: 'Base NoSQL orientée documents' },
        { name: 'SQLite', value: 'sqlite', description: 'Base légère fichier (dev uniquement)' }
      ],
      default: 'postgresql'
    },
    {
      id: 'dbName',
      type: 'input',
      message: 'Nom de la base de données:',
      default: 'myapp'
    },
    {
      id: 'dbUser',
      type: 'input',
      message: 'Utilisateur:',
      default: 'postgres',
      when: (ctx) => {
        const db = ctx.answers['prisma']?.database;
        return db !== 'sqlite';
      }
    },
    {
      id: 'dbPassword',
      type: 'input',
      message: 'Mot de passe:',
      default: 'secret',
      when: (ctx) => {
        const db = ctx.answers['prisma']?.database;
        return db !== 'sqlite';
      }
    }
  ],

  // Génération de la configuration basée sur les réponses
  configure: (answers, context): ModuleConfiguration => {
    const database = (answers.database as string) || 'postgresql';
    const dbName = (answers.dbName as string) || 'myapp';
    const dbUser = (answers.dbUser as string) || 'postgres';
    const dbPassword = (answers.dbPassword as string) || 'secret';
    const hasDocker = context.selectedModules.includes('docker');
    
    prismaModule.placeholderDefinition = {
      PROVIDER: database
    };
    
    const config = databaseConfigs[database as keyof typeof databaseConfigs];

    // Construire l'URL de connexion
    let databaseUrl: string;
    const host = hasDocker ? 'db' : 'localhost';

    switch (database) {
      case 'sqlite':
        databaseUrl = 'file:./prisma/dev.db';
        break;
      case 'postgresql':
        databaseUrl = `postgresql://${dbUser}:${dbPassword}@${host}:5432/${dbName}?schema=public`;
        break;
      case 'mysql':
        databaseUrl = `mysql://${dbUser}:${dbPassword}@${host}:3306/${dbName}`;
        break;
      case 'mongodb':
        databaseUrl = `mongodb://${dbUser}:${dbPassword}@${host}:27017/${dbName}?authSource=admin`;
        break;
      default:
        databaseUrl = `postgresql://${dbUser}:${dbPassword}@${host}:5432/${dbName}?schema=public`;
    }

    const result: ModuleConfiguration = {
      env: {
        DATABASE_URL: databaseUrl
      },
      // Ajouter les dépendances de l'adaptateur selon la base de données
      dependencies: adapterDependencies[database] || {}
    };

    // Ajouter la config Docker si docker est sélectionné et pas SQLite
    if (hasDocker && database !== 'sqlite' && config.image) {
      const envVars: Record<string, string> = {};

      if (database === 'postgresql') {
        envVars['POSTGRES_USER'] = dbUser;
        envVars['POSTGRES_PASSWORD'] = dbPassword;
        envVars['POSTGRES_DB'] = dbName;
      } else if (database === 'mysql') {
        envVars['MYSQL_ROOT_PASSWORD'] = dbPassword;
        envVars['MYSQL_DATABASE'] = dbName;
        envVars['MYSQL_USER'] = dbUser;
        envVars['MYSQL_PASSWORD'] = dbPassword;
      } else if (database === 'mongodb') {
        envVars['MONGO_INITDB_ROOT_USERNAME'] = dbUser;
        envVars['MONGO_INITDB_ROOT_PASSWORD'] = dbPassword;
        envVars['MONGO_INITDB_DATABASE'] = dbName;
      }

      result.docker = {
        services: {
          app: {
            depends_on: ['db'],
            environment: { DATABASE_URL: databaseUrl }
          },
          db: {
            image: config.image,
            ports: [`${config.port}:${config.port}`],
            environment: envVars,
            volumes: [config.volume!],
            restart: 'unless-stopped'
          }
        },
        volumes: {
          [config.volumeName!]: {}
        }
      };
    }

    return result;
  },

  instructions: {
    title: 'Prisma (Base de données)',
    steps: [
      '1. Vérifier DATABASE_URL dans .env',
      '2. Démarrer la DB (docker-compose up -d db)',
      '3. npx prisma generate',
      '4. npx prisma migrate dev --name init',
      'Optionnel: npx prisma studio'
    ],
    links: ['https://www.prisma.io/docs']
  },

  // Config Docker par défaut (sera remplacée par configure() si disponible)
  docker: {
    services: {
      app: {
        depends_on: ['db'],
        environment: {
          DATABASE_URL: 'postgresql://postgres:postgres@db:5432/mydb?schema=public'
        }
      },
      db: {
        image: 'postgres:16-alpine',
        restart: 'unless-stopped',
        environment: {
          POSTGRES_USER: 'postgres',
          POSTGRES_PASSWORD: 'postgres',
          POSTGRES_DB: 'mydb'
        },
        ports: ['5432:5432'],
        volumes: ['postgres_data:/var/lib/postgresql/data']
      }
    },
    volumes: {
      postgres_data: {}
    }
  }
};
