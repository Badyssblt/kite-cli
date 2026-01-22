// Service de copie de templates

import path from 'path';
import fs from 'fs-extra';
import type { CopyTemplateResult, FrameworkDefinition, SetupScript } from '../types';
import { mergeNuxtConfig, mergePackageJson, mergeEnvExample } from './merge.service';
import { dockerService } from './docker.service';
import { moduleRegistry } from '../core/module-registry';

export class TemplateService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  // Copier le template de base et les modules
  async copyTemplate(
    framework: FrameworkDefinition,
    destination: string,
    modules: string[]
  ): Promise<CopyTemplateResult> {
    const basePath = path.join(this.templatesPath, framework.id);
    const basicTemplatePath = path.join(basePath, 'base');

    const setupScripts: SetupScript[] = [];

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
          framework
        );
        setupScripts.push(...moduleSetupScripts);
      }

      // Génération dynamique des fichiers Docker si le module docker est présent
      if (modules.includes('docker')) {
        await this.generateDockerFiles(framework, destination, modules);
      }

      return { setupScripts };
    } catch (err) {
      console.error('Erreur lors de la copie du template :', err);
      return { setupScripts: [] };
    }
  }

  // Copier un module et retourner ses scripts setup
  private async copyModule(
    basePath: string,
    destination: string,
    moduleName: string,
    framework: FrameworkDefinition
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

    // Parcours tous les fichiers du module
    const files = await fs.readdir(modulePath, { withFileTypes: true });

    for (const file of files) {
      const srcPath = path.join(modulePath, file.name);
      const destPath = path.join(destination, file.name);

      if (file.isDirectory()) {
        await fs.copy(srcPath, destPath, { overwrite: true });
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

    return setupScripts;
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
    modules: string[]
  ): Promise<void> {
    const dockerCompose = dockerService.generateDockerCompose(modules);
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
