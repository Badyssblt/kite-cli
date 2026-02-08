import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { detectService } from '../services/detect.service';
import { manifestService } from '../services/manifest.service';

interface DiagnosticResult {
  label: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export const doctorCommand = new Command('doctor')
  .description('Diagnose project health and module consistency')
  .option('--json', 'Output as JSON')
  .action(async (options: { json?: boolean }) => {
    const projectPath = process.cwd();
    const results: DiagnosticResult[] = [];

    // 1. Framework detection
    const detection = detectService.detectFramework(projectPath);
    if (!detection) {
      results.push({
        label: 'Framework',
        status: 'error',
        message: 'No framework detected (missing nuxt.config.ts or next.config.ts)',
      });

      if (options.json) {
        console.log(JSON.stringify({ success: true, results }));
      } else {
        printResults(results);
      }
      return;
    }

    const frameworkId = detection.framework.id;
    results.push({
      label: 'Framework',
      status: 'ok',
      message: `${detection.framework.name} detected (${detection.configFile})`,
    });

    // 2. Manifest check
    const manifest = manifestService.read(projectPath);
    if (manifest) {
      results.push({
        label: 'Manifest',
        status: 'ok',
        message: `.kite/manifest.json found (v${manifest.version})`,
      });

      // Check framework consistency
      if (manifest.framework !== frameworkId) {
        results.push({
          label: 'Manifest sync',
          status: 'error',
          message: `Manifest says "${manifest.framework}" but detected "${frameworkId}"`,
        });
      }
    } else {
      results.push({
        label: 'Manifest',
        status: 'warn',
        message: 'No .kite/manifest.json found. Run "kite init" to create one.',
      });
    }

    // 3. Package.json check
    const pkgPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
      results.push({
        label: 'package.json',
        status: 'ok',
        message: 'Found',
      });
    } else {
      results.push({
        label: 'package.json',
        status: 'error',
        message: 'Missing package.json',
      });
    }

    // 4. Node modules check
    const nodeModulesPath = path.join(projectPath, 'node_modules');
    if (fs.existsSync(nodeModulesPath)) {
      results.push({
        label: 'node_modules',
        status: 'ok',
        message: 'Dependencies installed',
      });
    } else {
      results.push({
        label: 'node_modules',
        status: 'warn',
        message: 'node_modules not found. Run your package manager install.',
      });
    }

    // 5. Package manager detection
    const detectedPm = manifestService.detectPackageManager(projectPath);
    const manifestPm = manifest?.packageManager;
    if (manifestPm && manifestPm !== detectedPm) {
      results.push({
        label: 'Package manager',
        status: 'warn',
        message: `Manifest says "${manifestPm}" but lockfile suggests "${detectedPm}"`,
      });
    } else {
      results.push({
        label: 'Package manager',
        status: 'ok',
        message: detectedPm,
      });
    }

    // 6. Module checks
    const installedModules = manifest
      ? manifest.modules.map(m => m.id)
      : detectService.detectInstalledModules(projectPath, frameworkId);

    const detectedModules = detectService.detectInstalledModules(projectPath, frameworkId);

    // Check for modules in manifest but not detected
    if (manifest) {
      for (const mod of manifest.modules) {
        if (!detectedModules.includes(mod.id)) {
          results.push({
            label: `Module: ${mod.id}`,
            status: 'warn',
            message: 'In manifest but not detected in project (possibly removed manually)',
          });
        }
      }

      // Check for detected modules not in manifest
      for (const detected of detectedModules) {
        if (!installedModules.includes(detected)) {
          results.push({
            label: `Module: ${detected}`,
            status: 'warn',
            message: 'Detected in project but not tracked in manifest',
          });
        }
      }
    }

    // Check each installed module
    for (const moduleId of installedModules) {
      const moduleDef = moduleRegistry.get(frameworkId, moduleId);
      if (!moduleDef) {
        results.push({
          label: `Module: ${moduleId}`,
          status: 'warn',
          message: 'Unknown module (not in registry)',
        });
        continue;
      }

      // Check dependencies are satisfied
      if (moduleDef.dependsOn) {
        for (const dep of moduleDef.dependsOn) {
          if (!installedModules.includes(dep)) {
            results.push({
              label: `Module: ${moduleId}`,
              status: 'error',
              message: `Missing dependency "${dep}"`,
            });
          }
        }
      }
    }

    // 7. Env file check
    const envPath = path.join(projectPath, '.env');
    const envExamplePath = path.join(projectPath, '.env.example');

    if (fs.existsSync(envExamplePath)) {
      if (fs.existsSync(envPath)) {
        // Check for missing env vars
        const exampleContent = fs.readFileSync(envExamplePath, 'utf-8');
        const envContent = fs.readFileSync(envPath, 'utf-8');

        const exampleVars = parseEnvKeys(exampleContent);
        const envVars = parseEnvKeys(envContent);
        const missing = exampleVars.filter(k => !envVars.includes(k));

        if (missing.length > 0) {
          results.push({
            label: '.env',
            status: 'warn',
            message: `Missing variables from .env.example: ${missing.join(', ')}`,
          });
        } else {
          results.push({
            label: '.env',
            status: 'ok',
            message: 'All .env.example variables are defined',
          });
        }
      } else {
        results.push({
          label: '.env',
          status: 'warn',
          message: '.env.example exists but .env is missing. Copy it with: cp .env.example .env',
        });
      }
    }

    // 8. Docker check (if docker module installed)
    if (installedModules.includes('docker')) {
      const composePath = path.join(projectPath, 'docker-compose.yml');
      const dockerfilePath = path.join(projectPath, 'Dockerfile');

      if (!fs.existsSync(composePath)) {
        results.push({
          label: 'Docker',
          status: 'error',
          message: 'Docker module installed but docker-compose.yml is missing',
        });
      }
      if (!fs.existsSync(dockerfilePath)) {
        results.push({
          label: 'Docker',
          status: 'error',
          message: 'Docker module installed but Dockerfile is missing',
        });
      }
      if (fs.existsSync(composePath) && fs.existsSync(dockerfilePath)) {
        results.push({
          label: 'Docker',
          status: 'ok',
          message: 'Dockerfile and docker-compose.yml present',
        });
      }
    }

    // Output
    if (options.json) {
      console.log(JSON.stringify({ success: true, framework: frameworkId, results }));
    } else {
      printResults(results);
    }
  });

function parseEnvKeys(content: string): string[] {
  return content
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#'))
    .map(l => l.split('=')[0]?.trim())
    .filter((k): k is string => !!k);
}

function printResults(results: DiagnosticResult[]): void {
  console.log('\n  Kite Doctor\n');

  const icons = {
    ok: '\x1b[32m✓\x1b[0m',
    warn: '\x1b[33m⚠\x1b[0m',
    error: '\x1b[31m✗\x1b[0m',
  };

  for (const r of results) {
    console.log(`  ${icons[r.status]} ${r.label}: ${r.message}`);
  }

  const errors = results.filter(r => r.status === 'error').length;
  const warnings = results.filter(r => r.status === 'warn').length;

  console.log('');
  if (errors === 0 && warnings === 0) {
    console.log('  \x1b[32mAll checks passed!\x1b[0m');
  } else {
    if (errors > 0) console.log(`  \x1b[31m${errors} error(s)\x1b[0m`);
    if (warnings > 0) console.log(`  \x1b[33m${warnings} warning(s)\x1b[0m`);
  }
  console.log('');
}
