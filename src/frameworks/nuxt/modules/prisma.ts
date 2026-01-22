import type { ModuleDefinition } from '../../../types';

export const prismaModule: ModuleDefinition = {
  id: 'prisma',
  name: 'Prisma (Base de données ORM)',
  description: 'ORM moderne pour Node.js et TypeScript',
  dependsOn: [],
  hasSetupScript: false, // Requires manual configuration (DATABASE_URL + running DB)
  instructions: {
    title: 'Prisma (Base de données)',
    steps: [
      '1. Configurer DATABASE_URL dans .env',
      '2. Démarrer votre base de données (ou docker-compose up -d si Docker)',
      '3. Exécuter: npx prisma generate',
      '4. Exécuter: npx prisma migrate dev --name init',
      'Optionnel: npx prisma studio (interface graphique DB)'
    ],
    links: ['https://www.prisma.io/docs']
  },
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
