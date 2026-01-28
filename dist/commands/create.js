"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCommand = void 0;
const commander_1 = require("commander");
const path_1 = __importDefault(require("path"));
const ora_1 = __importDefault(require("ora"));
const framework_registry_1 = require("../core/framework-registry");
const module_registry_1 = require("../core/module-registry");
const dependency_service_1 = require("../services/dependency.service");
const template_service_1 = require("../services/template.service");
const setup_service_1 = require("../services/setup.service");
const install_service_1 = require("../services/install.service");
const prompt_service_1 = require("../services/prompt.service");
exports.createCommand = new commander_1.Command('create')
    .description('Create a new project')
    .action(async () => {
    // Demander le nom du projet
    const projectName = await prompt_service_1.promptService.askProjectName();
    // Demander le framework
    const frameworkId = await prompt_service_1.promptService.askFramework();
    const framework = framework_registry_1.frameworkRegistry.get(frameworkId);
    if (!framework) {
        console.error(`Framework "${frameworkId}" non trouvé`);
        return;
    }
    // Demander les modules à installer
    const selectedModules = await prompt_service_1.promptService.askModules(frameworkId);
    // Résoudre les dépendances
    const modules = dependency_service_1.dependencyService.resolveDependencies(frameworkId, selectedModules);
    const addedModules = dependency_service_1.dependencyService.getAddedDependencies(selectedModules, modules);
    // Informer l'utilisateur des modules ajoutés automatiquement
    if (addedModules.length > 0) {
        console.log('');
        console.log('📦 Modules ajoutés automatiquement :');
        console.log(dependency_service_1.dependencyService.getDependencyMessage(frameworkId, addedModules));
    }
    // Poser les questions spécifiques à chaque module
    const moduleAnswers = await prompt_service_1.promptService.askModuleQuestions(frameworkId, modules);
    const projectPath = path_1.default.join(process.cwd(), projectName);
    console.log('');
    const spinner = (0, ora_1.default)('Création du projet...').start();
    // Copier le template avec les configurations des modules
    const { setupScripts } = await template_service_1.templateService.copyTemplate(framework, projectPath, modules, moduleAnswers);
    // Copier .env.example vers .env
    await template_service_1.templateService.copyEnvFile(projectPath);
    spinner.succeed('Projet créé');
    // Demander si l'utilisateur veut installer les dépendances
    const shouldInstall = await prompt_service_1.promptService.askInstallDependencies();
    if (shouldInstall) {
        const installSpinner = (0, ora_1.default)('Installation des dépendances de base...').start();
        try {
            setup_service_1.setupService.installDependencies(projectPath);
            installSpinner.succeed('Dépendances de base installées');
        }
        catch (error) {
            installSpinner.fail('Erreur installation');
            console.error(error);
        }
        // Exécuter les scripts install.sh des modules
        if (modules.length > 0) {
            console.log('');
            console.log('📦 Installation des modules...');
            for (const moduleId of modules) {
                const moduleDef = module_registry_1.moduleRegistry.get(frameworkId, moduleId);
                const moduleName = moduleDef?.name || moduleId;
                if (install_service_1.installService.hasInstallScript(framework.id, moduleId)) {
                    console.log(`\n▸ ${moduleName}`);
                    const result = install_service_1.installService.executeInstallScript(framework.id, moduleId, projectPath);
                    if (!result.success) {
                        console.error(`  ❌ Erreur: ${result.error}`);
                    }
                    else {
                        console.log(`  ✓ Installé`);
                    }
                }
            }
        }
    }
    // Exécuter automatiquement les scripts setup.sh des modules (configuration post-install)
    if (setupScripts.length > 0) {
        const setupSpinner = (0, ora_1.default)('Configuration des modules...').start();
        const failedModules = setup_service_1.setupService.executeSetupScripts(frameworkId, setupScripts, projectPath, (moduleName) => {
            setupSpinner.text = `Configuration: ${moduleName}`;
        }, (moduleName) => {
            setupSpinner.warn(`Erreur: ${moduleName}`);
        });
        if (failedModules.length === 0) {
            setupSpinner.succeed('Modules configurés');
        }
        else {
            setupSpinner.fail(`Erreur modules: ${failedModules.join(', ')}`);
        }
    }
    // Afficher les instructions des modules qui nécessitent une configuration manuelle
    const modulesWithInstructions = modules
        .map(id => module_registry_1.moduleRegistry.get(frameworkId, id))
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
