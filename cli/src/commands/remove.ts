import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';
import { confirm } from '@inquirer/prompts';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { detectService } from '../services/detect.service';
import { manifestService } from '../services/manifest.service';
import { promptService } from '../services/prompt.service';
import { debug } from '../utils/debug';

export const removeCommand = new Command('remove')
  .alias('rm')
  .description('Remove modules from the project')
  .argument('[modules...]', 'Modules to remove')
  .option('--force', 'Skip confirmation prompt')
  .option('--dry-run', 'Preview what would be removed without making changes')
  .option('--json', 'Output as JSON')
  .action(async (moduleArgs: string[], options: { force?: boolean; dryRun?: boolean; json?: boolean }) => {
    const projectPath = process.cwd();

    // Detect framework
    const detection = detectService.detectFramework(projectPath);
    if (!detection) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'No framework detected' }));
      } else {
        console.error('Could not detect project framework.');
      }
      return;
    }

    const framework = detection.framework;
    const frameworkId = framework.id;

    // Get installed modules
    const manifest = manifestService.read(projectPath);
    const installedModules = manifest
      ? manifest.modules.map(m => m.id)
      : detectService.detectInstalledModules(projectPath, frameworkId);

    if (installedModules.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'No modules installed' }));
      } else {
        console.log('No modules installed.');
      }
      return;
    }

    // Determine which modules to remove
    let modulesToRemove: string[] = [];

    if (moduleArgs.length > 0) {
      // Validate provided module names
      for (const mod of moduleArgs) {
        if (!installedModules.includes(mod)) {
          if (options.json) {
            console.log(JSON.stringify({ success: false, error: `Module "${mod}" is not installed` }));
          } else {
            console.error(`Module "${mod}" is not installed.`);
            console.log('Installed modules:', installedModules.join(', '));
          }
          return;
        }
      }
      modulesToRemove = moduleArgs;
    } else {
      // Interactive selection
      const choices = installedModules.map(id => {
        const mod = moduleRegistry.get(frameworkId, id);
        return { name: mod?.name || id, value: id };
      });

      modulesToRemove = await promptService.askModulesToAdd(choices);
      if (modulesToRemove.length === 0) {
        console.log('No modules selected.');
        return;
      }
    }

    // Check reverse dependencies (modules that depend on modules being removed)
    const warnings: string[] = [];
    for (const moduleId of modulesToRemove) {
      const dependents = installedModules.filter(installed => {
        if (modulesToRemove.includes(installed)) return false;
        const mod = moduleRegistry.get(frameworkId, installed);
        return mod?.dependsOn?.includes(moduleId) || false;
      });

      if (dependents.length > 0) {
        warnings.push(`"${moduleId}" is required by: ${dependents.join(', ')}`);
      }
    }

    if (warnings.length > 0 && !options.json) {
      console.log('');
      console.log('\x1b[33mWarning: dependency conflicts\x1b[0m');
      for (const w of warnings) {
        console.log(`  ${w}`);
      }
      console.log('');
    }

    // Collect what will be removed
    const removalPlan = await buildRemovalPlan(projectPath, frameworkId, modulesToRemove);

    if (options.dryRun || options.json) {
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          dryRun: true,
          modules: modulesToRemove,
          warnings,
          plan: removalPlan,
        }));
      } else {
        console.log('\n  Dry run — the following changes would be made:\n');
        printRemovalPlan(removalPlan, modulesToRemove);
      }
      return;
    }

    // Confirm removal
    if (!options.force) {
      console.log('');
      printRemovalPlan(removalPlan, modulesToRemove);

      const confirmed = await confirm({
        message: `Remove ${modulesToRemove.length} module(s)?`,
        default: false,
      });

      if (!confirmed) {
        console.log('Cancelled.');
        return;
      }
    }

    // Execute removal
    const spinner = ora('Removing modules...').start();

    try {
      // 1. Remove module-specific files
      for (const fileToRemove of removalPlan.filesToRemove) {
        debug('Removing file:', fileToRemove);
        await fs.remove(path.join(projectPath, fileToRemove));
      }

      // 2. Clean dependencies from package.json
      if (removalPlan.depsToRemove.length > 0 || removalPlan.devDepsToRemove.length > 0) {
        const pkgPath = path.join(projectPath, 'package.json');
        if (await fs.pathExists(pkgPath)) {
          const pkg = await fs.readJson(pkgPath);

          for (const dep of removalPlan.depsToRemove) {
            if (pkg.dependencies) delete pkg.dependencies[dep];
          }
          for (const dep of removalPlan.devDepsToRemove) {
            if (pkg.devDependencies) delete pkg.devDependencies[dep];
          }

          await fs.writeJson(pkgPath, pkg, { spaces: 2 });
        }
      }

      // 3. Clean env variables
      if (removalPlan.envVarsToRemove.length > 0) {
        for (const envFile of ['.env', '.env.example']) {
          const envPath = path.join(projectPath, envFile);
          if (await fs.pathExists(envPath)) {
            let content = await fs.readFile(envPath, 'utf-8');
            for (const key of removalPlan.envVarsToRemove) {
              // Remove the line containing this env var
              content = content.replace(new RegExp(`^${key}=.*\\n?`, 'gm'), '');
            }
            // Clean up empty comment sections
            content = content.replace(/\n{3,}/g, '\n\n');
            await fs.writeFile(envPath, content, 'utf-8');
          }
        }
      }

      // 4. Update manifest
      manifestService.removeModules(projectPath, modulesToRemove);

      spinner.succeed(`Removed: ${modulesToRemove.join(', ')}`);

      console.log('');
      console.log('You may need to:');
      console.log('  1. Run your package manager install to clean up node_modules');
      console.log('  2. Remove any manual references to these modules in your code');
      console.log('');
    } catch (error) {
      spinner.fail('Error removing modules');
      console.error(error);
    }
  });

interface RemovalPlan {
  filesToRemove: string[];
  depsToRemove: string[];
  devDepsToRemove: string[];
  envVarsToRemove: string[];
}

async function buildRemovalPlan(
  projectPath: string,
  frameworkId: string,
  moduleIds: string[]
): Promise<RemovalPlan> {
  const filesToRemove: string[] = [];
  const depsToRemove: string[] = [];
  const devDepsToRemove: string[] = [];
  const envVarsToRemove: string[] = [];

  // Known module -> dependency mapping
  const moduleDepsMap: Record<string, { deps: string[]; devDeps: string[] }> = {
    prisma: { deps: ['@prisma/client'], devDeps: ['prisma'] },
    'better-auth': { deps: ['better-auth'], devDeps: [] },
    stripe: { deps: ['stripe'], devDeps: [] },
    tailwind: { deps: ['tailwindcss'], devDeps: [] },
    shadcn: { deps: [], devDeps: [] },
    pinia: { deps: ['pinia', '@pinia/nuxt'], devDeps: [] },
    'nuxt-ui': { deps: ['@nuxt/ui'], devDeps: [] },
    i18n: { deps: ['@nuxtjs/i18n', 'next-intl'], devDeps: [] },
    eslint: { deps: [], devDeps: ['eslint', '@nuxt/eslint', '@eslint/js'] },
    vitest: { deps: [], devDeps: ['vitest', '@nuxt/test-utils', '@vitejs/plugin-react'] },
    supabase: { deps: ['@supabase/supabase-js', '@nuxtjs/supabase'], devDeps: [] },
    zustand: { deps: ['zustand'], devDeps: [] },
    docker: { deps: [], devDeps: [] },
  };

  // Known module -> env var mapping
  const moduleEnvMap: Record<string, string[]> = {
    prisma: ['DATABASE_URL'],
    'better-auth': ['BETTER_AUTH_SECRET', 'BETTER_AUTH_URL'],
    stripe: ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY', 'STRIPE_WEBHOOK_SECRET'],
    supabase: ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'NUXT_PUBLIC_SUPABASE_URL', 'NUXT_PUBLIC_SUPABASE_KEY'],
  };

  // Known module -> files mapping
  const moduleFilesMap: Record<string, string[]> = {
    prisma: ['prisma/'],
    docker: ['Dockerfile', 'docker-compose.yml', '.dockerignore'],
    vitest: ['vitest.config.ts'],
    eslint: ['eslint.config.mjs', '.eslintrc.js', '.eslintrc.json'],
    shadcn: ['components.json'],
  };

  for (const moduleId of moduleIds) {
    // Dependencies
    const deps = moduleDepsMap[moduleId];
    if (deps) {
      depsToRemove.push(...deps.deps);
      devDepsToRemove.push(...deps.devDeps);
    }

    // Env vars
    const envVars = moduleEnvMap[moduleId];
    if (envVars) {
      envVarsToRemove.push(...envVars);
    }

    // Files
    const files = moduleFilesMap[moduleId];
    if (files) {
      for (const file of files) {
        const fullPath = path.join(projectPath, file);
        if (await fs.pathExists(fullPath)) {
          filesToRemove.push(file);
        }
      }
    }
  }

  return { filesToRemove, depsToRemove, devDepsToRemove, envVarsToRemove };
}

function printRemovalPlan(plan: RemovalPlan, modules: string[]): void {
  console.log(`  Modules: ${modules.join(', ')}`);

  if (plan.filesToRemove.length > 0) {
    console.log('');
    console.log('  Files to remove:');
    for (const f of plan.filesToRemove) {
      console.log(`    \x1b[31m- ${f}\x1b[0m`);
    }
  }

  if (plan.depsToRemove.length > 0 || plan.devDepsToRemove.length > 0) {
    console.log('');
    console.log('  Dependencies to remove:');
    for (const d of [...plan.depsToRemove, ...plan.devDepsToRemove]) {
      console.log(`    \x1b[31m- ${d}\x1b[0m`);
    }
  }

  if (plan.envVarsToRemove.length > 0) {
    console.log('');
    console.log('  Environment variables to remove:');
    for (const e of plan.envVarsToRemove) {
      console.log(`    \x1b[31m- ${e}\x1b[0m`);
    }
  }

  console.log('');
}
