// Framework Nuxt

import { BaseFramework } from '../base';
import type { ModuleDefinition } from '../../types';

// Import des modules
import { prismaModule } from './modules/prisma';
import { tailwindModule } from './modules/tailwind';
import { shadcnModule } from './modules/shadcn';
import { piniaModule } from './modules/pinia';
import { nuxtUiModule } from './modules/nuxt-ui';
import { nuxtAuthModule } from './modules/nuxt-auth';
import { supabaseModule } from './modules/supabase';
import { i18nModule } from './modules/i18n';
import { eslintModule } from './modules/eslint';
import { vitestModule } from './modules/vitest';
import { dockerModule } from './modules/docker';

export class NuxtFramework extends BaseFramework {
  id = 'nuxt';
  name = 'Nuxt';
  description = 'Un projet standard Nuxt dans sa dernière version';
  configFileName = 'nuxt.config.ts';
  configMergeStrategy: 'magicast' = 'magicast';

  modules: ModuleDefinition[] = [
    prismaModule,
    supabaseModule,
    nuxtAuthModule,
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
    let dockerfile = `FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .
`;

    // Si Prisma est présent, générer le client
    if (modules.includes('prisma')) {
      dockerfile += `
# Generate Prisma Client
RUN npx prisma generate
`;
    }

    dockerfile += `
RUN npm run build

EXPOSE 3000

ENV NUXT_HOST=0.0.0.0
ENV NUXT_PORT=3000

CMD ["node", ".output/server/index.mjs"]
`;

    return dockerfile;
  }
}

export const nuxtFramework = new NuxtFramework();
