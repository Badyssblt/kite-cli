"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaModule = void 0;
exports.prismaModule = {
    id: 'prisma',
    name: 'Prisma (ORM)',
    description: 'ORM TypeScript moderne pour la base de données',
    dependsOn: [],
    hasSetupScript: false,
    prompts: [
        {
            id: 'database',
            type: 'select',
            message: 'Quel type de base de données ?',
            choices: [
                { name: 'PostgreSQL', value: 'postgresql', description: 'Base relationnelle robuste' },
                { name: 'MySQL', value: 'mysql', description: 'Base relationnelle populaire' },
                { name: 'SQLite', value: 'sqlite', description: 'Base locale fichier' },
                { name: 'MongoDB', value: 'mongodb', description: 'Base NoSQL' }
            ],
            default: 'postgresql'
        }
    ],
    placeholderDefinition: {
        PROVIDER: 'postgresql'
    },
    configure: (answers, context) => {
        const database = answers.database;
        exports.prismaModule.placeholderDefinition = {
            PROVIDER: database
        };
        const env = {};
        if (database === 'postgresql') {
            env['DATABASE_URL'] = 'postgresql://postgres:secret@db:5432/myapp';
        }
        else if (database === 'mysql') {
            env['DATABASE_URL'] = 'mysql://root:secret@db:3306/myapp';
        }
        else if (database === 'sqlite') {
            env['DATABASE_URL'] = 'file:./dev.db';
        }
        else if (database === 'mongodb') {
            env['DATABASE_URL'] = 'mongodb://mongo:secret@db:27017/myapp';
        }
        return {
            env,
            dependencies: {
                '@prisma/client': '^6.0.0'
            },
            devDependencies: {
                'prisma': '^6.0.0'
            }
        };
    },
    instructions: {
        title: 'Prisma',
        steps: [
            '1. Configurer DATABASE_URL dans .env',
            '2. Initialiser: npx prisma init',
            '3. Créer les tables: npx prisma db push',
            '4. Générer le client: npx prisma generate'
        ],
        links: ['https://www.prisma.io/docs']
    },
    docker: {
        services: {
            app: {
                environment: ['DATABASE_URL=${DATABASE_URL}'],
                depends_on: ['db']
            },
            db: {
                image: 'postgres:16',
                environment: ['POSTGRES_PASSWORD=secret', 'POSTGRES_DB=myapp'],
                ports: ['5432:5432'],
                volumes: ['db_data:/var/lib/postgresql/data']
            }
        },
        volumes: {
            db_data: {}
        }
    }
};
