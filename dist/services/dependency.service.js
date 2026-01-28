"use strict";
// Service de gestion des dépendances
Object.defineProperty(exports, "__esModule", { value: true });
exports.dependencyService = exports.DependencyService = void 0;
const module_registry_1 = require("../core/module-registry");
class DependencyService {
    // Résoudre les dépendances pour une liste de modules
    resolveDependencies(frameworkId, selectedModuleIds) {
        return module_registry_1.moduleRegistry.resolveDependencies(frameworkId, selectedModuleIds);
    }
    // Obtenir les modules ajoutés automatiquement
    getAddedDependencies(originalModules, resolvedModules) {
        return module_registry_1.moduleRegistry.getAddedDependencies(originalModules, resolvedModules);
    }
    // Message explicatif des dépendances ajoutées
    getDependencyMessage(frameworkId, addedModules) {
        return module_registry_1.moduleRegistry.getDependencyMessage(frameworkId, addedModules);
    }
    // Trier les modules selon l'ordre des dépendances
    sortByDependencies(frameworkId, moduleIds) {
        return module_registry_1.moduleRegistry.sortByDependencies(frameworkId, moduleIds);
    }
}
exports.DependencyService = DependencyService;
exports.dependencyService = new DependencyService();
