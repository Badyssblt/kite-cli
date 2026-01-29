import { Command } from 'commander';
import ora from 'ora';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { dependencyService } from '../services/dependency.service';
import { promptService } from '../services/prompt.service';
import { detectService } from '../services/detect.service';
import { installService } from '../services/install.service';

export const addCommand = new Command('add')
  .description('Add a module to an existing project')
  .argument('[module]', 'Module to add (optional)')
  .action(async (moduleName?: string) => {
    const projectPath = process.cwd();

    // Détecter le framework du projet
    const spinner = ora('Detecting project framework...').start();
    const detection = detectService.detectFramework(projectPath);

    if (!detection) {
      spinner.fail('Could not detect project framework');
      console.log('');
      console.log('Make sure you are in a Nuxt or Next.js project directory.');
      console.log('Looking for: nuxt.config.ts, next.config.ts, or next.config.js');
      return;
    }

    spinner.succeed(`Detected ${detection.framework.name} project`);

    const framework = detection.framework;
    const frameworkId = framework.id;

    // Détecter les modules déjà installés
    const installedModules = detectService.detectInstalledModules(projectPath, frameworkId);

    if (installedModules.length > 0) {
      console.log('');
      console.log('📦 Installed modules:', installedModules.join(', '));
    }

    // Obtenir les modules disponibles (non installés)
    const availableModules = framework.modules.filter(m => !installedModules.includes(m.id));

    if (availableModules.length === 0) {
      console.log('');
      console.log('✨ All modules are already installed!');
      return;
    }

    let selectedModules: string[] = [];

    if (moduleName) {
      // Vérifier si le module existe
      const moduleExists = framework.modules.some(m => m.id === moduleName);
      if (!moduleExists) {
        console.error(`Module "${moduleName}" not found for ${framework.name}`);
        console.log('');
        console.log('Available modules:');
        availableModules.forEach(m => console.log(`  - ${m.id}: ${m.name}`));
        return;
      }

      // Vérifier si le module est déjà installé
      if (installedModules.includes(moduleName)) {
        console.log(`Module "${moduleName}" is already installed.`);
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
      console.log('All selected modules are already installed.');
      return;
    }

    // Informer l'utilisateur des modules ajoutés automatiquement
    if (addedModules.length > 0) {
      const newDeps = addedModules.filter(m => !installedModules.includes(m));
      if (newDeps.length > 0) {
        console.log('');
        console.log('📦 Dependencies added automatically:');
        console.log(dependencyService.getDependencyMessage(frameworkId, newDeps));
      }
    }

    console.log('');

    // Installer chaque module via son script install.sh
    for (const moduleId of modulesToInstall) {
      const moduleDef = moduleRegistry.get(frameworkId, moduleId);
      const modName = moduleDef?.name || moduleId;

      console.log(`\n📦 Installing ${modName}...\n`);

      if (installService.hasInstallScript(frameworkId, moduleId)) {
        const result = installService.executeInstallScript(frameworkId, moduleId, projectPath);

        if (!result.success) {
          console.error(`❌ Failed to install ${modName}: ${result.error}`);
        }
      } else {
        console.log(`⚠️  No install script for ${modName}, skipping...`);
      }
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
