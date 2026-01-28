"use strict";
// Service de copie de templates
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateService = exports.TemplateService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const merge_service_1 = require("./merge.service");
const docker_service_1 = require("./docker.service");
const module_registry_1 = require("../core/module-registry");
const placeholder_service_1 = require("./placeholder.service");
const variant_service_1 = require("./variant.service");
const fragment_service_1 = require("./fragment.service");
class TemplateService {
    constructor() {
        this.templatesPath = path_1.default.join(__dirname, '..', 'templates');
    }
    // Copier le template de base et les modules
    async copyTemplate(framework, destination, modules, moduleAnswers = {}) {
        const basePath = path_1.default.join(this.templatesPath, framework.id);
        const basicTemplatePath = path_1.default.join(basePath, 'base');
        const setupScripts = [];
        // Collecter les configurations générées par les modules
        const moduleConfigs = new Map();
        const context = { selectedModules: modules, answers: moduleAnswers };
        // Générer les configurations pour chaque module qui a des réponses
        for (const moduleId of modules) {
            const moduleDef = module_registry_1.moduleRegistry.get(framework.id, moduleId);
            if (moduleDef?.configure && moduleAnswers[moduleId]) {
                const config = moduleDef.configure(moduleAnswers[moduleId], context);
                moduleConfigs.set(moduleId, config);
            }
        }
        const placeholderService = new placeholder_service_1.PlaceholderService();
        try {
            // Supprime la destination existante
            await fs_extra_1.default.remove(destination);
            // Copie le template de base
            await fs_extra_1.default.copy(basicTemplatePath, destination);
            // Copier chaque module
            for (const moduleName of modules) {
                const moduleSetupScripts = await this.copyModule(basePath, destination, moduleName, framework, moduleAnswers[moduleName] || {});
                placeholderService.replacePlaceholderInFile(basePath, moduleName, destination, module_registry_1.moduleRegistry.get(framework.id, moduleName)?.placeholderDefinition || {});
                setupScripts.push(...moduleSetupScripts);
            }
            // Appliquer les configurations des modules (env, docker, etc.)
            await this.applyModuleConfigurations(destination, modules, moduleConfigs);
            // Génération dynamique des fichiers Docker si le module docker est présent
            if (modules.includes('docker')) {
                await this.generateDockerFiles(framework, destination, modules, moduleConfigs);
            }
            // Traiter les fragments de chaque module
            const fragmentContext = { selectedModules: modules, moduleAnswers };
            for (const moduleName of modules) {
                const moduleDef = module_registry_1.moduleRegistry.get(framework.id, moduleName);
                if (moduleDef?.fragments && moduleDef.fragments.length > 0) {
                    const modulePath = path_1.default.join(basePath, 'modules', moduleName);
                    await fragment_service_1.fragmentService.processModuleFragments(modulePath, destination, moduleName, moduleDef.fragments, fragmentContext);
                }
            }
            return { setupScripts };
        }
        catch (err) {
            console.error('Erreur lors de la copie du template :', err);
            return { setupScripts: [] };
        }
    }
    // Appliquer les configurations générées par les modules
    async applyModuleConfigurations(destination, modules, moduleConfigs) {
        const envPath = path_1.default.join(destination, '.env.example');
        const packageJsonPath = path_1.default.join(destination, 'package.json');
        // Collecter toutes les variables d'environnement et dépendances
        const allEnvVars = {};
        const allDependencies = {};
        const allDevDependencies = {};
        for (const [moduleId, config] of moduleConfigs) {
            if (config.env) {
                Object.assign(allEnvVars, config.env);
            }
            if (config.dependencies) {
                Object.assign(allDependencies, config.dependencies);
            }
            if (config.devDependencies) {
                Object.assign(allDevDependencies, config.devDependencies);
            }
        }
        // Ajouter les variables au fichier .env.example
        if (Object.keys(allEnvVars).length > 0) {
            let envContent = '';
            if (await fs_extra_1.default.pathExists(envPath)) {
                envContent = await fs_extra_1.default.readFile(envPath, 'utf-8');
            }
            // Ajouter les nouvelles variables
            const newVars = [];
            for (const [key, value] of Object.entries(allEnvVars)) {
                // Ne pas ajouter si déjà présent
                if (!envContent.includes(`${key}=`)) {
                    newVars.push(`${key}=${value}`);
                }
                else {
                    // Mettre à jour la valeur existante
                    envContent = envContent.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
                }
            }
            if (newVars.length > 0) {
                envContent = envContent.trim() + '\n\n# Configuration générée\n' + newVars.join('\n') + '\n';
            }
            await fs_extra_1.default.writeFile(envPath, envContent, 'utf-8');
        }
        // Ajouter les dépendances au package.json
        const hasDependencies = Object.keys(allDependencies).length > 0;
        const hasDevDependencies = Object.keys(allDevDependencies).length > 0;
        if ((hasDependencies || hasDevDependencies) && await fs_extra_1.default.pathExists(packageJsonPath)) {
            const packageJson = await fs_extra_1.default.readJson(packageJsonPath);
            if (hasDependencies) {
                packageJson.dependencies = {
                    ...packageJson.dependencies,
                    ...allDependencies
                };
            }
            if (hasDevDependencies) {
                packageJson.devDependencies = {
                    ...packageJson.devDependencies,
                    ...allDevDependencies
                };
            }
            await fs_extra_1.default.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        }
    }
    // Copier un module et retourner ses scripts setup
    async copyModule(basePath, destination, moduleName, framework, moduleAnswers = {}) {
        const modulePath = path_1.default.join(basePath, 'modules', moduleName);
        const setupScripts = [];
        if (!(await fs_extra_1.default.pathExists(modulePath))) {
            console.warn(`Module "${moduleName}" introuvable à ${modulePath}`);
            return setupScripts;
        }
        // Vérifier si ce module a un setup.sh ET si hasSetupScript est true
        const moduleDefinition = module_registry_1.moduleRegistry.get(framework.id, moduleName);
        if (moduleDefinition?.hasSetupScript) {
            const setupShPath = path_1.default.join(modulePath, 'setup.sh');
            if (await fs_extra_1.default.pathExists(setupShPath)) {
                setupScripts.push({ name: moduleName, path: setupShPath });
            }
        }
        // Résoudre les variantes de fichiers si le module en définit
        let resolvedVariants = [];
        if (moduleDefinition?.fileVariants && Object.keys(moduleAnswers).length > 0) {
            resolvedVariants = await variant_service_1.variantService.resolveVariants(modulePath, moduleDefinition.fileVariants, moduleAnswers);
        }
        // Copier les fichiers du module récursivement
        await this.copyModuleFiles(modulePath, destination, framework, moduleName, '');
        // Copier les fichiers variantes (écrase les fichiers par défaut)
        if (resolvedVariants.length > 0) {
            await variant_service_1.variantService.copyVariants(resolvedVariants, destination);
        }
        return setupScripts;
    }
    // Copier les fichiers d'un module récursivement en ignorant _variants
    async copyModuleFiles(srcDir, destination, framework, moduleName, relativePath) {
        const files = await fs_extra_1.default.readdir(srcDir, { withFileTypes: true });
        // Vérifier si le module a un install.sh (dans ce cas on ignore package.json)
        const hasInstallScript = await fs_extra_1.default.pathExists(path_1.default.join(srcDir, 'install.sh'));
        for (const file of files) {
            const srcPath = path_1.default.join(srcDir, file.name);
            const fileRelativePath = relativePath ? path_1.default.join(relativePath, file.name) : file.name;
            const destPath = path_1.default.join(destination, fileRelativePath);
            if (file.isDirectory()) {
                // Ignorer les dossiers _variants et _fragments
                if (variant_service_1.variantService.isVariantsFolder(file.name) || file.name === '_fragments') {
                    continue;
                }
                // Copie récursive des sous-dossiers
                await fs_extra_1.default.ensureDir(destPath);
                await this.copyModuleFiles(srcPath, destination, framework, moduleName, fileRelativePath);
            }
            else if (file.name === framework.configFileName && (await fs_extra_1.default.pathExists(destPath))) {
                await this.mergeConfigFile(framework, srcPath, destPath);
            }
            else if (file.name === 'package.json') {
                // Ignorer package.json si le module a un install.sh (il gère les deps)
                if (!hasInstallScript && (await fs_extra_1.default.pathExists(destPath))) {
                    await this.mergeFile(srcPath, destPath, merge_service_1.mergePackageJson);
                }
            }
            else if (file.name === '.env.example' && (await fs_extra_1.default.pathExists(destPath))) {
                await this.mergeEnvFile(srcPath, destPath, moduleName);
            }
            else if (moduleName === 'docker' && (file.name === 'docker-compose.yml' || file.name === 'Dockerfile')) {
                // Ignorer ces fichiers pour le module docker, on les générera dynamiquement
            }
            else if (file.name === 'setup.sh' || file.name === 'install.sh') {
                // Ignorer setup.sh et install.sh, ils seront exécutés mais pas copiés
            }
            else {
                await fs_extra_1.default.copy(srcPath, destPath, { overwrite: true });
            }
        }
    }
    // Merger un fichier de configuration selon la stratégie du framework
    async mergeConfigFile(framework, srcPath, destPath) {
        const existingContent = await fs_extra_1.default.readFile(destPath, 'utf-8');
        const moduleContent = await fs_extra_1.default.readFile(srcPath, 'utf-8');
        let mergedContent;
        if (framework.configMergeStrategy === 'magicast') {
            mergedContent = (0, merge_service_1.mergeNuxtConfig)(existingContent, moduleContent);
        }
        else {
            // JSON merge
            mergedContent = (0, merge_service_1.mergePackageJson)(existingContent, moduleContent);
        }
        await fs_extra_1.default.writeFile(destPath, mergedContent, 'utf-8');
    }
    // Merger un fichier générique
    async mergeFile(srcPath, destPath, mergeFn) {
        const existingContent = await fs_extra_1.default.readFile(destPath, 'utf-8');
        const moduleContent = await fs_extra_1.default.readFile(srcPath, 'utf-8');
        const mergedContent = mergeFn(existingContent, moduleContent);
        await fs_extra_1.default.writeFile(destPath, mergedContent, 'utf-8');
    }
    // Merger un fichier .env
    async mergeEnvFile(srcPath, destPath, moduleName) {
        const existingContent = await fs_extra_1.default.readFile(destPath, 'utf-8');
        const moduleContent = await fs_extra_1.default.readFile(srcPath, 'utf-8');
        const mergedContent = (0, merge_service_1.mergeEnvExample)(existingContent, moduleContent, moduleName);
        await fs_extra_1.default.writeFile(destPath, mergedContent, 'utf-8');
    }
    // Générer les fichiers Docker
    async generateDockerFiles(framework, destination, modules, moduleConfigs) {
        const dockerCompose = docker_service_1.dockerService.generateDockerCompose(framework.id, modules, moduleConfigs);
        await fs_extra_1.default.writeFile(path_1.default.join(destination, 'docker-compose.yml'), dockerCompose, 'utf-8');
        const dockerfile = docker_service_1.dockerService.generateDockerfile(framework, modules);
        await fs_extra_1.default.writeFile(path_1.default.join(destination, 'Dockerfile'), dockerfile, 'utf-8');
    }
    // Copier .env.example vers .env
    async copyEnvFile(projectPath) {
        const envExamplePath = path_1.default.join(projectPath, '.env.example');
        const envPath = path_1.default.join(projectPath, '.env');
        if (await fs_extra_1.default.pathExists(envExamplePath)) {
            await fs_extra_1.default.copy(envExamplePath, envPath);
        }
    }
    // Ajouter des modules à un projet existant
    async addModulesToProject(framework, projectPath, modules, moduleAnswers = {}, installedModules = []) {
        const basePath = path_1.default.join(this.templatesPath, framework.id);
        const setupScripts = [];
        // Collecter les configurations générées par les modules
        const moduleConfigs = new Map();
        const allModules = [...installedModules, ...modules];
        const context = { selectedModules: allModules, answers: moduleAnswers };
        // Générer les configurations pour chaque module qui a des réponses
        for (const moduleId of modules) {
            const moduleDef = module_registry_1.moduleRegistry.get(framework.id, moduleId);
            if (moduleDef?.configure && moduleAnswers[moduleId]) {
                const config = moduleDef.configure(moduleAnswers[moduleId], context);
                moduleConfigs.set(moduleId, config);
            }
        }
        const placeholderService = new placeholder_service_1.PlaceholderService();
        try {
            // Copier chaque nouveau module
            for (const moduleName of modules) {
                const moduleSetupScripts = await this.copyModule(basePath, projectPath, moduleName, framework, moduleAnswers[moduleName] || {});
                placeholderService.replacePlaceholderInFile(basePath, moduleName, projectPath, module_registry_1.moduleRegistry.get(framework.id, moduleName)?.placeholderDefinition || {});
                setupScripts.push(...moduleSetupScripts);
            }
            // Appliquer les configurations des modules (env, docker, etc.)
            await this.applyModuleConfigurations(projectPath, modules, moduleConfigs);
            // Mettre à jour docker-compose.yml si docker est installé
            const dockerInstalled = installedModules.includes('docker') || modules.includes('docker');
            if (dockerInstalled) {
                // Récupérer les configs de tous les modules installés pour le docker
                const allModuleConfigs = new Map(moduleConfigs);
                // Ajouter les configs des modules déjà installés
                for (const moduleId of installedModules) {
                    if (!allModuleConfigs.has(moduleId)) {
                        const moduleDef = module_registry_1.moduleRegistry.get(framework.id, moduleId);
                        if (moduleDef?.docker) {
                            // Créer une config minimale avec les infos docker
                            allModuleConfigs.set(moduleId, { docker: moduleDef.docker });
                        }
                    }
                }
                await this.generateDockerFiles(framework, projectPath, allModules, allModuleConfigs);
            }
            // Traiter les fragments de chaque nouveau module
            const fragmentContext = { selectedModules: allModules, moduleAnswers };
            for (const moduleName of modules) {
                const moduleDef = module_registry_1.moduleRegistry.get(framework.id, moduleName);
                if (moduleDef?.fragments && moduleDef.fragments.length > 0) {
                    const modulePath = path_1.default.join(basePath, 'modules', moduleName);
                    await fragment_service_1.fragmentService.processModuleFragments(modulePath, projectPath, moduleName, moduleDef.fragments, fragmentContext);
                }
            }
            // Mettre à jour .env à partir de .env.example
            await this.updateEnvFromExample(projectPath);
            return { setupScripts };
        }
        catch (err) {
            console.error('Error adding modules:', err);
            return { setupScripts: [] };
        }
    }
    // Mettre à jour .env avec les nouvelles variables de .env.example
    async updateEnvFromExample(projectPath) {
        const envExamplePath = path_1.default.join(projectPath, '.env.example');
        const envPath = path_1.default.join(projectPath, '.env');
        if (!(await fs_extra_1.default.pathExists(envExamplePath))) {
            return;
        }
        const exampleContent = await fs_extra_1.default.readFile(envExamplePath, 'utf-8');
        let envContent = '';
        if (await fs_extra_1.default.pathExists(envPath)) {
            envContent = await fs_extra_1.default.readFile(envPath, 'utf-8');
        }
        // Parser les variables de .env.example
        const exampleLines = exampleContent.split('\n');
        const newVars = [];
        for (const line of exampleLines) {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith('#')) {
                const [key] = trimmed.split('=');
                if (key && !envContent.includes(`${key}=`)) {
                    newVars.push(trimmed);
                }
            }
        }
        if (newVars.length > 0) {
            envContent = envContent.trim();
            if (envContent) {
                envContent += '\n\n# New variables\n';
            }
            envContent += newVars.join('\n') + '\n';
            await fs_extra_1.default.writeFile(envPath, envContent, 'utf-8');
        }
    }
}
exports.TemplateService = TemplateService;
exports.templateService = new TemplateService();
