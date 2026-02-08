import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import type { FrameworkDefinition } from '../types';
import type { PackageManager } from './manifest.service';
import { debug } from '../utils/debug';

class InstallService {
  private templatesPath: string;

  constructor() {
    this.templatesPath = path.join(__dirname, '..', 'templates');
  }

  /**
   * Check if a module has an install.sh script
   */
  hasInstallScript(frameworkId: string, moduleId: string): boolean {
    const scriptPath = this.getInstallScriptPath(frameworkId, moduleId);
    return fs.existsSync(scriptPath);
  }

  /**
   * Get the path to a module's install.sh script
   */
  getInstallScriptPath(frameworkId: string, moduleId: string): string {
    return path.join(this.templatesPath, frameworkId, 'modules', moduleId, 'install.sh');
  }

  /**
   * Execute a module's install.sh script
   * Passes KITE_PM env var so scripts can use the right package manager
   */
  executeInstallScript(
    frameworkId: string,
    moduleId: string,
    projectPath: string,
    pm: PackageManager = 'npm'
  ): { success: boolean; error?: string } {
    const scriptPath = this.getInstallScriptPath(frameworkId, moduleId);

    if (!fs.existsSync(scriptPath)) {
      return { success: false, error: `No install.sh found for ${moduleId}` };
    }

    try {
      // Make script executable
      fs.chmodSync(scriptPath, '755');

      debug('Executing install script:', scriptPath, 'with PM:', pm);

      // Execute the script in the project directory
      // Pass KITE_PM so scripts can adapt to the package manager
      execSync(`bash "${scriptPath}"`, {
        cwd: projectPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          PATH: process.env.PATH,
          KITE_PM: pm,
          KITE_ADD: pmAddCommand(pm),
          KITE_ADD_DEV: pmAddCommand(pm, true),
          KITE_EXEC: pmExecCommand(pm),
        }
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Install multiple modules using their install.sh scripts
   */
  installModules(
    framework: FrameworkDefinition,
    projectPath: string,
    moduleIds: string[],
    pm: PackageManager = 'npm',
    onProgress?: (moduleId: string, status: 'start' | 'success' | 'error') => void
  ): { installed: string[]; failed: string[] } {
    const installed: string[] = [];
    const failed: string[] = [];

    for (const moduleId of moduleIds) {
      onProgress?.(moduleId, 'start');

      if (!this.hasInstallScript(framework.id, moduleId)) {
        continue;
      }

      const result = this.executeInstallScript(framework.id, moduleId, projectPath, pm);

      if (result.success) {
        installed.push(moduleId);
        onProgress?.(moduleId, 'success');
      } else {
        failed.push(moduleId);
        onProgress?.(moduleId, 'error');
        console.error(`Failed to install ${moduleId}: ${result.error}`);
      }
    }

    return { installed, failed };
  }
}

function pmAddCommand(pm: PackageManager, dev = false): string {
  const commands: Record<PackageManager, string> = {
    npm: dev ? 'npm install -D' : 'npm install',
    pnpm: dev ? 'pnpm add -D' : 'pnpm add',
    yarn: dev ? 'yarn add -D' : 'yarn add',
    bun: dev ? 'bun add -D' : 'bun add',
  };
  return commands[pm];
}

function pmExecCommand(pm: PackageManager): string {
  const commands: Record<PackageManager, string> = {
    npm: 'npx',
    pnpm: 'pnpm dlx',
    yarn: 'yarn dlx',
    bun: 'bunx',
  };
  return commands[pm];
}

export const installService = new InstallService();
