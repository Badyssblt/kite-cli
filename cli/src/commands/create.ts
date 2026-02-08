import { Command } from 'commander';
import path from 'path';
import os from 'os';
import ora from 'ora';
import fs from 'fs-extra';
import archiver from 'archiver';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { dependencyService } from '../services/dependency.service';
import { templateService } from '../services/template.service';
import { setupService } from '../services/setup.service';
import { installService } from '../services/install.service';
import { promptService } from '../services/prompt.service';
import { manifestService, type PackageManager } from '../services/manifest.service';
import { presets } from '../presets';
import { debug } from '../utils/debug';
import type { ModuleAnswers } from '../types';

interface CreateOptions {
  name?: string;
  framework?: string;
  modules?: string;
  install?: boolean;
  json?: boolean;
  zip?: boolean;
  output?: string;
  dryRun?: boolean;
  pm?: string;
  preset?: string;
}

async function createZipFromDirectory(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => resolve());
    archive.on('error', (err) => reject(err));

    archive.pipe(output);
    archive.directory(sourceDir, path.basename(sourceDir));
    archive.finalize();
  });
}

export const createCommand = new Command('create')
  .description('Create a new project')
  .option('-n, --name <name>', 'Project name')
  .option('-f, --framework <framework>', 'Framework ID (nuxt, nextjs)')
  .option('-m, --modules <modules>', 'Comma-separated list of module IDs')
  .option('--no-install', 'Skip dependency installation')
  .option('--json', 'Output result as JSON')
  .option('--zip', 'Output project as a zip file')
  .option('-o, --output <path>', 'Output directory for the zip file')
  .option('--dry-run', 'Preview what would be created without making changes')
  .option('--pm <manager>', 'Package manager to use (npm, pnpm, yarn, bun)')
  .option('--preset <preset>', 'Use a preset configuration')
  .action(async (options: CreateOptions) => {
    const isNonInteractive = options.name && options.framework;

    // Demander le nom du projet ou utiliser l'option
    const projectName = options.name || await promptService.askProjectName();

    // Preset : résoudre en premier car il fournit framework + modules
    let activePreset = options.preset ? presets[options.preset] ?? null : null;

    if (options.preset && !activePreset) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: `Preset "${options.preset}" not found` }));
      } else {
        console.error(`Preset "${options.preset}" non trouvé`);
        console.log('Presets disponibles:', Object.keys(presets).join(', '));
      }
      return;
    }


    // Framework : --framework flag > prompt interactif
    // Le preset ne force pas le framework, il filtre juste sa compatibilité
    const frameworkId = options.framework || await promptService.askFramework();
    const framework = frameworkRegistry.get(frameworkId);

    if (!framework) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: `Framework "${frameworkId}" not found` }));
        return;
      }
      console.error(`Framework "${frameworkId}" non trouvé`);
      return;
    }

    // Si pas encore de preset, proposer le choix interactif (après le framework)
    if (!activePreset && !isNonInteractive && !options.modules) {
      const chosenPresetId = await promptService.askPreset(frameworkId);
      if (chosenPresetId) {
        activePreset = presets[chosenPresetId];
        if (!options.json) {
          console.log(`\n📋 Preset "${activePreset.name}" sélectionné`);
        }
      }
    }

    // Modules : preset > --modules flag > prompt interactif
    // Si preset, on filtre les modules qui existent pour ce framework
    const frameworkModuleIds = framework.modules.map(m => m.id);
    let selectedModules: string[];
    if (activePreset) {
      selectedModules = activePreset.modules.filter(m => frameworkModuleIds.includes(m));
    } else if (options.modules !== undefined) {
      selectedModules = options.modules.split(',').map(m => m.trim()).filter(m => m && m !== 'none');
    } else {
      selectedModules = await promptService.askModules(frameworkId);
    }

    // Résoudre les dépendances
    const modules = dependencyService.resolveDependencies(frameworkId, selectedModules);
    const addedModules = dependencyService.getAddedDependencies(selectedModules, modules);

    // Informer l'utilisateur des modules ajoutés automatiquement
    if (addedModules.length > 0 && !options.json) {
      console.log('');
      console.log('📦 Modules ajoutés automatiquement :');
      console.log(dependencyService.getDependencyMessage(frameworkId, addedModules));
    }

    // Detect or select package manager
    const packageManager: PackageManager = (options.pm as PackageManager) || 'npm';

    // Poser les questions spécifiques à chaque module
    // Avec un preset : on utilise les réponses du preset + defaults, on ne pose que si ni l'un ni l'autre
    let moduleAnswers: ModuleAnswers;
    if (isNonInteractive) {
      moduleAnswers = activePreset?.answers || {};
    } else {
      moduleAnswers = await promptService.askModuleQuestions(
        frameworkId,
        modules,
        [],
        activePreset?.answers
      );
    }

    // Dry run mode
    if (options.dryRun) {
      console.log('\n  Dry run — the following would be created:\n');
      console.log(`  Project:    ${projectName}`);
      console.log(`  Framework:  ${framework.name}`);
      console.log(`  Package manager: ${packageManager}`);
      console.log(`  Modules:    ${modules.length > 0 ? modules.join(', ') : 'none'}`);
      if (addedModules.length > 0) {
        console.log(`  Auto-added: ${addedModules.join(', ')}`);
      }
      console.log('');
      return;
    }

    // Si --zip, créer dans un dossier temporaire
    const baseDir = options.zip ? os.tmpdir() : process.cwd();
    const projectPath = path.join(baseDir, projectName);

    if (!options.json) {
      console.log('');
    }
    const spinner = options.json ? null : ora('Création du projet...').start();

    try {
      // Copier le template avec les configurations des modules
      const { setupScripts } = await templateService.copyTemplate(
        framework,
        projectPath,
        modules,
        moduleAnswers
      );

      // Copier .env.example vers .env
      await templateService.copyEnvFile(projectPath);

      // Create manifest
      debug('Writing manifest...');
      manifestService.create(projectPath, frameworkId, modules, moduleAnswers, packageManager);

      spinner?.succeed('Projet créé');

      // Déterminer si on installe les dépendances
      const shouldInstall = isNonInteractive
        ? options.install !== false
        : await promptService.askInstallDependencies();

      const installCmd = manifestService.getInstallCommand(packageManager);
      const installCmdIgnoreScripts = packageManager === 'npm'
        ? 'npm install --ignore-scripts'
        : installCmd; // pnpm/yarn/bun don't need ignore-scripts for initial

      if (shouldInstall) {
        // Installer les dépendances de base SANS exécuter les scripts (nuxt prepare)
        const installSpinner = options.json ? null : ora('Installation des dépendances de base...').start();
        try {
          setupService.installDependencies(projectPath, true, packageManager);
          installSpinner?.succeed('Dépendances de base installées');
        } catch (error) {
          installSpinner?.fail('Erreur installation');
          if (!options.json) console.error(error);
        }

        // Exécuter les scripts install.sh des modules
        if (modules.length > 0) {
          if (!options.json) {
            console.log('');
            console.log('📦 Installation des modules...');
          }

          const sortedModules = dependencyService.sortByDependencies(frameworkId, modules);
          for (const moduleId of sortedModules) {
            const moduleDef = moduleRegistry.get(frameworkId, moduleId);
            const moduleName = moduleDef?.name || moduleId;

            if (installService.hasInstallScript(framework.id, moduleId)) {
              if (!options.json) console.log(`\n▸ ${moduleName}`);
              const result = installService.executeInstallScript(framework.id, moduleId, projectPath, packageManager);

              if (!result.success) {
                if (!options.json) console.error(`  ❌ Erreur: ${result.error}`);
              } else {
                if (!options.json) console.log(`  ✓ Installé`);
              }
            }
          }
        }

        // Exécuter nuxt prepare (postinstall)
        const prepareSpinner = options.json ? null : ora('Préparation du projet...').start();
        try {
          setupService.runPrepare(projectPath, packageManager);
          prepareSpinner?.succeed('Projet préparé');
        } catch (error) {
          prepareSpinner?.fail('Erreur préparation');
        }
      }

      // Exécuter les scripts setup.sh des modules
      if (setupScripts.length > 0) {
        const setupSpinner = options.json ? null : ora('Configuration des modules...').start();

        const failedModules = setupService.executeSetupScripts(
          frameworkId,
          setupScripts,
          projectPath,
          (moduleName) => {
            if (setupSpinner) setupSpinner.text = `Configuration: ${moduleName}`;
          },
          (moduleName) => {
            setupSpinner?.warn(`Erreur: ${moduleName}`);
          }
        );

        if (failedModules.length === 0) {
          setupSpinner?.succeed('Modules configurés');
        } else {
          setupSpinner?.fail(`Erreur modules: ${failedModules.join(', ')}`);
        }
      }

      // Mode JSON : retourner le résultat
      if (options.json) {
        let zipPath: string | undefined;

        // Si --zip, créer le fichier zip
        if (options.zip) {
          const outputDir = options.output || os.tmpdir();
          zipPath = path.join(outputDir, `${projectName}.zip`);
          await createZipFromDirectory(projectPath, zipPath);

          // Supprimer le dossier temporaire
          await fs.remove(projectPath);
        }

        console.log(JSON.stringify({
          success: true,
          projectName,
          projectPath: options.zip ? zipPath : projectPath,
          zipPath,
          framework: frameworkId,
          modules,
          addedModules,
          packageManager
        }));
        return;
      }

      // Afficher les instructions des modules
      const modulesWithInstructions = modules
        .map(id => moduleRegistry.get(frameworkId, id))
        .filter(m => m?.instructions);

      if (modulesWithInstructions.length > 0) {
        console.log('');
        console.log('📋 Configuration des modules :');
        console.log('');
        for (const module of modulesWithInstructions) {
          if (module?.instructions) {
            console.log(`  ▸ ${module.instructions.title}`);
            for (const step of module.instructions.steps) {
              console.log(`    ${step}`);
            }
            if (module.instructions.links?.length) {
              console.log(`    📚 ${module.instructions.links[0]}`);
            }
            console.log('');
          }
        }
      }

      // Afficher les prochaines étapes
      const runCmd = manifestService.getRunCommand(packageManager);
      console.log('✨ Projet prêt !');
      console.log('');
      console.log('  cd ' + projectName);
      console.log(`  ${runCmd} dev`);
      console.log('');
    } catch (error) {
      spinner?.fail('Erreur lors de la création du projet');
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: (error as Error).message }));
      } else {
        console.error(error);
      }
    }
  });
