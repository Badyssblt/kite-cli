// Service de gestion des dépendances

import { moduleRegistry } from '../core/module-registry';

export class DependencyService {
  // Résoudre les dépendances pour une liste de modules
  resolveDependencies(frameworkId: string, selectedModuleIds: string[]): string[] {
    return moduleRegistry.resolveDependencies(frameworkId, selectedModuleIds);
  }

  // Obtenir les modules ajoutés automatiquement
  getAddedDependencies(originalModules: string[], resolvedModules: string[]): string[] {
    return moduleRegistry.getAddedDependencies(originalModules, resolvedModules);
  }

  // Message explicatif des dépendances ajoutées
  getDependencyMessage(frameworkId: string, addedModules: string[]): string {
    return moduleRegistry.getDependencyMessage(frameworkId, addedModules);
  }

  // Trier les modules selon l'ordre des dépendances
  sortByDependencies(frameworkId: string, moduleIds: string[]): string[] {
    return moduleRegistry.sortByDependencies(frameworkId, moduleIds);
  }
}

export const dependencyService = new DependencyService();
