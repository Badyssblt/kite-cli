// Service de génération Docker

import type { DockerComposeConfig, DockerService as DockerServiceType, FrameworkDefinition } from '../types';
import { moduleRegistry } from '../core/module-registry';
import { toYAML } from '../utils/yaml';

export class DockerGeneratorService {
  // Générer le docker-compose.yml complet
  generateDockerCompose(modules: string[]): string {
    let config: DockerComposeConfig = {
      services: {}
    };

    // Merger les configs de chaque module
    for (const moduleId of modules) {
      const module = moduleRegistry.get(moduleId);
      if (module?.docker) {
        config = this.deepMergeDockerConfig(config, module.docker);
      }
    }

    // Normaliser
    config = this.normalizeEnvironment(config);

    // Convertir en YAML
    let yaml = '';
    if (config.services && Object.keys(config.services).length > 0) {
      yaml += 'services:\n';
      yaml += toYAML(config.services, 1);
    }

    if (config.volumes && Object.keys(config.volumes).length > 0) {
      yaml += '\nvolumes:\n';
      yaml += toYAML(config.volumes, 1);
    }

    if (config.networks && Object.keys(config.networks).length > 0) {
      yaml += '\nnetworks:\n';
      yaml += toYAML(config.networks, 1);
    }

    return yaml;
  }

  // Générer le Dockerfile adapté selon le framework
  generateDockerfile(framework: FrameworkDefinition, modules: string[]): string {
    return framework.dockerfileTemplate(modules);
  }

  // Merge profond de deux configurations Docker Compose
  private deepMergeDockerConfig(
    base: DockerComposeConfig,
    incoming: Partial<DockerComposeConfig>
  ): DockerComposeConfig {
    const result: DockerComposeConfig = JSON.parse(JSON.stringify(base));

    // Merger les services
    if (incoming.services) {
      for (const [serviceName, serviceConfig] of Object.entries(incoming.services)) {
        if (!result.services[serviceName]) {
          result.services[serviceName] = serviceConfig;
        } else {
          const existingService = result.services[serviceName];
          this.mergeService(existingService, serviceConfig);
        }
      }
    }

    // Merger les volumes
    if (incoming.volumes) {
      if (!result.volumes) result.volumes = {};
      result.volumes = { ...result.volumes, ...incoming.volumes };
    }

    // Merger les networks
    if (incoming.networks) {
      if (!result.networks) result.networks = {};
      result.networks = { ...result.networks, ...incoming.networks };
    }

    return result;
  }

  // Merger un service existant avec un incoming
  private mergeService(existing: DockerServiceType, incoming: DockerServiceType): void {
    // Merger les arrays (ports, environment, volumes, depends_on)
    if (incoming.ports) {
      existing.ports = [...(existing.ports || []), ...incoming.ports];
    }

    if (incoming.volumes) {
      existing.volumes = [...(existing.volumes || []), ...incoming.volumes];
    }

    if (incoming.depends_on) {
      existing.depends_on = Array.from(new Set([
        ...(existing.depends_on || []),
        ...incoming.depends_on
      ]));
    }

    // Merger environment (peut être array ou object)
    if (incoming.environment) {
      existing.environment = this.mergeEnvironment(existing.environment, incoming.environment);
    }

    // Autres propriétés (écrasement simple)
    for (const [key, value] of Object.entries(incoming)) {
      if (!['ports', 'volumes', 'depends_on', 'environment'].includes(key)) {
        existing[key] = value;
      }
    }
  }

  // Merger environment
  private mergeEnvironment(
    existing: string[] | Record<string, string> | undefined,
    incoming: string[] | Record<string, string>
  ): string[] | Record<string, string> {
    if (Array.isArray(incoming)) {
      if (!existing) {
        return incoming;
      }
      if (Array.isArray(existing)) {
        return [...existing, ...incoming];
      }
      // Convertir object en array
      const envArray = Object.entries(existing).map(([k, v]) => `${k}=${v}`);
      return [...envArray, ...incoming];
    } else {
      // incoming est un object
      if (!existing) {
        return incoming;
      }
      if (typeof existing === 'object' && !Array.isArray(existing)) {
        return { ...existing, ...incoming };
      }
      // Convertir array en object et merger
      const envObj: Record<string, string> = {};
      for (const envStr of existing) {
        const [key, ...valueParts] = envStr.split('=');
        envObj[key] = valueParts.join('=');
      }
      return { ...envObj, ...incoming };
    }
  }

  // Normaliser environment en enlevant les doublons
  private normalizeEnvironment(config: DockerComposeConfig): DockerComposeConfig {
    const result = JSON.parse(JSON.stringify(config));

    for (const service of Object.values(result.services)) {
      const svc = service as DockerServiceType;
      if (svc.environment && Array.isArray(svc.environment)) {
        svc.environment = Array.from(new Set(svc.environment));
      }
    }

    return result;
  }
}

export const dockerService = new DockerGeneratorService();
