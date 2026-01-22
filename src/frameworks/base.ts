// Classe abstraite pour les frameworks

import type { FrameworkDefinition, ModuleDefinition } from '../types';

export abstract class BaseFramework implements FrameworkDefinition {
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract modules: ModuleDefinition[];
  abstract configFileName: string;
  abstract configMergeStrategy: 'magicast' | 'json';

  abstract dockerfileTemplate(modules: string[]): string;

  getModule(id: string): ModuleDefinition | undefined {
    return this.modules.find(m => m.id === id);
  }

  getModuleIds(): string[] {
    return this.modules.map(m => m.id);
  }

  hasModule(id: string): boolean {
    return this.modules.some(m => m.id === id);
  }

  toDefinition(): FrameworkDefinition {
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
