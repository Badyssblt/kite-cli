// Service d'interaction utilisateur (prompts)

import { select, input, confirm } from '@inquirer/prompts';
import { select as multipleSelect } from 'inquirer-select-pro';
import { frameworkRegistry } from '../core/framework-registry';

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
