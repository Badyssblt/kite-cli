import {Command} from "commander"
import path from "path";
import ora from "ora";
import { copyTemplate } from "../utils/copy";
import { select } from '@inquirer/prompts';
import { input } from '@inquirer/prompts';
import { select as multipleSelect } from 'inquirer-select-pro';

export const createCommand = new Command('create')
    .description('Create a new project')
    .action(async (name) => {
        const projectName = await input({
            message: "Nom du projet:",
            default: "mon-projet"
        })

        const stack = await select({
            message: "Choisissez une stack:",
            choices: [
                {
                    name: 'Nuxt',
                    value: 'nuxt',
                    description: 'Un projet standard Nuxt dans sa dernière version',
                },
                {
                    name: 'Next',
                    value: 'Next',
                    description: 'Un projet standard Next.js dans sa dernière version',
                },
                        ],
        });

        
        const modules = await multipleSelect({
        message: 'Choisissez les modules à installer:',
        multiple: true,
        options: [
            { name: 'Prisma (Base de données ORM)', value: 'prisma' },
            { name: 'Supabase (Backend as a Service)', value: 'supabase' },
            { name: 'NuxtAuth (Authentification Sidebase)', value: 'nuxt-auth' },
            { name: 'Pinia (Gestion d\'état)', value: 'pinia' },
            { name: 'NuxtUI (UI avec Tailwind)', value: 'nuxt-ui' },
            { name: 'Tailwind CSS (Styling)', value: 'tailwind' },
            { name: 'i18n (Internationalisation)', value: 'i18n' },
            { name: 'ESLint + Prettier (Linting)', value: 'eslint' },
            { name: 'Vitest (Tests unitaires)', value: 'vitest' },
            { name: 'Docker (Containerisation)', value: 'docker' },
        ],
        });


        const projectPath = path.join(process.cwd(), projectName);

        const spinner = ora("Création du projet...").start();

        await copyTemplate(stack, projectPath, modules);

        spinner.succeed("Projet créé avec succès !");
    
    });