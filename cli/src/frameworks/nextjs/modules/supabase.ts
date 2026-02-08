import type { ModuleDefinition, ModuleConfiguration } from '../../../types';

export const supabaseModule: ModuleDefinition = {
  id: 'supabase',
  name: 'Supabase',
  description: 'Backend as a Service avec authentification et base de données',
  dependsOn: [],
  hasSetupScript: false,

  prompts: [
    {
      id: 'withAuth',
      type: 'confirm',
      message: 'Inclure l\'authentification Supabase ?',
      default: true
    }
  ],

  configure: (answers, context): ModuleConfiguration => {
    return {
      env: {
        'NEXT_PUBLIC_SUPABASE_URL': 'your-supabase-url',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'your-supabase-anon-key'
      },
      dependencies: {
        '@supabase/supabase-js': '^2.47.0',
        '@supabase/ssr': '^0.5.0'
      }
    };
  },

  instructions: {
    title: 'Supabase',
    steps: [
      '1. Créer un projet sur https://supabase.com',
      '2. Copier l\'URL et la clé publique dans .env.local',
      '3. Configurer les tables dans le dashboard Supabase',
      '4. Utiliser createClient() pour accéder à Supabase'
    ],
    links: ['https://supabase.com/docs/guides/getting-started/quickstarts/nextjs']
  }
};
