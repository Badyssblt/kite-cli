// Service de gestion du manifest .kite/manifest.json
// Track les modules installés, le framework, et les réponses des prompts

import path from 'path';
import fs from 'fs-extra';
import type { ModuleAnswers } from '../types';

export interface KiteManifest {
  version: string;
  framework: string;
  modules: ManifestModule[];
  packageManager: PackageManager;
  createdAt: string;
  updatedAt: string;
}

export interface ManifestModule {
  id: string;
  installedAt: string;
  answers?: Record<string, string | boolean>;
}

export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

const MANIFEST_VERSION = '1.0.0';
const KITE_DIR = '.kite';
const MANIFEST_FILE = 'manifest.json';

class ManifestService {
  /**
   * Get the path to the manifest file
   */
  getManifestPath(projectPath: string): string {
    return path.join(projectPath, KITE_DIR, MANIFEST_FILE);
  }

  /**
   * Check if a manifest exists
   */
  exists(projectPath: string): boolean {
    return fs.existsSync(this.getManifestPath(projectPath));
  }

  /**
   * Read the manifest from disk
   */
  read(projectPath: string): KiteManifest | null {
    const manifestPath = this.getManifestPath(projectPath);
    if (!fs.existsSync(manifestPath)) {
      return null;
    }
    try {
      return fs.readJsonSync(manifestPath) as KiteManifest;
    } catch {
      return null;
    }
  }

  /**
   * Write the manifest to disk
   */
  write(projectPath: string, manifest: KiteManifest): void {
    const manifestPath = this.getManifestPath(projectPath);
    fs.ensureDirSync(path.dirname(manifestPath));
    manifest.updatedAt = new Date().toISOString();
    fs.writeJsonSync(manifestPath, manifest, { spaces: 2 });
  }

  /**
   * Create a new manifest for a project
   */
  create(
    projectPath: string,
    frameworkId: string,
    modules: string[],
    moduleAnswers: ModuleAnswers = {},
    packageManager: PackageManager = 'npm'
  ): KiteManifest {
    const now = new Date().toISOString();
    const manifest: KiteManifest = {
      version: MANIFEST_VERSION,
      framework: frameworkId,
      modules: modules.map(id => ({
        id,
        installedAt: now,
        answers: moduleAnswers[id] || undefined,
      })),
      packageManager,
      createdAt: now,
      updatedAt: now,
    };
    this.write(projectPath, manifest);
    return manifest;
  }

  /**
   * Add modules to an existing manifest
   */
  addModules(
    projectPath: string,
    moduleIds: string[],
    moduleAnswers: ModuleAnswers = {}
  ): KiteManifest | null {
    const manifest = this.read(projectPath);
    if (!manifest) return null;

    const now = new Date().toISOString();
    const existingIds = new Set(manifest.modules.map(m => m.id));

    for (const id of moduleIds) {
      if (!existingIds.has(id)) {
        manifest.modules.push({
          id,
          installedAt: now,
          answers: moduleAnswers[id] || undefined,
        });
      }
    }

    this.write(projectPath, manifest);
    return manifest;
  }

  /**
   * Remove modules from manifest
   */
  removeModules(projectPath: string, moduleIds: string[]): KiteManifest | null {
    const manifest = this.read(projectPath);
    if (!manifest) return null;

    const toRemove = new Set(moduleIds);
    manifest.modules = manifest.modules.filter(m => !toRemove.has(m.id));
    this.write(projectPath, manifest);
    return manifest;
  }

  /**
   * Get list of installed module IDs from manifest
   */
  getInstalledModules(projectPath: string): string[] {
    const manifest = this.read(projectPath);
    if (!manifest) return [];
    return manifest.modules.map(m => m.id);
  }

  /**
   * Get the framework ID from manifest
   */
  getFrameworkId(projectPath: string): string | null {
    const manifest = this.read(projectPath);
    return manifest?.framework || null;
  }

  /**
   * Get the package manager from manifest
   */
  getPackageManager(projectPath: string): PackageManager {
    const manifest = this.read(projectPath);
    return manifest?.packageManager || 'npm';
  }

  /**
   * Update the package manager in manifest
   */
  setPackageManager(projectPath: string, pm: PackageManager): void {
    const manifest = this.read(projectPath);
    if (!manifest) return;
    manifest.packageManager = pm;
    this.write(projectPath, manifest);
  }

  /**
   * Detect package manager from lockfiles
   */
  detectPackageManager(projectPath: string): PackageManager {
    if (fs.existsSync(path.join(projectPath, 'bun.lockb')) || fs.existsSync(path.join(projectPath, 'bun.lock'))) {
      return 'bun';
    }
    if (fs.existsSync(path.join(projectPath, 'pnpm-lock.yaml'))) {
      return 'pnpm';
    }
    if (fs.existsSync(path.join(projectPath, 'yarn.lock'))) {
      return 'yarn';
    }
    return 'npm';
  }

  /**
   * Get the install command for the detected package manager
   */
  getInstallCommand(pm: PackageManager): string {
    const commands: Record<PackageManager, string> = {
      npm: 'npm install',
      pnpm: 'pnpm install',
      yarn: 'yarn install',
      bun: 'bun install',
    };
    return commands[pm];
  }

  /**
   * Get the add command for a package manager
   */
  getAddCommand(pm: PackageManager, dev = false): string {
    const commands: Record<PackageManager, string> = {
      npm: dev ? 'npm install -D' : 'npm install',
      pnpm: dev ? 'pnpm add -D' : 'pnpm add',
      yarn: dev ? 'yarn add -D' : 'yarn add',
      bun: dev ? 'bun add -D' : 'bun add',
    };
    return commands[pm];
  }

  /**
   * Get the run command for a package manager
   */
  getRunCommand(pm: PackageManager): string {
    const commands: Record<PackageManager, string> = {
      npm: 'npm run',
      pnpm: 'pnpm',
      yarn: 'yarn',
      bun: 'bun run',
    };
    return commands[pm];
  }

  /**
   * Get the exec/dlx command for a package manager
   */
  getExecCommand(pm: PackageManager): string {
    const commands: Record<PackageManager, string> = {
      npm: 'npx',
      pnpm: 'pnpm dlx',
      yarn: 'yarn dlx',
      bun: 'bunx',
    };
    return commands[pm];
  }
}

export const manifestService = new ManifestService();
