// Service de gestion des fragments de fichiers (générique)

import path from 'path';
import fs from 'fs-extra';
import YAML from 'yaml';
import type { FragmentDefinition, ModuleAnswers } from '../types';

interface FragmentContext {
  selectedModules: string[];
  moduleAnswers: ModuleAnswers;
}

/**
 * Service générique pour fusionner les fragments de fichiers
 * Supporte différents types de fichiers et stratégies de merge
 */
export class FragmentService {
  /**
   * Traite tous les fragments d'un module
   */
  async processModuleFragments(
    modulePath: string,
    projectPath: string,
    moduleId: string,
    fragments: FragmentDefinition[],
    context: FragmentContext
  ): Promise<void> {
    for (const fragment of fragments) {
      if (this.shouldProcessFragment(fragment, moduleId, context)) {
        await this.processFragment(modulePath, projectPath, moduleId, fragment);
      }
    }
  }

  /**
   * Vérifie si un fragment doit être traité selon ses conditions
   */
  private shouldProcessFragment(
    fragment: FragmentDefinition,
    moduleId: string,
    context: FragmentContext
  ): boolean {
    // Condition sur module
    if (fragment.ifModule) {
      if (!context.selectedModules.includes(fragment.ifModule)) {
        return false;
      }
    }

    // Condition sur réponse de prompt
    if (fragment.ifPrompt) {
      const answers = context.moduleAnswers[moduleId];
      if (!answers) return false;

      const answerValue = answers[fragment.ifPrompt.id];
      const expectedValues = Array.isArray(fragment.ifPrompt.value)
        ? fragment.ifPrompt.value
        : [fragment.ifPrompt.value];

      if (!expectedValues.includes(String(answerValue))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Traite un fragment individuel
   */
  private async processFragment(
    modulePath: string,
    projectPath: string,
    moduleId: string,
    fragment: FragmentDefinition
  ): Promise<void> {
    const sourcePath = path.join(modulePath, fragment.source);
    const targetPath = path.join(projectPath, fragment.target);

    // Vérifier que le fichier source existe
    if (!(await fs.pathExists(sourcePath))) {
      console.warn(`Fragment source not found: ${sourcePath}`);
      return;
    }

    // Lire le contenu du fragment
    const fragmentContent = await fs.readFile(sourcePath, 'utf-8');

    // Créer le fichier cible s'il n'existe pas
    if (!(await fs.pathExists(targetPath))) {
      await fs.ensureDir(path.dirname(targetPath));
      await fs.writeFile(targetPath, '', 'utf-8');
    }

    // Appliquer la stratégie de fusion
    const strategy = fragment.strategy || 'append';
    await this.mergeContent(targetPath, fragmentContent, strategy, moduleId, fragment.separator);
  }

  /**
   * Fusionne le contenu selon la stratégie
   */
  private async mergeContent(
    targetPath: string,
    fragmentContent: string,
    strategy: 'append' | 'prepend' | 'merge-json' | 'merge-yaml',
    moduleId: string,
    separator?: string
  ): Promise<void> {
    const existingContent = await fs.readFile(targetPath, 'utf-8');
    let newContent: string;

    const defaultSeparator = `\n\n// ========== ${moduleId.toUpperCase()} ==========\n`;
    const sep = separator !== undefined ? separator : defaultSeparator;

    switch (strategy) {
      case 'append':
        newContent = existingContent.trimEnd() + sep + fragmentContent.trim() + '\n';
        break;

      case 'prepend':
        newContent = fragmentContent.trim() + sep + existingContent.trimStart();
        break;

      case 'merge-json':
        newContent = this.mergeJson(existingContent, fragmentContent);
        break;

      case 'merge-yaml':
        newContent = this.mergeYaml(existingContent, fragmentContent);
        break;

      default:
        newContent = existingContent + fragmentContent;
    }

    await fs.writeFile(targetPath, newContent, 'utf-8');
  }

  /**
   * Fusionne deux contenus JSON
   */
  private mergeJson(existing: string, fragment: string): string {
    try {
      const existingObj = existing.trim() ? JSON.parse(existing) : {};
      const fragmentObj = JSON.parse(fragment);
      const merged = this.deepMerge(existingObj, fragmentObj);
      return JSON.stringify(merged, null, 2) + '\n';
    } catch (error) {
      console.warn('Failed to merge JSON, appending instead');
      return existing + '\n' + fragment;
    }
  }

  /**
   * Fusionne deux contenus YAML
   */
  private mergeYaml(existing: string, fragment: string): string {
    try {
      const existingObj = existing.trim() ? YAML.parse(existing) : {};
      const fragmentObj = YAML.parse(fragment);
      const merged = this.deepMerge(existingObj, fragmentObj);
      return YAML.stringify(merged);
    } catch (error) {
      console.warn('Failed to merge YAML, appending instead');
      return existing + '\n' + fragment;
    }
  }

  /**
   * Deep merge de deux objets
   */
  private deepMerge(target: any, source: any): any {
    const output = { ...target };

    for (const key of Object.keys(source)) {
      if (
        source[key] &&
        typeof source[key] === 'object' &&
        !Array.isArray(source[key])
      ) {
        if (target[key] && typeof target[key] === 'object') {
          output[key] = this.deepMerge(target[key], source[key]);
        } else {
          output[key] = source[key];
        }
      } else if (Array.isArray(source[key])) {
        output[key] = [...(target[key] || []), ...source[key]];
      } else {
        output[key] = source[key];
      }
    }

    return output;
  }
}

export const fragmentService = new FragmentService();
