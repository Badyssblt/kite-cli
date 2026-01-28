"use strict";
// Service de gestion des dépendances
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyService = exports.DependencyService = void 0;
const module_registry_1 = require("../core/module-registry");
class DependencyService {
    // Résoudre les dépendances pour une liste de modules
    resolveDependencies(selectedModuleIds) {
        return module_registry_1.moduleRegistry.resolveDependencies(selectedModuleIds);
    }
    // Obtenir les modules ajoutés automatiquement
    getAddedDependencies(originalModules, resolvedModules) {
        return module_registry_1.moduleRegistry.getAddedDependencies(originalModules, resolvedModules);
    }
    // Message explicatif des dépendances ajoutées
    getDependencyMessage(addedModules) {
        return module_registry_1.moduleRegistry.getDependencyMessage(addedModules);
    }
    // Trier les modules selon l'ordre des dépendances
    sortByDependencies(moduleIds) {
        return module_registry_1.moduleRegistry.sortByDependencies(moduleIds);
    }
}
exports.DependencyService = DependencyService;
exports.dependencyService = new DependencyService();
