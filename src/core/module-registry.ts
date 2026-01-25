// Registry central des modules

import type { ModuleDefinition } from '../types';

class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  register(module: ModuleDefinition): void {
    if (this.modules.has(module.id)) {
      console.warn(`Module "${module.id}" déjà enregistré, écrasement...`);
    }
    this.modules.set(module.id, module);
  }

  registerAll(modules: ModuleDefinition[]): void {
    for (const module of modules) {
      this.register(module);
    }
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }

  has(id: string): boolean {
    return this.modules.has(id);
  }

  getIds(): string[] {
    return Array.from(this.modules.keys());
  }

  // Résoudre les dépendances récursivement
  resolveDependencies(selectedModuleIds: string[]): string[] {
    const resolved = new Set<string>(selectedModuleIds);
    const toProcess = [...selectedModuleIds];

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const module = this.modules.get(currentId);

      if (!module) continue;

      const deps = module.dependsOn || [];

      for (const dep of deps) {
        if (!resolved.has(dep)) {
          resolved.add(dep);
          toProcess.push(dep);
        }
      }
    }

    return Array.from(resolved);
  }

  // Obtenir les modules ajoutés automatiquement
  getAddedDependencies(originalModules: string[], resolvedModules: string[]): string[] {
    return resolvedModules.filter(m => !originalModules.includes(m));
  }

  // Message explicatif des dépendances ajoutées
  getDependencyMessage(addedModules: string[]): string {
    if (addedModules.length === 0) return '';

    const messages: string[] = [];

    for (const moduleId of addedModules) {
      const dependents = this.getAll()
        .filter(m => m.dependsOn?.includes(moduleId))
        .map(m => m.id);

      if (dependents.length > 0) {
        messages.push(`  • ${moduleId} (requis par: ${dependents.join(', ')})`);
      }
    }

    return messages.join('\n');
  }

  // Trier les modules selon l'ordre des dépendances (dépendances en premier)
  sortByDependencies(moduleIds: string[]): string[] {
    const sorted: string[] = [];
    const remaining = new Set(moduleIds);

    while (remaining.size > 0) {
      let addedThisRound = false;

      for (const moduleId of Array.from(remaining)) {
        const module = this.modules.get(moduleId);
        const deps = module?.dependsOn || [];

        // Vérifier si toutes les dépendances sont déjà dans sorted
        const allDepsAdded = deps.every(dep => sorted.includes(dep) || !moduleIds.includes(dep));

        if (allDepsAdded) {
          sorted.push(moduleId);
          remaining.delete(moduleId);
          addedThisRound = true;
        }
      }

      // Si aucun module n'a été ajouté ce tour, ajouter le reste
      if (!addedThisRound && remaining.size > 0) {
        sorted.push(...Array.from(remaining));
        break;
      }
    }

    return sorted;
  }
}

export const moduleRegistry = new ModuleRegistry();
