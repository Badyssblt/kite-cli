// Service d'exécution des scripts setup

import { execSync } from 'child_process';
import type { SetupScript } from '../types';
import type { PackageManager } from './manifest.service';
import { dependencyService } from './dependency.service';
import { debug } from '../utils/debug';

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
        debug('Executing setup script:', script.path);
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

  // Installer les dépendances
  installDependencies(projectPath: string, ignoreScripts = false, pm: PackageManager = 'npm'): void {
    let cmd: string;

    switch (pm) {
      case 'pnpm':
        cmd = ignoreScripts ? 'pnpm install --ignore-scripts' : 'pnpm install';
        break;
      case 'yarn':
        cmd = ignoreScripts ? 'yarn install --ignore-scripts' : 'yarn install';
        break;
      case 'bun':
        cmd = 'bun install';
        break;
      default:
        cmd = ignoreScripts ? 'npm install --ignore-scripts' : 'npm install';
    }

    debug('Running:', cmd);
    execSync(cmd, {
      cwd: projectPath,
      stdio: 'pipe'
    });
  }

  // Exécuter nuxt prepare (ou équivalent)
  runPrepare(projectPath: string, pm: PackageManager = 'npm'): void {
    const commands: Record<PackageManager, string> = {
      npm: 'npm run postinstall',
      pnpm: 'pnpm postinstall',
      yarn: 'yarn postinstall',
      bun: 'bun run postinstall',
    };

    debug('Running prepare:', commands[pm]);
    execSync(commands[pm], {
      cwd: projectPath,
      stdio: 'pipe'
    });
  }
}

export const setupService = new SetupService();
