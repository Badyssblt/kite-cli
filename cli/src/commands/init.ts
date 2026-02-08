import { Command } from 'commander';
import ora from 'ora';

import { detectService } from '../services/detect.service';
import { manifestService, type PackageManager } from '../services/manifest.service';
import { promptService } from '../services/prompt.service';

export const initCommand = new Command('init')
  .description('Initialize Kite tracking for an existing project')
  .option('--force', 'Overwrite existing manifest')
  .option('--json', 'Output as JSON')
  .action(async (options: { force?: boolean; json?: boolean }) => {
    const projectPath = process.cwd();

    // Check if manifest already exists
    if (manifestService.exists(projectPath) && !options.force) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'Manifest already exists. Use --force to overwrite.' }));
      } else {
        console.log('.kite/manifest.json already exists. Use --force to reinitialize.');
      }
      return;
    }

    // Detect framework
    const spinner = options.json ? null : ora('Detecting project...').start();
    const detection = detectService.detectFramework(projectPath);

    if (!detection) {
      spinner?.fail('No framework detected');
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'No framework detected' }));
      } else {
        console.log('Make sure you are in a Nuxt or Next.js project directory.');
      }
      return;
    }

    const frameworkId = detection.framework.id;
    spinner?.succeed(`Detected ${detection.framework.name}`);

    // Detect installed modules
    const installedModules = detectService.detectInstalledModules(projectPath, frameworkId);

    if (installedModules.length > 0 && !options.json) {
      console.log('');
      console.log('📦 Detected modules:', installedModules.join(', '));
    }

    // Detect package manager
    const detectedPm = manifestService.detectPackageManager(projectPath);
    if (!options.json) {
      console.log(`📦 Package manager: ${detectedPm}`);
    }

    // Create manifest
    const manifest = manifestService.create(
      projectPath,
      frameworkId,
      installedModules,
      {},
      detectedPm
    );

    if (options.json) {
      console.log(JSON.stringify({ success: true, manifest }));
    } else {
      console.log('');
      console.log('✓ Created .kite/manifest.json');
      console.log(`  Framework:       ${detection.framework.name}`);
      console.log(`  Modules:         ${installedModules.length > 0 ? installedModules.join(', ') : 'none'}`);
      console.log(`  Package manager: ${detectedPm}`);
      console.log('');
    }
  });
