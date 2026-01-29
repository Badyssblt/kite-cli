// Registry central des modules (par framework)

import type { ModuleDefinition } from '../types';

class ModuleRegistry {
  // Map<frameworkId, Map<moduleId, ModuleDefinition>>
  private modules: Map<string, Map<string, ModuleDefinition>> = new Map();

  register(frameworkId: string, module: ModuleDefinition): void {
    if (!this.modules.has(frameworkId)) {
      this.modules.set(frameworkId, new Map());
    }
    this.modules.get(frameworkId)!.set(module.id, module);
  }

  registerAll(frameworkId: string, modules: ModuleDefinition[]): void {
    for (const module of modules) {
      this.register(frameworkId, module);
    }
  }

  get(frameworkId: string, moduleId: string): ModuleDefinition | undefined {
    return this.modules.get(frameworkId)?.get(moduleId);
  }

  getAll(frameworkId: string): ModuleDefinition[] {
    const frameworkModules = this.modules.get(frameworkId);
    if (!frameworkModules) return [];
    return Array.from(frameworkModules.values());
  }

  has(frameworkId: string, moduleId: string): boolean {
    return this.modules.get(frameworkId)?.has(moduleId) ?? false;
  }

  getIds(frameworkId: string): string[] {
    const frameworkModules = this.modules.get(frameworkId);
    if (!frameworkModules) return [];
    return Array.from(frameworkModules.keys());
  }

  // Résoudre les dépendances récursivement
  resolveDependencies(frameworkId: string, selectedModuleIds: string[]): string[] {
    const resolved = new Set<string>(selectedModuleIds);
    const toProcess = [...selectedModuleIds];
    const frameworkModules = this.modules.get(frameworkId);

    if (!frameworkModules) return selectedModuleIds;

    while (toProcess.length > 0) {
      const currentId = toProcess.shift()!;
      const module = frameworkModules.get(currentId);

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
  getDependencyMessage(frameworkId: string, addedModules: string[]): string {
    if (addedModules.length === 0) return '';

    const messages: string[] = [];
    const allModules = this.getAll(frameworkId);

    for (const moduleId of addedModules) {
      const dependents = allModules
        .filter(m => m.dependsOn?.includes(moduleId))
        .map(m => m.id);

      if (dependents.length > 0) {
        messages.push(`  • ${moduleId} (requis par: ${dependents.join(', ')})`);
      }
    }

    return messages.join('\n');
  }

  // Trier les modules selon l'ordre des dépendances (dépendances en premier)
  sortByDependencies(frameworkId: string, moduleIds: string[]): string[] {
    const sorted: string[] = [];
    const remaining = new Set(moduleIds);
    const frameworkModules = this.modules.get(frameworkId);

    if (!frameworkModules) return moduleIds;

    while (remaining.size > 0) {
      let addedThisRound = false;

      for (const moduleId of Array.from(remaining)) {
        const module = frameworkModules.get(moduleId);
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
