// Service de gestion des dépendances

import { moduleRegistry } from '../core/module-registry';

export class DependencyService {
  // Résoudre les dépendances pour une liste de modules
  resolveDependencies(selectedModuleIds: string[]): string[] {
    return moduleRegistry.resolveDependencies(selectedModuleIds);
  }

  // Obtenir les modules ajoutés automatiquement
  getAddedDependencies(originalModules: string[], resolvedModules: string[]): string[] {
    return moduleRegistry.getAddedDependencies(originalModules, resolvedModules);
  }

  // Message explicatif des dépendances ajoutées
  getDependencyMessage(addedModules: string[]): string {
    return moduleRegistry.getDependencyMessage(addedModules);
  }

  // Trier les modules selon l'ordre des dépendances
  sortByDependencies(moduleIds: string[]): string[] {
    return moduleRegistry.sortByDependencies(moduleIds);
  }
}

export const dependencyService = new DependencyService();
