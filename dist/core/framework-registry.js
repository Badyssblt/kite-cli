"use strict";
// Registry central des frameworks
Object.defineProperty(exports, "__esModule", { value: true });
exports.frameworkRegistry = void 0;
const module_registry_1 = require("./module-registry");
class FrameworkRegistry {
    constructor() {
        this.frameworks = new Map();
    }
    register(framework) {
        if (this.frameworks.has(framework.id)) {
            console.warn(`Framework "${framework.id}" déjà enregistré, écrasement...`);
        }
        this.frameworks.set(framework.id, framework);
        // Enregistrer tous les modules du framework dans le module registry
        module_registry_1.moduleRegistry.registerAll(framework.modules);
    }
    get(id) {
        return this.frameworks.get(id);
    }
    getAll() {
        return Array.from(this.frameworks.values());
    }
    has(id) {
        return this.frameworks.has(id);
    }
    getIds() {
        return Array.from(this.frameworks.keys());
    }
    // Obtenir les choix de framework pour inquirer
    getChoices() {
        return this.getAll().map(f => ({
            name: f.name,
            value: f.id,
            description: f.description
        }));
    }
    // Obtenir les choix de modules pour un framework
    getModuleChoices(frameworkId) {
        const framework = this.frameworks.get(frameworkId);
        if (!framework)
            return [];
        return framework.modules.map(m => ({
            name: m.name,
            value: m.id
        }));
    }
    // Obtenir les modules d'un framework
    getModules(frameworkId) {
        const framework = this.frameworks.get(frameworkId);
        return framework?.modules || [];
    }
}
exports.frameworkRegistry = new FrameworkRegistry();
