import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

import { frameworkRegistry } from '../core/framework-registry';
import { moduleRegistry } from '../core/module-registry';
import { detectService } from '../services/detect.service';
import { manifestService } from '../services/manifest.service';

export const infoCommand = new Command('info')
  .description('Show detailed information about a module')
  .argument('<module>', 'Module ID to inspect')
  .option('-f, --framework <framework>', 'Framework ID (auto-detected if in a project)')
  .option('--json', 'Output as JSON')
  .action(async (moduleId: string, options: { framework?: string; json?: boolean }) => {
    // Determine framework
    let frameworkId = options.framework;

    if (!frameworkId) {
      const detection = detectService.detectFramework(process.cwd());
      if (detection) {
        frameworkId = detection.framework.id;
      }
    }

    if (!frameworkId) {
      // Try both frameworks
      for (const fwId of frameworkRegistry.getIds()) {
        if (moduleRegistry.has(fwId, moduleId)) {
          frameworkId = fwId;
          break;
        }
      }
    }

    if (!frameworkId) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: `Module "${moduleId}" not found` }));
      } else {
        console.error(`Module "${moduleId}" not found. Specify a framework with -f.`);
      }
      return;
    }

    const moduleDef = moduleRegistry.get(frameworkId, moduleId);
    if (!moduleDef) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: `Module "${moduleId}" not found for ${frameworkId}` }));
      } else {
        console.error(`Module "${moduleId}" not found for framework "${frameworkId}".`);
        console.log('Available modules:');
        moduleRegistry.getAll(frameworkId).forEach(m => console.log(`  - ${m.id}`));
      }
      return;
    }

    // Collect file list from template
    const templatesPath = path.join(__dirname, '..', 'templates');
    const modulePath = path.join(templatesPath, frameworkId, 'modules', moduleId);
    const files = await collectModuleFiles(modulePath);

    // Check if installed
    const projectPath = process.cwd();
    const manifest = manifestService.read(projectPath);
    const isInstalled = manifest
      ? manifest.modules.some(m => m.id === moduleId)
      : detectService.detectInstalledModules(projectPath, frameworkId).includes(moduleId);

    // Get dependents (modules that depend on this one)
    const dependents = moduleRegistry.getAll(frameworkId)
      .filter(m => m.dependsOn?.includes(moduleId))
      .map(m => m.id);

    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        module: {
          id: moduleDef.id,
          name: moduleDef.name,
          description: moduleDef.description || '',
          framework: frameworkId,
          installed: isInstalled,
          dependsOn: moduleDef.dependsOn || [],
          requiredBy: dependents,
          prompts: (moduleDef.prompts || []).map(p => ({
            id: p.id,
            type: p.type,
            message: p.message,
          })),
          files,
          hasInstallScript: fs.existsSync(path.join(modulePath, 'install.sh')),
          hasSetupScript: moduleDef.hasSetupScript || false,
          instructions: moduleDef.instructions || null,
        },
      }));
      return;
    }

    // Display
    const fw = frameworkRegistry.get(frameworkId);
    console.log('');
    console.log(`  \x1b[1m${moduleDef.name}\x1b[0m (${moduleDef.id})`);
    console.log(`  Framework: ${fw?.name || frameworkId}`);
    if (moduleDef.description) {
      console.log(`  ${moduleDef.description}`);
    }
    console.log(`  Status: ${isInstalled ? '\x1b[32minstalled\x1b[0m' : '\x1b[90mnot installed\x1b[0m'}`);

    // Dependencies
    if (moduleDef.dependsOn && moduleDef.dependsOn.length > 0) {
      console.log('');
      console.log('  Dependencies:');
      for (const dep of moduleDef.dependsOn) {
        const depMod = moduleRegistry.get(frameworkId, dep);
        console.log(`    → ${depMod?.name || dep} (${dep})`);
      }
    }

    // Required by
    if (dependents.length > 0) {
      console.log('');
      console.log('  Required by:');
      for (const dep of dependents) {
        const depMod = moduleRegistry.get(frameworkId, dep);
        console.log(`    ← ${depMod?.name || dep} (${dep})`);
      }
    }

    // Prompts
    if (moduleDef.prompts && moduleDef.prompts.length > 0) {
      console.log('');
      console.log('  Configuration prompts:');
      for (const prompt of moduleDef.prompts) {
        console.log(`    ? ${prompt.message}`);
        if (prompt.choices) {
          for (const choice of prompt.choices) {
            console.log(`      - ${choice.name} (${choice.value})`);
          }
        }
      }
    }

    // Files
    if (files.length > 0) {
      console.log('');
      console.log('  Template files:');
      for (const file of files.slice(0, 15)) {
        console.log(`    ${file}`);
      }
      if (files.length > 15) {
        console.log(`    ... and ${files.length - 15} more`);
      }
    }

    // Instructions
    if (moduleDef.instructions) {
      console.log('');
      console.log('  Setup instructions:');
      console.log(`    ${moduleDef.instructions.title}`);
      for (const step of moduleDef.instructions.steps) {
        console.log(`    ${step}`);
      }
      if (moduleDef.instructions.links?.length) {
        console.log(`    Docs: ${moduleDef.instructions.links[0]}`);
      }
    }

    console.log('');
  });

async function collectModuleFiles(modulePath: string, prefix = ''): Promise<string[]> {
  const files: string[] = [];
  if (!await fs.pathExists(modulePath)) return files;

  const entries = await fs.readdir(modulePath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '_variants' || entry.name === '_fragments') continue;
    if (entry.name === 'install.sh' || entry.name === 'setup.sh') continue;

    const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      const subFiles = await collectModuleFiles(path.join(modulePath, entry.name), relativePath);
      files.push(...subFiles);
    } else {
      files.push(relativePath);
    }
  }
  return files;
}
