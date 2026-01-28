"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.supabaseModule = void 0;
exports.supabaseModule = {
    id: 'supabase',
    name: 'Supabase (Backend as a Service)',
    description: 'Alternative open-source à Firebase',
    dependsOn: [],
    hasSetupScript: false,
    instructions: {
        title: 'Supabase',
        steps: [
            'Créer un projet sur https://supabase.com',
            'Configurer SUPABASE_URL et SUPABASE_KEY dans .env',
            'Les clés sont disponibles dans Settings > API'
        ],
        links: ['https://supabase.com/docs']
    },
    docker: {
        services: {
            app: {
                environment: [
                    'SUPABASE_URL=${SUPABASE_URL}',
                    'SUPABASE_KEY=${SUPABASE_KEY}'
                ]
            }
        }
    }
};
