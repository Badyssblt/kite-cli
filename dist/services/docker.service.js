"use strict";
// Service de génération Docker
Object.defineProperty(exports, "__esModule", { value: true });
exports.dockerService = exports.DockerGeneratorService = void 0;
const module_registry_1 = require("../core/module-registry");
const yaml_1 = require("../utils/yaml");
class DockerGeneratorService {
    // Générer le docker-compose.yml complet
    generateDockerCompose(frameworkId, modules, moduleConfigs = new Map()) {
        let config = {
            services: {}
        };
        // Merger les configs de chaque module
        for (const moduleId of modules) {
            // Priorité à la config dynamique générée par configure()
            const dynamicConfig = moduleConfigs.get(moduleId);
            if (dynamicConfig?.docker) {
                config = this.deepMergeDockerConfig(config, dynamicConfig.docker);
            }
            else {
                // Sinon utiliser la config statique du module
                const module = module_registry_1.moduleRegistry.get(frameworkId, moduleId);
                if (module?.docker) {
                    config = this.deepMergeDockerConfig(config, module.docker);
                }
            }
        }
        // Normaliser
        config = this.normalizeEnvironment(config);
        // Convertir en YAML
        let yaml = '';
        if (config.services && Object.keys(config.services).length > 0) {
            yaml += 'services:\n';
            yaml += (0, yaml_1.toYAML)(config.services, 1);
        }
        if (config.volumes && Object.keys(config.volumes).length > 0) {
            yaml += '\nvolumes:\n';
            yaml += (0, yaml_1.toYAML)(config.volumes, 1);
        }
        if (config.networks && Object.keys(config.networks).length > 0) {
            yaml += '\nnetworks:\n';
            yaml += (0, yaml_1.toYAML)(config.networks, 1);
        }
        return yaml;
    }
    // Générer le Dockerfile adapté selon le framework
    generateDockerfile(framework, modules) {
        return framework.dockerfileTemplate(modules);
    }
    // Merge profond de deux configurations Docker Compose
    deepMergeDockerConfig(base, incoming) {
        const result = JSON.parse(JSON.stringify(base));
        // Merger les services
        if (incoming.services) {
            for (const [serviceName, serviceConfig] of Object.entries(incoming.services)) {
                if (!result.services[serviceName]) {
                    result.services[serviceName] = serviceConfig;
                }
                else {
                    const existingService = result.services[serviceName];
                    this.mergeService(existingService, serviceConfig);
                }
            }
        }
        // Merger les volumes
        if (incoming.volumes) {
            if (!result.volumes)
                result.volumes = {};
            result.volumes = { ...result.volumes, ...incoming.volumes };
        }
        // Merger les networks
        if (incoming.networks) {
            if (!result.networks)
                result.networks = {};
            result.networks = { ...result.networks, ...incoming.networks };
        }
        return result;
    }
    // Merger un service existant avec un incoming
    mergeService(existing, incoming) {
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
    mergeEnvironment(existing, incoming) {
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
        }
        else {
            // incoming est un object
            if (!existing) {
                return incoming;
            }
            if (typeof existing === 'object' && !Array.isArray(existing)) {
                return { ...existing, ...incoming };
            }
            // Convertir array en object et merger
            const envObj = {};
            for (const envStr of existing) {
                const [key, ...valueParts] = envStr.split('=');
                envObj[key] = valueParts.join('=');
            }
            return { ...envObj, ...incoming };
        }
    }
    // Normaliser environment en enlevant les doublons
    normalizeEnvironment(config) {
        const result = JSON.parse(JSON.stringify(config));
        for (const service of Object.values(result.services)) {
            const svc = service;
            if (svc.environment && Array.isArray(svc.environment)) {
                svc.environment = Array.from(new Set(svc.environment));
            }
        }
        return result;
    }
}
exports.DockerGeneratorService = DockerGeneratorService;
exports.dockerService = new DockerGeneratorService();
