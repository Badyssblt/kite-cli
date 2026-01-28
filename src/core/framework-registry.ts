// Registry central des frameworks

import type { FrameworkDefinition, ModuleDefinition } from '../types';
import { moduleRegistry } from './module-registry';

class FrameworkRegistry {
  private frameworks: Map<string, FrameworkDefinition> = new Map();

  register(framework: FrameworkDefinition): void {
    if (this.frameworks.has(framework.id)) {
      console.warn(`Framework "${framework.id}" déjà enregistré, écrasement...`);
    }
    this.frameworks.set(framework.id, framework);

    // Enregistrer tous les modules du framework dans le module registry
    moduleRegistry.registerAll(framework.id, framework.modules);
  }

  get(id: string): FrameworkDefinition | undefined {
    return this.frameworks.get(id);
  }

  getAll(): FrameworkDefinition[] {
    return Array.from(this.frameworks.values());
  }

  has(id: string): boolean {
    return this.frameworks.has(id);
  }

  getIds(): string[] {
    return Array.from(this.frameworks.keys());
  }

  // Obtenir les choix de framework pour inquirer
  getChoices(): Array<{ name: string; value: string; description: string }> {
    return this.getAll().map(f => ({
      name: f.name,
      value: f.id,
      description: f.description
    }));
  }

  // Obtenir les choix de modules pour un framework
  getModuleChoices(frameworkId: string): Array<{ name: string; value: string }> {
    const framework = this.frameworks.get(frameworkId);
    if (!framework) return [];

    return framework.modules.map(m => ({
      name: m.name,
      value: m.id
    }));
  }

  // Obtenir les modules d'un framework
  getModules(frameworkId: string): ModuleDefinition[] {
    const framework = this.frameworks.get(frameworkId);
    return framework?.modules || [];
  }
}

export const frameworkRegistry = new FrameworkRegistry();
