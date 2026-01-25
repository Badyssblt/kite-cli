// Framework Nuxt

import { BaseFramework } from '../base';
import type { ModuleDefinition } from '../../types';

// Import des modules
import { prismaModule } from './modules/prisma';
import { tailwindModule } from './modules/tailwind';
import { shadcnModule } from './modules/shadcn';
import { piniaModule } from './modules/pinia';
import { nuxtUiModule } from './modules/nuxt-ui';
import { betterAuthModule } from './modules/better-auth';
import { supabaseModule } from './modules/supabase';
import { i18nModule } from './modules/i18n';
import { eslintModule } from './modules/eslint';
import { vitestModule } from './modules/vitest';
import { dockerModule } from './modules/docker';
import { debug } from '../../utils/debug';

export class NuxtFramework extends BaseFramework {
  id = 'nuxt';
  name = 'Nuxt';
  description = 'Un projet standard Nuxt dans sa dernière version';
  configFileName = 'nuxt.config.ts';
  configMergeStrategy: 'magicast' = 'magicast';

  modules: ModuleDefinition[] = [
    prismaModule,
    supabaseModule,
    betterAuthModule,
    piniaModule,
    nuxtUiModule,
    shadcnModule,
    tailwindModule,
    i18nModule,
    eslintModule,
    vitestModule,
    dockerModule
  ];

  dockerfileTemplate(modules: string[]): string {
    let extraDockerSetup = '';
    if (modules.includes(prismaModule.id)) {
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

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["npm", "run", "dev"]
`;
    return dockerfile;
  }
}

export const nuxtFramework = new NuxtFramework();
