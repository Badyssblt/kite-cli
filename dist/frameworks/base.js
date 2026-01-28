"use strict";
// Classe abstraite pour les frameworks
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseFramework = void 0;
class BaseFramework {
    getModule(id) {
        return this.modules.find(m => m.id === id);
    }
    getModuleIds() {
        return this.modules.map(m => m.id);
    }
    hasModule(id) {
        return this.modules.some(m => m.id === id);
    }
    toDefinition() {
        return {
            id: this.id,
            name: this.name,
            description: this.description,
            modules: this.modules,
            configFileName: this.configFileName,
            configMergeStrategy: this.configMergeStrategy,
            dockerfileTemplate: this.dockerfileTemplate.bind(this)
        };
    }
}
exports.BaseFramework = BaseFramework;
