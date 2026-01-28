import fs from 'fs';
import path from 'path';
import { frameworkRegistry } from '../core/framework-registry';
import type { FrameworkDefinition } from '../types';

interface DetectionResult {
  framework: FrameworkDefinition;
  configFile: string;
}

class DetectService {
  /**
   * Detect the framework of a project by looking for config files
   */
  detectFramework(projectPath: string): DetectionResult | null {
    // Check for Nuxt
    const nuxtConfig = this.findConfigFile(projectPath, [
      'nuxt.config.ts',
      'nuxt.config.js'
    ]);
    if (nuxtConfig) {
      const framework = frameworkRegistry.get('nuxt');
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
      const framework = frameworkRegistry.get('nextjs');
      if (framework) {
        return { framework, configFile: nextConfig };
      }
    }

    return null;
  }

  /**
   * Find a config file from a list of possible names
   */
  private findConfigFile(projectPath: string, configFiles: string[]): string | null {
    for (const configFile of configFiles) {
      const fullPath = path.join(projectPath, configFile);
      if (fs.existsSync(fullPath)) {
        return configFile;
      }
    }
    return null;
  }

  /**
   * Detect which modules are already installed in the project
   */
  detectInstalledModules(projectPath: string, frameworkId: string): string[] {
    const installedModules: string[] = [];
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return installedModules;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };

    // Detection rules for each module
    const detectionRules: Record<string, () => boolean> = {
      'prisma': () => '@prisma/client' in allDeps || 'prisma' in allDeps,
      'better-auth': () => 'better-auth' in allDeps,
      'stripe': () => 'stripe' in allDeps,
      'tailwind': () => 'tailwindcss' in allDeps,
      'shadcn': () => {
        // Check for shadcn components.json
        return fs.existsSync(path.join(projectPath, 'components.json'));
      },
      'pinia': () => 'pinia' in allDeps,
      'nuxt-ui': () => '@nuxt/ui' in allDeps,
      'i18n': () => '@nuxtjs/i18n' in allDeps || 'next-intl' in allDeps,
      'eslint': () => 'eslint' in allDeps,
      'vitest': () => 'vitest' in allDeps,
      'supabase': () => '@supabase/supabase-js' in allDeps,
      'docker': () => {
        // Check for docker-compose.yml
        return fs.existsSync(path.join(projectPath, 'docker-compose.yml'));
      }
    };

    for (const [moduleId, detect] of Object.entries(detectionRules)) {
      try {
        if (detect()) {
          installedModules.push(moduleId);
        }
      } catch {
        // Ignore detection errors
      }
    }

    return installedModules;
  }

  /**
   * Get project info from package.json
   */
  getProjectInfo(projectPath: string): { name: string; version: string } | null {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return {
        name: packageJson.name || 'unknown',
        version: packageJson.version || '0.0.0'
      };
    } catch {
      return null;
    }
  }
}

export const detectService = new DetectService();
