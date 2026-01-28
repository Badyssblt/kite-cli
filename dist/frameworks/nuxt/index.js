"use strict";
// Framework Nuxt
Object.defineProperty(exports, "__esModule", { value: true });
exports.nuxtFramework = exports.NuxtFramework = void 0;
const base_1 = require("../base");
// Import des modules
const prisma_1 = require("./modules/prisma");
const tailwind_1 = require("./modules/tailwind");
const shadcn_1 = require("./modules/shadcn");
const pinia_1 = require("./modules/pinia");
const nuxt_ui_1 = require("./modules/nuxt-ui");
const better_auth_1 = require("./modules/better-auth");
const supabase_1 = require("./modules/supabase");
const stripe_1 = require("./modules/stripe");
const i18n_1 = require("./modules/i18n");
const eslint_1 = require("./modules/eslint");
const vitest_1 = require("./modules/vitest");
const docker_1 = require("./modules/docker");
class NuxtFramework extends base_1.BaseFramework {
    constructor() {
        super(...arguments);
        this.id = 'nuxt';
        this.name = 'Nuxt';
        this.description = 'Un projet standard Nuxt dans sa dernière version';
        this.configFileName = 'nuxt.config.ts';
        this.configMergeStrategy = 'magicast';
        this.modules = [
            prisma_1.prismaModule,
            supabase_1.supabaseModule,
            better_auth_1.betterAuthModule,
            stripe_1.stripeModule,
            pinia_1.piniaModule,
            nuxt_ui_1.nuxtUiModule,
            shadcn_1.shadcnModule,
            tailwind_1.tailwindModule,
            i18n_1.i18nModule,
            eslint_1.eslintModule,
            vitest_1.vitestModule,
            docker_1.dockerModule
        ];
    }
    dockerfileTemplate(modules) {
        let extraDockerSetup = '';
        if (modules.includes(prisma_1.prismaModule.id)) {
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
exports.NuxtFramework = NuxtFramework;
exports.nuxtFramework = new NuxtFramework();
