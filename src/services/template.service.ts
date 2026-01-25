// Service de copie de templates

import path from 'path';
import fs from 'fs-extra';
import type {
  CopyTemplateResult,
  FrameworkDefinition,
  SetupScript,
  ModuleAnswers,
  ModuleConfiguration,
  PromptContext
} from '../types';
import { mergeNuxtConfig, mergePackageJson, mergeEnvExample } from './merge.service';
import { dockerService } from './docker.service';
import { moduleRegistry } from '../core/module-registry';
import { PlaceholderService } from './placeholder.service';
import { variantService, type ResolvedVariant } from './variant.service';
import { fragmentService } from './fragment.service';

export class TemplateService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  // Copier le template de base et les modules
  async copyTemplate(
    framework: FrameworkDefinition,
    destination: string,
    modules: string[],
    moduleAnswers: ModuleAnswers = {}
  ): Promise<CopyTemplateResult> {
    const basePath = path.join(this.templatesPath, framework.id);
    const basicTemplatePath = path.join(basePath, 'base');

    const setupScripts: SetupScript[] = [];

    // Collecter les configurations générées par les modules
    const moduleConfigs: Map<string, ModuleConfiguration> = new Map();
    const context: PromptContext = { selectedModules: modules, answers: moduleAnswers };

    // Générer les configurations pour chaque module qui a des réponses
    for (const moduleId of modules) {
      const moduleDef = moduleRegistry.get(moduleId);
      if (moduleDef?.configure && moduleAnswers[moduleId]) {
        const config = moduleDef.configure(moduleAnswers[moduleId], context);
        moduleConfigs.set(moduleId, config);
      }
    } 

    const placeholderService = new PlaceholderService()

    try {
      // Supprime la destination existante
      await fs.remove(destination);

      // Copie le template de base
      await fs.copy(basicTemplatePath, destination);

      // Copier chaque module
      for (const moduleName of modules) {
        const moduleSetupScripts = await this.copyModule(
          basePath,
          destination,
          moduleName,
          framework,
          moduleAnswers[moduleName] || {}
        );
        placeholderService.replacePlaceholderInFile(
          basePath,
          moduleName,
          destination,
          moduleRegistry.get(moduleName)?.placeholderDefinition || {}
        );

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
        const moduleDef = moduleRegistry.get(moduleName);
        if (moduleDef?.fragments && moduleDef.fragments.length > 0) {
          const modulePath = path.join(basePath, 'modules', moduleName);
          await fragmentService.processModuleFragments(
            modulePath,
            destination,
            moduleName,
            moduleDef.fragments,
            fragmentContext
          );
        }
      }

      return { setupScripts };
    } catch (err) {
      console.error('Erreur lors de la copie du template :', err);
      return { setupScripts: [] };
    }
  }

  // Appliquer les configurations générées par les modules
  private async applyModuleConfigurations(
    destination: string,
    modules: string[],
    moduleConfigs: Map<string, ModuleConfiguration>
  ): Promise<void> {
    const envPath = path.join(destination, '.env.example');
    const packageJsonPath = path.join(destination, 'package.json');

    // Collecter toutes les variables d'environnement et dépendances
    const allEnvVars: Record<string, string> = {};
    const allDependencies: Record<string, string> = {};
    const allDevDependencies: Record<string, string> = {};

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
      if (await fs.pathExists(envPath)) {
        envContent = await fs.readFile(envPath, 'utf-8');
      }

      // Ajouter les nouvelles variables
      const newVars: string[] = [];
      for (const [key, value] of Object.entries(allEnvVars)) {
        // Ne pas ajouter si déjà présent
        if (!envContent.includes(`${key}=`)) {
          newVars.push(`${key}=${value}`);
        } else {
          // Mettre à jour la valeur existante
          envContent = envContent.replace(
            new RegExp(`^${key}=.*$`, 'm'),
            `${key}=${value}`
          );
        }
      }

      if (newVars.length > 0) {
        envContent = envContent.trim() + '\n\n# Configuration générée\n' + newVars.join('\n') + '\n';
      }

      await fs.writeFile(envPath, envContent, 'utf-8');
    }

    // Ajouter les dépendances au package.json
    const hasDependencies = Object.keys(allDependencies).length > 0;
    const hasDevDependencies = Object.keys(allDevDependencies).length > 0;

    if ((hasDependencies || hasDevDependencies) && await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);

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

      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }
  }



  // Copier un module et retourner ses scripts setup
  private async copyModule(
    basePath: string,
    destination: string,
    moduleName: string,
    framework: FrameworkDefinition,
    moduleAnswers: Record<string, string | boolean> = {}
  ): Promise<SetupScript[]> {
    const modulePath = path.join(basePath, 'modules', moduleName);
    const setupScripts: SetupScript[] = [];

    if (!(await fs.pathExists(modulePath))) {
      console.warn(`Module "${moduleName}" introuvable à ${modulePath}`);
      return setupScripts;
    }

    // Vérifier si ce module a un setup.sh ET si hasSetupScript est true
    const moduleDefinition = moduleRegistry.get(moduleName);
    if (moduleDefinition?.hasSetupScript) {
      const setupShPath = path.join(modulePath, 'setup.sh');
      if (await fs.pathExists(setupShPath)) {
        setupScripts.push({ name: moduleName, path: setupShPath });
      }
    }

    // Résoudre les variantes de fichiers si le module en définit
    let resolvedVariants: ResolvedVariant[] = [];
    if (moduleDefinition?.fileVariants && Object.keys(moduleAnswers).length > 0) {
      resolvedVariants = await variantService.resolveVariants(
        modulePath,
        moduleDefinition.fileVariants,
        moduleAnswers
      );
    }

    // Copier les fichiers du module récursivement
    await this.copyModuleFiles(modulePath, destination, framework, moduleName, '');

    // Copier les fichiers variantes (écrase les fichiers par défaut)
    if (resolvedVariants.length > 0) {
      await variantService.copyVariants(resolvedVariants, destination);
    }

    return setupScripts;
  }

  // Copier les fichiers d'un module récursivement en ignorant _variants
  private async copyModuleFiles(
    srcDir: string,
    destination: string,
    framework: FrameworkDefinition,
    moduleName: string,
    relativePath: string
  ): Promise<void> {
    const files = await fs.readdir(srcDir, { withFileTypes: true });

    for (const file of files) {
      const srcPath = path.join(srcDir, file.name);
      const fileRelativePath = relativePath ? path.join(relativePath, file.name) : file.name;
      const destPath = path.join(destination, fileRelativePath);

      if (file.isDirectory()) {
        // Ignorer les dossiers _variants et _fragments
        if (variantService.isVariantsFolder(file.name) || file.name === '_fragments') {
          continue;
        }
        // Copie récursive des sous-dossiers
        await fs.ensureDir(destPath);
        await this.copyModuleFiles(srcPath, destination, framework, moduleName, fileRelativePath);
      } else if (file.name === framework.configFileName && (await fs.pathExists(destPath))) {
        await this.mergeConfigFile(framework, srcPath, destPath);
      } else if (file.name === 'package.json' && (await fs.pathExists(destPath))) {
        await this.mergeFile(srcPath, destPath, mergePackageJson);
      } else if (file.name === '.env.example' && (await fs.pathExists(destPath))) {
        await this.mergeEnvFile(srcPath, destPath, moduleName);
      } else if (moduleName === 'docker' && (file.name === 'docker-compose.yml' || file.name === 'Dockerfile')) {
        // Ignorer ces fichiers pour le module docker, on les générera dynamiquement
      } else if (file.name === 'setup.sh') {
        // Ignorer setup.sh, il sera exécuté mais pas copié
      } else {
        await fs.copy(srcPath, destPath, { overwrite: true });
      }
    }
  }

  // Merger un fichier de configuration selon la stratégie du framework
  private async mergeConfigFile(
    framework: FrameworkDefinition,
    srcPath: string,
    destPath: string
  ): Promise<void> {
    const existingContent = await fs.readFile(destPath, 'utf-8');
    const moduleContent = await fs.readFile(srcPath, 'utf-8');

    let mergedContent: string;

    if (framework.configMergeStrategy === 'magicast') {
      mergedContent = mergeNuxtConfig(existingContent, moduleContent);
    } else {
      // JSON merge
      mergedContent = mergePackageJson(existingContent, moduleContent);
    }

    await fs.writeFile(destPath, mergedContent, 'utf-8');
  }

  // Merger un fichier générique
  private async mergeFile(
    srcPath: string,
    destPath: string,
    mergeFn: (existing: string, incoming: string) => string
  ): Promise<void> {
    const existingContent = await fs.readFile(destPath, 'utf-8');
    const moduleContent = await fs.readFile(srcPath, 'utf-8');
    const mergedContent = mergeFn(existingContent, moduleContent);
    await fs.writeFile(destPath, mergedContent, 'utf-8');
  }

  // Merger un fichier .env
  private async mergeEnvFile(
    srcPath: string,
    destPath: string,
    moduleName: string
  ): Promise<void> {
    const existingContent = await fs.readFile(destPath, 'utf-8');
    const moduleContent = await fs.readFile(srcPath, 'utf-8');
    const mergedContent = mergeEnvExample(existingContent, moduleContent, moduleName);
    await fs.writeFile(destPath, mergedContent, 'utf-8');
  }

  // Générer les fichiers Docker
  private async generateDockerFiles(
    framework: FrameworkDefinition,
    destination: string,
    modules: string[],
    moduleConfigs: Map<string, ModuleConfiguration>
  ): Promise<void> {
    const dockerCompose = dockerService.generateDockerCompose(modules, moduleConfigs);
    await fs.writeFile(
      path.join(destination, 'docker-compose.yml'),
      dockerCompose,
      'utf-8'
    );

    const dockerfile = dockerService.generateDockerfile(framework, modules);
    await fs.writeFile(
      path.join(destination, 'Dockerfile'),
      dockerfile,
      'utf-8'
    );
  }

  // Copier .env.example vers .env
  async copyEnvFile(projectPath: string): Promise<void> {
    const envExamplePath = path.join(projectPath, '.env.example');
    const envPath = path.join(projectPath, '.env');
    if (await fs.pathExists(envExamplePath)) {
      await fs.copy(envExamplePath, envPath);
    }
  }
}

export const templateService = new TemplateService();
