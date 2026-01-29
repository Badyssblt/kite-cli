import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';
import type { FrameworkDefinition } from '../types';

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
   */
  executeInstallScript(
    frameworkId: string,
    moduleId: string,
    projectPath: string
  ): { success: boolean; error?: string } {
    const scriptPath = this.getInstallScriptPath(frameworkId, moduleId);

    if (!fs.existsSync(scriptPath)) {
      return { success: false, error: `No install.sh found for ${moduleId}` };
    }

    try {
      // Make script executable
      fs.chmodSync(scriptPath, '755');

      // Execute the script in the project directory
      execSync(`bash "${scriptPath}"`, {
        cwd: projectPath,
        stdio: 'inherit',
        env: { ...process.env, PATH: process.env.PATH }
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
    onProgress?: (moduleId: string, status: 'start' | 'success' | 'error') => void
  ): { installed: string[]; failed: string[] } {
    const installed: string[] = [];
    const failed: string[] = [];

    for (const moduleId of moduleIds) {
      onProgress?.(moduleId, 'start');

      if (!this.hasInstallScript(framework.id, moduleId)) {
        // Skip modules without install.sh (use legacy method)
        continue;
      }

      const result = this.executeInstallScript(framework.id, moduleId, projectPath);

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

export const installService = new InstallService();
