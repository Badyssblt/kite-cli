// Service d'interaction utilisateur (prompts)

import { select, input, confirm } from '@inquirer/prompts';
import { select as multipleSelect } from 'inquirer-select-pro';
import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import type { ModuleAnswers, ModulePrompt, PromptContext } from '../types';

export class PromptService {
  // Demander le nom du projet
  async askProjectName(defaultName = 'mon-projet'): Promise<string> {
    return input({
      message: 'Nom du projet:',
      default: defaultName
    });
  }

  // Demander le choix du framework
  async askFramework(): Promise<string> {
    const choices = frameworkRegistry.getChoices();
    return select({
      message: 'Choisissez une stack:',
      choices
    });
  }

  // Demander les modules à installer
  async askModules(frameworkId: string): Promise<string[]> {
    const choices = frameworkRegistry.getModuleChoices(frameworkId);
    return multipleSelect({
      message: 'Choisissez les modules à installer:',
      multiple: true,
      options: choices
    });
  }

  // Demander les modules à ajouter à un projet existant
  async askModulesToAdd(choices: Array<{ name: string; value: string }>): Promise<string[]> {
    return multipleSelect({
      message: 'Choose modules to add:',
      multiple: true,
      options: choices
    });
  }

  // Demander les questions spécifiques à chaque module
  async askModuleQuestions(
    selectedModules: string[],
    installedModules: string[] = []
  ): Promise<ModuleAnswers> {
    const answers: ModuleAnswers = {};
    const allModules = [...installedModules, ...selectedModules];

    for (const moduleId of selectedModules) {
      const module = moduleRegistry.get(moduleId);
      if (!module?.prompts || module.prompts.length === 0) continue;

      const moduleAnswers: Record<string, string | boolean> = {};
      const context: PromptContext = { selectedModules: allModules, answers };

      console.log(`\n⚙️  Configuration de ${module.name}:`);

      for (const prompt of module.prompts) {
        // Vérifier la condition d'affichage
        if (prompt.when && !prompt.when(context)) continue;

        const answer = await this.askPrompt(prompt);
        moduleAnswers[prompt.id] = answer;
        // Mettre à jour le context pour les questions suivantes
        answers[moduleId] = moduleAnswers;
      }

      if (Object.keys(moduleAnswers).length > 0) {
        answers[moduleId] = moduleAnswers;
      }
    }

    return answers;
  }

  // Poser une question selon son type
  private async askPrompt(prompt: ModulePrompt): Promise<string | boolean> {
    switch (prompt.type) {
      case 'select':
        return select({
          message: prompt.message,
          choices: prompt.choices?.map(c => ({
            name: c.name,
            value: c.value,
            description: c.description
          })) || [],
          default: prompt.default as string
        });

      case 'input':
        return input({
          message: prompt.message,
          default: prompt.default as string
        });

      case 'confirm':
        return confirm({
          message: prompt.message,
          default: prompt.default as boolean ?? true
        });

      default:
        return '';
    }
  }

  // Demander confirmation pour installer les dépendances
  async askInstallDependencies(): Promise<boolean> {
    return confirm({
      message: 'Installer les dépendances ?',
      default: true
    });
  }

  // Afficher un message
  log(message: string): void {
    console.log(message);
  }
}

export const promptService = new PromptService();
