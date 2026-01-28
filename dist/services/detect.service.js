"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const framework_registry_1 = require("../core/framework-registry");
class DetectService {
    /**
     * Detect the framework of a project by looking for config files
     */
    detectFramework(projectPath) {
        // Check for Nuxt
        const nuxtConfig = this.findConfigFile(projectPath, [
            'nuxt.config.ts',
            'nuxt.config.js'
        ]);
        if (nuxtConfig) {
            const framework = framework_registry_1.frameworkRegistry.get('nuxt');
            if (framework) {
                return { framework, configFile: nuxtConfig };
            }
        }
        // Check for Next.js
        const nextConfig = this.findConfigFile(projectPath, [
            'next.config.ts',
            'next.config.js',
            'next.config.mjs'
        ]);
        if (nextConfig) {
            const framework = framework_registry_1.frameworkRegistry.get('nextjs');
            if (framework) {
                return { framework, configFile: nextConfig };
            }
        }
        return null;
    }
    /**
     * Find a config file from a list of possible names
     */
    findConfigFile(projectPath, configFiles) {
        for (const configFile of configFiles) {
            const fullPath = path_1.default.join(projectPath, configFile);
            if (fs_1.default.existsSync(fullPath)) {
                return configFile;
            }
        }
        return null;
    }
    /**
     * Detect which modules are already installed in the project
     */
    detectInstalledModules(projectPath, frameworkId) {
        const installedModules = [];
        const packageJsonPath = path_1.default.join(projectPath, 'package.json');
        if (!fs_1.default.existsSync(packageJsonPath)) {
            return installedModules;
        }
        const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
        const allDeps = {
            ...packageJson.dependencies,
            ...packageJson.devDependencies
        };
        // Detection rules for each module
        const detectionRules = {
            'prisma': () => '@prisma/client' in allDeps || 'prisma' in allDeps,
            'better-auth': () => 'better-auth' in allDeps,
            'stripe': () => 'stripe' in allDeps,
            'tailwind': () => 'tailwindcss' in allDeps,
            'shadcn': () => {
                // Check for shadcn components.json
                return fs_1.default.existsSync(path_1.default.join(projectPath, 'components.json'));
            },
            'pinia': () => 'pinia' in allDeps,
            'nuxt-ui': () => '@nuxt/ui' in allDeps,
            'i18n': () => '@nuxtjs/i18n' in allDeps || 'next-intl' in allDeps,
            'eslint': () => 'eslint' in allDeps,
            'vitest': () => 'vitest' in allDeps,
            'supabase': () => '@supabase/supabase-js' in allDeps,
            'docker': () => {
                // Check for docker-compose.yml
                return fs_1.default.existsSync(path_1.default.join(projectPath, 'docker-compose.yml'));
            }
        };
        for (const [moduleId, detect] of Object.entries(detectionRules)) {
            try {
                if (detect()) {
                    installedModules.push(moduleId);
                }
            }
            catch {
                // Ignore detection errors
            }
        }
        return installedModules;
    }
    /**
     * Get project info from package.json
     */
    getProjectInfo(projectPath) {
        const packageJsonPath = path_1.default.join(projectPath, 'package.json');
        if (!fs_1.default.existsSync(packageJsonPath)) {
            return null;
        }
        try {
            const packageJson = JSON.parse(fs_1.default.readFileSync(packageJsonPath, 'utf-8'));
            return {
                name: packageJson.name || 'unknown',
                version: packageJson.version || '0.0.0'
            };
        }
        catch {
            return null;
        }
    }
}
exports.detectService = new DetectService();
