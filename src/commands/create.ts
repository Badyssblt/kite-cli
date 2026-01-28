import { Command } from 'commander';
import path from 'path';
import ora from 'ora';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { dependencyService } from '../services/dependency.service';
import { templateService } from '../services/template.service';
import { setupService } from '../services/setup.service';
import { installService } from '../services/install.service';
import { promptService } from '../services/prompt.service';
import type { ModuleAnswers } from '../types';

export const createCommand = new Command('create')
  .description('Create a new project')
  .action(async () => {
    // Demander le nom du projet
    const projectName = await promptService.askProjectName();

    // Demander le framework
    const frameworkId = await promptService.askFramework();
    const framework = frameworkRegistry.get(frameworkId);

    if (!framework) {
      console.error(`Framework "${frameworkId}" non trouvé`);
      return;
    }

    // Demander les modules à installer
    const selectedModules = await promptService.askModules(frameworkId);

    // Résoudre les dépendances
    const modules = dependencyService.resolveDependencies(frameworkId, selectedModules);
    const addedModules = dependencyService.getAddedDependencies(selectedModules, modules);

    // Informer l'utilisateur des modules ajoutés automatiquement
    if (addedModules.length > 0) {
      console.log('');
      console.log('📦 Modules ajoutés automatiquement :');
      console.log(dependencyService.getDependencyMessage(frameworkId, addedModules));
    }

    // Poser les questions spécifiques à chaque module
    const moduleAnswers: ModuleAnswers = await promptService.askModuleQuestions(frameworkId, modules);

    const projectPath = path.join(process.cwd(), projectName);

    console.log('');
    const spinner = ora('Création du projet...').start();

    // Copier le template avec les configurations des modules
    const { setupScripts } = await templateService.copyTemplate(
      framework,
      projectPath,
      modules,
      moduleAnswers
    );

    // Copier .env.example vers .env
    await templateService.copyEnvFile(projectPath);

    spinner.succeed('Projet créé');

    // Demander si l'utilisateur veut installer les dépendances
    const shouldInstall = await promptService.askInstallDependencies();

    if (shouldInstall) {
      const installSpinner = ora('Installation des dépendances de base...').start();
      try {
        setupService.installDependencies(projectPath);
        installSpinner.succeed('Dépendances de base installées');
      } catch (error) {
        installSpinner.fail('Erreur installation');
        console.error(error);
      }

      // Exécuter les scripts install.sh des modules
      if (modules.length > 0) {
        console.log('');
        console.log('📦 Installation des modules...');

        for (const moduleId of modules) {
          const moduleDef = moduleRegistry.get(frameworkId, moduleId);
          const moduleName = moduleDef?.name || moduleId;

          if (installService.hasInstallScript(framework.id, moduleId)) {
            console.log(`\n▸ ${moduleName}`);
            const result = installService.executeInstallScript(framework.id, moduleId, projectPath);

            if (!result.success) {
              console.error(`  ❌ Erreur: ${result.error}`);
            } else {
              console.log(`  ✓ Installé`);
            }
          }
        }
      }
    }

    // Exécuter automatiquement les scripts setup.sh des modules (configuration post-install)
    if (setupScripts.length > 0) {
      const setupSpinner = ora('Configuration des modules...').start();

      const failedModules = setupService.executeSetupScripts(
        frameworkId,
        setupScripts,
        projectPath,
        (moduleName) => {
          setupSpinner.text = `Configuration: ${moduleName}`;
        },
        (moduleName) => {
          setupSpinner.warn(`Erreur: ${moduleName}`);
        }
      );

      if (failedModules.length === 0) {
        setupSpinner.succeed('Modules configurés');
      } else {
        setupSpinner.fail(`Erreur modules: ${failedModules.join(', ')}`);
      }
    }

    // Afficher les instructions des modules qui nécessitent une configuration manuelle
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
    console.log('✨ Projet prêt !');
    console.log('');
    console.log('  cd ' + projectName);
    console.log('  npm run dev');
    console.log('');
  });
