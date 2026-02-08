import { Command } from 'commander';
import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { detectService } from '../services/detect.service';
import { manifestService } from '../services/manifest.service';

export const listCommand = new Command('list')
  .alias('ls')
  .description('List available and installed modules')
  .option('--json', 'Output as JSON')
  .action(async (options: { json?: boolean }) => {
    const projectPath = process.cwd();

    // Detect framework
    const detection = detectService.detectFramework(projectPath);
    if (!detection) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'No framework detected' }));
      } else {
        console.error('Could not detect project framework.');
        console.log('Make sure you are in a Nuxt or Next.js project directory.');
      }
      return;
    }

    const frameworkId = detection.framework.id;
    const frameworkName = detection.framework.name;

    // Get installed modules from manifest first, fallback to detection
    const manifest = manifestService.read(projectPath);
    const installedModules = manifest
      ? manifest.modules.map(m => m.id)
      : detectService.detectInstalledModules(projectPath, frameworkId);

    const allModules = moduleRegistry.getAll(frameworkId);

    if (options.json) {
      const result = allModules.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description || '',
        installed: installedModules.includes(m.id),
        dependsOn: m.dependsOn || [],
      }));
      console.log(JSON.stringify({ success: true, framework: frameworkId, modules: result }));
      return;
    }

    console.log(`\n  ${frameworkName} modules\n`);

    // Calculate column widths
    const maxIdLen = Math.max(...allModules.map(m => m.id.length), 6);
    const maxNameLen = Math.max(...allModules.map(m => m.name.length), 4);

    // Header
    const header = `  ${'Module'.padEnd(maxIdLen + 2)}${'Name'.padEnd(maxNameLen + 2)}${'Status'.padEnd(14)}Dependencies`;
    const separator = `  ${'─'.repeat(header.length)}`;

    console.log(header);
    console.log(separator);

    for (const mod of allModules) {
      const isInstalled = installedModules.includes(mod.id);
      const status = isInstalled ? '\x1b[32m● installed\x1b[0m' : '\x1b[90m○ available\x1b[0m';
      const deps = (mod.dependsOn || []).join(', ') || '–';
      const id = mod.id.padEnd(maxIdLen + 2);
      const name = mod.name.padEnd(maxNameLen + 2);

      console.log(`  ${id}${name}${status.padEnd(14 + 9)}${deps}`);
    }

    const installedCount = installedModules.length;
    const totalCount = allModules.length;
    console.log(`\n  ${installedCount}/${totalCount} modules installed\n`);
  });
