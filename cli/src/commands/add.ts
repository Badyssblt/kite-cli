import { Command } from 'commander';
import ora from 'ora';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { dependencyService } from '../services/dependency.service';
import { promptService } from '../services/prompt.service';
import { detectService } from '../services/detect.service';
import { installService } from '../services/install.service';
import { manifestService } from '../services/manifest.service';
import { debug } from '../utils/debug';

export const addCommand = new Command('add')
  .description('Add a module to an existing project')
  .argument('[module]', 'Module to add (optional)')
  .option('--dry-run', 'Preview what would be added without making changes')
  .option('--json', 'Output as JSON')
  .action(async (moduleName?: string, options?: { dryRun?: boolean; json?: boolean }) => {
    const projectPath = process.cwd();
    const opts = options || {};

    // Détecter le framework du projet
    const spinner = opts.json ? null : ora('Detecting project framework...').start();
    const detection = detectService.detectFramework(projectPath);

    if (!detection) {
      spinner?.fail('Could not detect project framework');
      if (!opts.json) {
        console.log('');
        console.log('Make sure you are in a Nuxt or Next.js project directory.');
        console.log('Looking for: nuxt.config.ts, next.config.ts, or next.config.js');
      } else {
        console.log(JSON.stringify({ success: false, error: 'No framework detected' }));
      }
      return;
    }

    spinner?.succeed(`Detected ${detection.framework.name} project`);

    const framework = detection.framework;
    const frameworkId = framework.id;

    // Detect package manager
    const pm = manifestService.exists(projectPath)
      ? manifestService.getPackageManager(projectPath)
      : manifestService.detectPackageManager(projectPath);

    debug('Package manager:', pm);

    // Détecter les modules déjà installés
    const manifest = manifestService.read(projectPath);
    const installedModules = manifest
      ? manifest.modules.map(m => m.id)
      : detectService.detectInstalledModules(projectPath, frameworkId);

    if (installedModules.length > 0 && !opts.json) {
      console.log('');
      console.log('📦 Installed modules:', installedModules.join(', '));
    }

    // Obtenir les modules disponibles (non installés)
    const availableModules = framework.modules.filter(m => !installedModules.includes(m.id));

    if (availableModules.length === 0) {
      if (opts.json) {
        console.log(JSON.stringify({ success: true, message: 'All modules already installed' }));
      } else {
        console.log('');
        console.log('✨ All modules are already installed!');
      }
      return;
    }

    let selectedModules: string[] = [];

    if (moduleName) {
      // Vérifier si le module existe
      const moduleExists = framework.modules.some(m => m.id === moduleName);
      if (!moduleExists) {
        if (opts.json) {
          console.log(JSON.stringify({ success: false, error: `Module "${moduleName}" not found` }));
        } else {
          console.error(`Module "${moduleName}" not found for ${framework.name}`);
          console.log('');
          console.log('Available modules:');
          availableModules.forEach(m => console.log(`  - ${m.id}: ${m.name}`));
        }
        return;
      }

      // Vérifier si le module est déjà installé
      if (installedModules.includes(moduleName)) {
        if (opts.json) {
          console.log(JSON.stringify({ success: false, error: `Module "${moduleName}" already installed` }));
        } else {
          console.log(`Module "${moduleName}" is already installed.`);
        }
        return;
      }

      selectedModules = [moduleName];
    } else {
      // Demander à l'utilisateur de choisir les modules
      const choices = availableModules.map(m => ({
        name: m.name,
        value: m.id
      }));

      selectedModules = await promptService.askModulesToAdd(choices);

      if (selectedModules.length === 0) {
        console.log('No modules selected.');
        return;
      }
    }

    // Résoudre les dépendances
    const modules = dependencyService.resolveDependencies(frameworkId, selectedModules);
    const addedModules = dependencyService.getAddedDependencies(selectedModules, modules);

    // Filtrer les modules déjà installés des dépendances
    const modulesToInstall = modules.filter(m => !installedModules.includes(m));

    if (modulesToInstall.length === 0) {
      if (opts.json) {
        console.log(JSON.stringify({ success: true, message: 'All selected modules already installed' }));
      } else {
        console.log('All selected modules are already installed.');
      }
      return;
    }

    // Informer l'utilisateur des modules ajoutés automatiquement
    if (addedModules.length > 0 && !opts.json) {
      const newDeps = addedModules.filter(m => !installedModules.includes(m));
      if (newDeps.length > 0) {
        console.log('');
        console.log('📦 Dependencies added automatically:');
        console.log(dependencyService.getDependencyMessage(frameworkId, newDeps));
      }
    }

    // Dry run mode
    if (opts.dryRun) {
      if (opts.json) {
        console.log(JSON.stringify({
          success: true,
          dryRun: true,
          modules: modulesToInstall,
          autoAdded: addedModules.filter(m => !installedModules.includes(m)),
        }));
      } else {
        console.log('\n  Dry run — the following modules would be added:\n');
        for (const moduleId of modulesToInstall) {
          const mod = moduleRegistry.get(frameworkId, moduleId);
          const isAuto = addedModules.includes(moduleId);
          console.log(`  + ${mod?.name || moduleId}${isAuto ? ' (auto-dependency)' : ''}`);
        }
        console.log('');
      }
      return;
    }

    console.log('');

    // Installer chaque module via son script install.sh
    for (const moduleId of modulesToInstall) {
      const moduleDef = moduleRegistry.get(frameworkId, moduleId);
      const modName = moduleDef?.name || moduleId;

      if (!opts.json) console.log(`\n📦 Installing ${modName}...\n`);

      if (installService.hasInstallScript(frameworkId, moduleId)) {
        const result = installService.executeInstallScript(frameworkId, moduleId, projectPath, pm);

        if (!result.success) {
          if (opts.json) {
            console.log(JSON.stringify({ success: false, error: `Failed to install ${modName}` }));
          } else {
            console.error(`❌ Failed to install ${modName}: ${result.error}`);
          }
        }
      } else {
        if (!opts.json) console.log(`⚠️  No install script for ${modName}, skipping...`);
      }
    }

    // Update manifest
    manifestService.addModules(projectPath, modulesToInstall);
    debug('Manifest updated with modules:', modulesToInstall);

    if (opts.json) {
      console.log(JSON.stringify({ success: true, installed: modulesToInstall }));
      return;
    }

    // Afficher les instructions des modules
    const modulesWithInstructions = modulesToInstall
      .map(id => moduleRegistry.get(frameworkId, id))
      .filter(m => m?.instructions);

    if (modulesWithInstructions.length > 0) {
      console.log('');
      console.log('📋 Next steps:');
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

    console.log('✨ Done!');
    console.log('');
  });
