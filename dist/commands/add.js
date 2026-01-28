"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addCommand = void 0;
const commander_1 = require("commander");
const ora_1 = __importDefault(require("ora"));
const module_registry_1 = require("../core/module-registry");
const dependency_service_1 = require("../services/dependency.service");
const template_service_1 = require("../services/template.service");
const setup_service_1 = require("../services/setup.service");
const prompt_service_1 = require("../services/prompt.service");
const detect_service_1 = require("../services/detect.service");
exports.addCommand = new commander_1.Command('add')
    .description('Add a module to an existing project')
    .argument('[module]', 'Module to add (optional)')
    .action(async (moduleName) => {
    const projectPath = process.cwd();
    // Détecter le framework du projet
    const spinner = (0, ora_1.default)('Detecting project framework...').start();
    const detection = detect_service_1.detectService.detectFramework(projectPath);
    if (!detection) {
        spinner.fail('Could not detect project framework');
        console.log('');
        console.log('Make sure you are in a Nuxt or Next.js project directory.');
        console.log('Looking for: nuxt.config.ts, next.config.ts, or next.config.js');
        return;
    }
    spinner.succeed(`Detected ${detection.framework.name} project`);
    const framework = detection.framework;
    // Détecter les modules déjà installés
    const installedModules = detect_service_1.detectService.detectInstalledModules(projectPath, framework.id);
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
    let selectedModules = [];
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
    }
    else {
        // Demander à l'utilisateur de choisir les modules
        const choices = availableModules.map(m => ({
            name: m.name,
            value: m.id
        }));
        selectedModules = await prompt_service_1.promptService.askModulesToAdd(choices);
        if (selectedModules.length === 0) {
            console.log('No modules selected.');
            return;
        }
    }
    // Résoudre les dépendances
    const modules = dependency_service_1.dependencyService.resolveDependencies(selectedModules);
    const addedModules = dependency_service_1.dependencyService.getAddedDependencies(selectedModules, modules);
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
            console.log(dependency_service_1.dependencyService.getDependencyMessage(newDeps));
        }
    }
    // Poser les questions spécifiques à chaque module
    const moduleAnswers = await prompt_service_1.promptService.askModuleQuestions(modulesToInstall, installedModules);
    console.log('');
    const installSpinner = (0, ora_1.default)('Adding modules...').start();
    try {
        // Ajouter les modules au projet existant
        const { setupScripts } = await template_service_1.templateService.addModulesToProject(framework, projectPath, modulesToInstall, moduleAnswers, installedModules);
        installSpinner.succeed('Modules added');
        // Demander si l'utilisateur veut installer les dépendances
        const shouldInstall = await prompt_service_1.promptService.askInstallDependencies();
        if (shouldInstall) {
            const depsSpinner = (0, ora_1.default)('Installing dependencies...').start();
            try {
                setup_service_1.setupService.installDependencies(projectPath);
                depsSpinner.succeed('Dependencies installed');
            }
            catch (error) {
                depsSpinner.fail('Failed to install dependencies');
                console.error(error);
            }
        }
        // Exécuter les scripts de setup
        if (setupScripts.length > 0) {
            const setupSpinner = (0, ora_1.default)('Configuring modules...').start();
            const failedModules = setup_service_1.setupService.executeSetupScripts(setupScripts, projectPath, (moduleName) => {
                setupSpinner.text = `Configuring: ${moduleName}`;
            }, (moduleName) => {
                setupSpinner.warn(`Error: ${moduleName}`);
            });
            if (failedModules.length === 0) {
                setupSpinner.succeed('Modules configured');
            }
            else {
                setupSpinner.fail(`Error configuring: ${failedModules.join(', ')}`);
            }
        }
        // Afficher les instructions des modules
        const modulesWithInstructions = modulesToInstall
            .map(id => module_registry_1.moduleRegistry.get(id))
            .filter(m => m?.instructions);
        if (modulesWithInstructions.length > 0) {
            console.log('');
            console.log('📋 Module configuration:');
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
    }
    catch (error) {
        installSpinner.fail('Failed to add modules');
        console.error(error);
    }
});
