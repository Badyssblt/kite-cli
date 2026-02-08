// Framework Next.js

import { BaseFramework } from '../base';
import type { ModuleDefinition } from '../../types';

// Import des modules
import { prismaModule } from './modules/prisma';
import { tailwindModule } from './modules/tailwind';
import { shadcnModule } from './modules/shadcn';
import { betterAuthModule } from './modules/better-auth';
import { stripeModule } from './modules/stripe';
import { dockerModule } from './modules/docker';
import { eslintModule } from './modules/eslint';
import { supabaseModule } from './modules/supabase';
import { i18nModule } from './modules/i18n';
import { vitestModule } from './modules/vitest';
import { zustandModule } from './modules/zustand';

export class NextJsFramework extends BaseFramework {
  id = 'nextjs';
  name = 'Next.js';
  description = 'Un projet Next.js avec App Router';
  configFileName = 'next.config.ts';
  configMergeStrategy: 'magicast' = 'magicast';

  modules: ModuleDefinition[] = [
    prismaModule,
    supabaseModule,
    betterAuthModule,
    stripeModule,
    shadcnModule,
    tailwindModule,
    zustandModule,
    i18nModule,
    eslintModule,
    vitestModule,
    dockerModule
  ];

  dockerfileTemplate(modules: string[]): string {
    let extraDockerSetup = '';
    if (modules.includes('prisma')) {
      extraDockerSetup = `
COPY prisma ./prisma
RUN npx prisma generate
      `;
    }

    let dockerfile = `FROM node:20

WORKDIR /app

# Installation des dépendances uniquement (le code est monté en volume)
COPY package*.json ./
RUN npm install

${extraDockerSetup}

EXPOSE 3000

CMD ["npm", "run", "dev"]
`;
    return dockerfile;
  }
}

export const nextJsFramework = new NextJsFramework();
