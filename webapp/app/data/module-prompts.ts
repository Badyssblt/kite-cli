// Définitions des prompts de configuration pour chaque module.
// Miroir des prompts définis dans cli/src/frameworks/{nuxt,nextjs}/modules/
// Utilisé dans la webapp pour configurer les presets.

export interface PromptChoice {
  name: string;
  value: string;
  description?: string;
}

export interface ModulePromptDef {
  id: string;
  type: 'select' | 'input' | 'confirm';
  message: string;
  choices?: PromptChoice[];
  default?: string | boolean;
  /** Condition: uniquement si ces modules sont aussi sélectionnés */
  whenModules?: string[];
}

export interface ModulePromptConfig {
  moduleId: string;
  /** Frameworks pour lesquels ces prompts s'appliquent (vide = tous) */
  frameworks?: string[];
  prompts: ModulePromptDef[];
}

export const MODULE_PROMPTS: ModulePromptConfig[] = [
  // --- Prisma ---
  {
    moduleId: 'prisma',
    prompts: [
      {
        id: 'database',
        type: 'select',
        message: 'Type de base de données',
        choices: [
          { name: 'PostgreSQL', value: 'postgresql', description: 'Base relationnelle robuste' },
          { name: 'MariaDB / MySQL', value: 'mysql', description: 'Base relationnelle populaire' },
          { name: 'SQLite', value: 'sqlite', description: 'Base locale fichier' },
          { name: 'MongoDB', value: 'mongodb', description: 'Base NoSQL' },
        ],
        default: 'postgresql',
      },
      {
        id: 'dbName',
        type: 'input',
        message: 'Nom de la base de données',
        default: 'myapp',
      },
    ],
  },

  // --- Better Auth ---
  {
    moduleId: 'better-auth',
    prompts: [
      {
        id: 'database',
        type: 'select',
        message: 'Adaptateur de base de données',
        choices: [
          { name: 'Prisma', value: 'prisma', description: 'Utilise ton schema Prisma existant' },
          { name: 'Drizzle', value: 'drizzle', description: 'ORM TypeScript léger' },
          { name: 'PostgreSQL (direct)', value: 'pg', description: 'Connexion directe avec pg' },
          { name: 'MySQL (direct)', value: 'mysql', description: 'Connexion directe avec mysql2' },
        ],
        default: 'prisma',
      },
      {
        id: 'emailPassword',
        type: 'confirm',
        message: 'Authentification email/password',
        default: true,
      },
      {
        id: 'githubOAuth',
        type: 'confirm',
        message: 'GitHub OAuth',
        default: true,
      },
      {
        id: 'googleOAuth',
        type: 'confirm',
        message: 'Google OAuth',
        default: false,
      },
    ],
  },

  // --- Stripe ---
  {
    moduleId: 'stripe',
    prompts: [
      {
        id: 'mode',
        type: 'select',
        message: 'Mode de paiement',
        choices: [
          { name: 'Paiement unique', value: 'payment', description: 'Pour vendre des produits/services' },
          { name: 'Abonnement', value: 'subscription', description: 'Pour des paiements récurrents' },
          { name: 'Les deux', value: 'both', description: 'Paiements uniques et abonnements' },
        ],
        default: 'payment',
      },
    ],
  },

  // --- Supabase ---
  {
    moduleId: 'supabase',
    frameworks: ['nextjs'],
    prompts: [
      {
        id: 'withAuth',
        type: 'confirm',
        message: 'Inclure l\'authentification Supabase',
        default: true,
      },
    ],
  },

  // --- i18n ---
  {
    moduleId: 'i18n',
    frameworks: ['nextjs'],
    prompts: [
      {
        id: 'defaultLocale',
        type: 'select',
        message: 'Langue par défaut',
        choices: [
          { name: 'Français', value: 'fr', description: 'Français comme langue par défaut' },
          { name: 'English', value: 'en', description: 'English as default language' },
        ],
        default: 'fr',
      },
    ],
  },

  // --- Email ---
  {
    moduleId: 'email',
    prompts: [
      {
        id: 'mailhog',
        type: 'confirm',
        message: 'Inclure MailHog pour le développement',
        default: true,
      },
    ],
  },

  // --- Zustand ---
  {
    moduleId: 'zustand',
    frameworks: ['nextjs'],
    prompts: [
      {
        id: 'withPersist',
        type: 'confirm',
        message: 'Persistance (localStorage)',
        default: false,
      },
      {
        id: 'withDevtools',
        type: 'confirm',
        message: 'Redux Devtools',
        default: true,
      },
    ],
  },
];

/**
 * Retourne les prompts d'un module pour un framework donné
 */
export function getModulePrompts(moduleId: string, frameworkId?: string): ModulePromptDef[] {
  const config = MODULE_PROMPTS.find((c) => {
    if (c.moduleId !== moduleId) return false;
    if (c.frameworks && frameworkId && !c.frameworks.includes(frameworkId)) return false;
    return true;
  });
  return config?.prompts ?? [];
}

/**
 * Retourne true si le module a des prompts configurables
 */
export function hasModulePrompts(moduleId: string, frameworkId?: string): boolean {
  return getModulePrompts(moduleId, frameworkId).length > 0;
}
