"use strict";
// Framework Next.js
Object.defineProperty(exports, "__esModule", { value: true });
exports.nextJsFramework = exports.NextJsFramework = void 0;
const base_1 = require("../base");
// Import des modules
const prisma_1 = require("./modules/prisma");
const tailwind_1 = require("./modules/tailwind");
const shadcn_1 = require("./modules/shadcn");
const better_auth_1 = require("./modules/better-auth");
const stripe_1 = require("./modules/stripe");
const docker_1 = require("./modules/docker");
const eslint_1 = require("./modules/eslint");
class NextJsFramework extends base_1.BaseFramework {
    constructor() {
        super(...arguments);
        this.id = 'nextjs';
        this.name = 'Next.js';
        this.description = 'Un projet Next.js avec App Router';
        this.configFileName = 'next.config.ts';
        this.configMergeStrategy = 'magicast';
        this.modules = [
            prisma_1.prismaModule,
            better_auth_1.betterAuthModule,
            stripe_1.stripeModule,
            shadcn_1.shadcnModule,
            tailwind_1.tailwindModule,
            eslint_1.eslintModule,
            docker_1.dockerModule
        ];
    }
    dockerfileTemplate(modules) {
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
exports.NextJsFramework = NextJsFramework;
exports.nextJsFramework = new NextJsFramework();
