// Service d'interaction utilisateur (prompts)

import { select, input, confirm } from '@inquirer/prompts';
import { select as multipleSelect } from 'inquirer-select-pro';
import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import type { ModuleAnswers, ModulePrompt, PromptContext } from '../types';
import { presets } from '../presets';

export class PromptService {
  // Demander le nom du projet
  async askProjectName(defaultName = 'mon-projet'): Promise<string> {
    return input({
      message: 'Nom du projet:',
      default: defaultName
    });
  }

  async askProvider(): Promise<String> {
    const choices = [
      { name: 'GitHub', value: 'github' },
      { name: 'GitLab', value: 'gitlab' },
      { name: 'Bitbucket', value: 'bitbucket' },
    ];
    return select({
      message: 'Choisissez un fournisseur de dépôt:',
      choices
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
  // presetAnswers : réponses pré-remplies par un preset (skip le prompt si couvert)
  async askModuleQuestions(
    frameworkId: string,
    selectedModules: string[],
    installedModules: string[] = [],
    presetAnswers?: ModuleAnswers
  ): Promise<ModuleAnswers> {
    const answers: ModuleAnswers = {};
    const allModules = [...installedModules, ...selectedModules];

    for (const moduleId of selectedModules) {
      const module = moduleRegistry.get(frameworkId, moduleId);
      if (!module?.prompts || module.prompts.length === 0) continue;

      const moduleAnswers: Record<string, string | boolean> = {};
      const context: PromptContext = { selectedModules: allModules, answers };

      let headerShown = false;

      for (const prompt of module.prompts) {
        // Vérifier la condition d'affichage
        if (prompt.when && !prompt.when(context)) continue;

        // 1. Le preset a une réponse → on l'utilise directement
        const presetValue = presetAnswers?.[moduleId]?.[prompt.id];
        if (presetValue !== undefined) {
          moduleAnswers[prompt.id] = presetValue;
          answers[moduleId] = moduleAnswers;
          continue;
        }

        // 2. Pas de preset mais un default → on l'utilise directement
        if (presetAnswers && prompt.default !== undefined) {
          moduleAnswers[prompt.id] = prompt.default;
          answers[moduleId] = moduleAnswers;
          continue;
        }

        // 3. Ni preset ni default → on demande
        if (!headerShown) {
          console.log(`\n⚙️  Configuration de ${module.name}:`);
          headerShown = true;
        }

        const answer = await this.askPrompt(prompt);
        moduleAnswers[prompt.id] = answer;
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

  async askPreset(frameworkId?: string): Promise<string | null> {
    const filtered = Object.entries(presets).filter(([, p]) => {
      if (!frameworkId) return true;
      const frameworks = Array.isArray(p.framework) ? p.framework : [p.framework];
      return frameworks.includes(frameworkId);
    });

    if (filtered.length === 0) return null;

    const choices = [
      { name: 'Aucun (choisir manuellement)', value: '__none__' },
      ...filtered.map(([key, p]) => ({
        name: `${p.name} — ${p.description}`,
        value: key,
      })),
    ];

    const result = await select({
      message: 'Utiliser un preset ?',
      choices,
    });

    return result === '__none__' ? null : result;
  }

  // Afficher un message
  log(message: string): void {
    console.log(message);
  }
}

export const promptService = new PromptService();
