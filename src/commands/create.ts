import {Command} from "commander"
import path from "path";
import ora from "ora";
import fs from "fs-extra";
import { execSync } from "child_process";
import { copyTemplate } from "../utils/copy";
import { generateSetupMd } from "../utils/instructions";
import { resolveDependencies, getAddedDependencies, getDependencyMessage, sortByDependencies } from "../utils/dependencies";
import { select } from '@inquirer/prompts';
import { input, confirm } from '@inquirer/prompts';
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

        
        const selectedModules = await multipleSelect({
        message: 'Choisissez les modules à installer:',
        multiple: true,
        options: [
            { name: 'Prisma (Base de données ORM)', value: 'prisma' },
            { name: 'Supabase (Backend as a Service)', value: 'supabase' },
            { name: 'NuxtAuth (Authentification Sidebase)', value: 'nuxt-auth' },
            { name: 'Pinia (Gestion d\'état)', value: 'pinia' },
            { name: 'NuxtUI (UI avec Tailwind)', value: 'nuxt-ui' },
            { name: 'Shadcn Vue (Composants UI)', value: 'shadcn' },
            { name: 'Tailwind CSS (Styling)', value: 'tailwind' },
            { name: 'i18n (Internationalisation)', value: 'i18n' },
            { name: 'ESLint + Prettier (Linting)', value: 'eslint' },
            { name: 'Vitest (Tests unitaires)', value: 'vitest' },
            { name: 'Docker (Containerisation)', value: 'docker' },
        ],
        });

        // Résoudre les dépendances
        const modules = resolveDependencies(selectedModules);
        const addedModules = getAddedDependencies(selectedModules, modules);

        // Informer l'utilisateur des modules ajoutés automatiquement
        if (addedModules.length > 0) {
            console.log("");
            console.log("📦 Modules ajoutés automatiquement :");
            console.log(getDependencyMessage(addedModules));
            console.log("");
        }

        const projectPath = path.join(process.cwd(), projectName);

        const spinner = ora("Création du projet...").start();

        const {setupScripts} = await copyTemplate(stack, projectPath, modules);

        // Copier .env.example vers .env si .env.example existe
        const envExamplePath = path.join(projectPath, ".env.example");
        const envPath = path.join(projectPath, ".env");
        if (await fs.pathExists(envExamplePath)) {
          await fs.copy(envExamplePath, envPath);
        }

        spinner.succeed("Projet créé");

        // Demander si l'utilisateur veut installer les dépendances
        const shouldInstall = await confirm({
          message: "Installer les dépendances ?",
          default: true
        });

        if (shouldInstall) {
          const installSpinner = ora("Installation...").start();
          try {
            execSync("npm install", {
              cwd: projectPath,
              stdio: "pipe" // Masquer la sortie npm
            });
            installSpinner.succeed("Dépendances installées");
          } catch (error) {
            installSpinner.fail("Erreur installation");
            console.error(error);
          }
        }

        // Exécuter automatiquement les scripts setup.sh des modules (dans l'ordre des dépendances)
        if (setupScripts.length > 0) {
          // Trier les scripts selon l'ordre des dépendances
          const moduleNames = setupScripts.map(s => s.name);
          const sortedNames = sortByDependencies(moduleNames);
          const sortedScripts = sortedNames
            .map(name => setupScripts.find(s => s.name === name))
            .filter(s => s !== undefined) as Array<{ name: string; path: string }>;

          const setupSpinner = ora("Configuration des modules...").start();
          const failedModules: string[] = [];

          for (const script of sortedScripts) {
            setupSpinner.text = `Configuration: ${script.name}`;
            try {
              execSync(`bash "${script.path}"`, {
                cwd: projectPath,
                stdio: "pipe" // Masquer la sortie sauf si erreur
              });
            } catch (error) {
              failedModules.push(script.name);
              setupSpinner.warn(`Erreur: ${script.name}`);
            }
          }

          if (failedModules.length === 0) {
            setupSpinner.succeed("Modules configurés");
          } else {
            setupSpinner.fail(`Erreur modules: ${failedModules.join(', ')}`);
          }
        }

        // Afficher les prochaines étapes
        console.log("");
        console.log("✨ Projet prêt !");
        console.log("");
        console.log("  cd " + projectName);
        console.log("  npm run dev");
        console.log("");

    });