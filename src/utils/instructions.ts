// Instructions post-installation pour chaque module

export interface ModuleInstructions {
  title: string;
  steps: string[];
  links?: string[];
}

export const moduleInstructions: Record<string, ModuleInstructions> = {
  prisma: {
    title: "Prisma (Base de données)",
    steps: [
      "Configurer DATABASE_URL dans .env",
      "Exécuter: npx prisma migrate dev --name init",
      "Optionnel: npx prisma studio (interface graphique DB)"
    ],
    links: ["https://www.prisma.io/docs"]
  },

  supabase: {
    title: "Supabase",
    steps: [
      "Créer un projet sur https://supabase.com",
      "Configurer SUPABASE_URL et SUPABASE_KEY dans .env",
      "Les clés sont disponibles dans Settings > API"
    ],
    links: ["https://supabase.com/docs"]
  },

  "nuxt-auth": {
    title: "NuxtAuth (Authentification)",
    steps: [
      "Générer un secret: openssl rand -base64 32",
      "Configurer AUTH_SECRET dans .env",
      "Pour GitHub OAuth: créer une app sur https://github.com/settings/developers",
      "Configurer GITHUB_CLIENT_ID et GITHUB_CLIENT_SECRET"
    ],
    links: ["https://sidebase.io/nuxt-auth/getting-started"]
  },

  pinia: {
    title: "Pinia (Gestion d'état)",
    steps: [
      "Les stores sont dans /stores",
      "Utiliser: const store = useCounterStore()",
      "Documentation complète disponible"
    ],
    links: ["https://pinia.vuejs.org"]
  },

  "nuxt-ui": {
    title: "NuxtUI",
    steps: [
      "Les composants sont disponibles directement: <UButton>, <UCard>, etc.",
      "Personnaliser les couleurs dans nuxt.config.ts > colorMode"
    ],
    links: ["https://ui.nuxt.com"]
  },

  tailwind: {
    title: "Tailwind CSS",
    steps: [
      "Le fichier CSS principal est dans ./app/assets/css/main.css",
      "Personnaliser tailwind.config.js pour vos besoins"
    ],
    links: ["https://tailwindcss.com/docs"]
  },

  i18n: {
    title: "i18n (Internationalisation)",
    steps: [
      "Les traductions sont dans /locales",
      "Ajouter de nouvelles langues dans nuxt.config.ts > i18n.locales",
      "Utiliser: {{ $t('welcome') }} dans les templates"
    ],
    links: ["https://i18n.nuxtjs.org"]
  },

  eslint: {
    title: "ESLint + Prettier",
    steps: [
      "Exécuter: npm run lint (pour vérifier)",
      "Exécuter: npm run lint:fix (pour corriger automatiquement)",
      "Configurer votre IDE pour utiliser ESLint et Prettier"
    ],
    links: ["https://eslint.nuxt.com"]
  },

  vitest: {
    title: "Vitest (Tests)",
    steps: [
      "Créer vos tests dans /tests",
      "Exécuter: npm test",
      "Avec UI: npm run test:ui",
      "Coverage: npm run test:coverage"
    ],
    links: ["https://vitest.dev"]
  },

  docker: {
    title: "Docker",
    steps: [
      "Le docker-compose.yml a été généré selon vos modules",
      "Démarrer tous les services: docker-compose up -d",
      "Voir les logs: docker-compose logs -f",
      "Arrêter: docker-compose down",
      "Note: Si vous avez Prisma, la DB PostgreSQL est incluse"
    ],
    links: ["https://docs.docker.com"]
  },

  shadcn: {
    title: "Shadcn Vue",
    steps: [
      "Shadcn a été initialisé avec 'npx shadcn-vue@latest init'",
      "Les composants sont dans /components/ui",
      "Ajouter des composants: npx shadcn-vue@latest add button",
      "Voir tous les composants disponibles: https://www.shadcn-vue.com"
    ],
    links: ["https://www.shadcn-vue.com"]
  }
};

export function generateInstructions(modules: string[]): string {
  if (modules.length === 0) return "";

  let instructions = "📋 PROCHAINES ÉTAPES\n\n";
  instructions += "1. Installer les dépendances :\n";
  instructions += "   cd votre-projet && npm install\n\n";

  const hasEnvVars = modules.some(m =>
    ['prisma', 'supabase', 'nuxt-auth'].includes(m)
  );

  if (hasEnvVars) {
    instructions += "2. Configurer les variables d'environnement :\n";
    instructions += "   cp .env.example .env\n";
    instructions += "   Puis éditer .env avec vos valeurs\n\n";
  }

  instructions += hasEnvVars ? "3. " : "2. ";
  instructions += "Démarrer le serveur de développement :\n";
  instructions += "   npm run dev\n\n";

  // Instructions spécifiques par module
  const relevantModules = modules.filter(m => moduleInstructions[m]);

  if (relevantModules.length > 0) {
    instructions += "🔧 CONFIGURATION DES MODULES\n\n";

    for (const moduleName of relevantModules) {
      const moduleInfo = moduleInstructions[moduleName];
      instructions += `▸ ${moduleInfo.title}\n`;

      for (const step of moduleInfo.steps) {
        instructions += `  • ${step}\n`;
      }

      if (moduleInfo.links && moduleInfo.links.length > 0) {
        instructions += `  📚 ${moduleInfo.links.join(', ')}\n`;
      }

      instructions += "\n";
    }
  }

  return instructions;
}

export function generateSetupMd(projectName: string, modules: string[]): string {
  let content = `# ${projectName}\n\n`;
  content += `Projet Nuxt généré avec les modules suivants : ${modules.join(', ')}\n\n`;

  content += `## Installation\n\n`;
  content += "```bash\n";
  content += "npm install\n";
  content += "```\n\n";

  const hasEnvVars = modules.some(m =>
    ['prisma', 'supabase', 'nuxt-auth'].includes(m)
  );

  if (hasEnvVars) {
    content += `## Configuration\n\n`;
    content += "Copier le fichier d'exemple et configurer les variables d'environnement :\n\n";
    content += "```bash\n";
    content += "cp .env.example .env\n";
    content += "```\n\n";
    content += "Puis éditer `.env` avec vos valeurs.\n\n";
  }

  // Instructions détaillées par module
  const relevantModules = modules.filter(m => moduleInstructions[m]);

  if (relevantModules.length > 0) {
    content += `## Configuration des modules\n\n`;

    for (const moduleName of relevantModules) {
      const moduleInfo = moduleInstructions[moduleName];
      content += `### ${moduleInfo.title}\n\n`;

      for (const step of moduleInfo.steps) {
        content += `- ${step}\n`;
      }

      if (moduleInfo.links && moduleInfo.links.length > 0) {
        content += `\n**Documentation :** ${moduleInfo.links.join(', ')}\n`;
      }

      content += "\n";
    }
  }

  content += `## Développement\n\n`;
  content += "```bash\n";
  content += "npm run dev\n";
  content += "```\n\n";

  content += `## Build pour production\n\n`;
  content += "```bash\n";
  content += "npm run build\n";
  content += "npm run preview\n";
  content += "```\n\n";

  return content;
}
