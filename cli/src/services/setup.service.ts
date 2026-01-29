// Service d'exécution des scripts setup

import { execSync } from 'child_process';
import type { SetupScript } from '../types';
import { dependencyService } from './dependency.service';

export class SetupService {
  // Exécuter les scripts setup dans l'ordre des dépendances
  executeSetupScripts(
    frameworkId: string,
    setupScripts: SetupScript[],
    projectPath: string,
    onProgress?: (moduleName: string) => void,
    onError?: (moduleName: string, error: unknown) => void
  ): string[] {
    const failedModules: string[] = [];

    // Trier les scripts selon l'ordre des dépendances
    const moduleNames = setupScripts.map(s => s.name);
    const sortedNames = dependencyService.sortByDependencies(frameworkId, moduleNames);
    const sortedScripts = sortedNames
      .map(name => setupScripts.find(s => s.name === name))
      .filter((s): s is SetupScript => s !== undefined);

    for (const script of sortedScripts) {
      onProgress?.(script.name);
      try {
        execSync(`bash "${script.path}"`, {
          cwd: projectPath,
          stdio: 'pipe'
        });
      } catch (error) {
        failedModules.push(script.name);
        onError?.(script.name, error);
      }
    }

    return failedModules;
  }

  // Installer les dépendances npm
  installDependencies(projectPath: string, ignoreScripts = false): void {
    const cmd = ignoreScripts ? 'npm install --ignore-scripts' : 'npm install';
    execSync(cmd, {
      cwd: projectPath,
      stdio: 'pipe'
    });
  }

  // Exécuter nuxt prepare (ou équivalent)
  runPrepare(projectPath: string): void {
    execSync('npm run postinstall', {
      cwd: projectPath,
      stdio: 'pipe'
    });
  }
}

export const setupService = new SetupService();
