import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import ora from 'ora';

import { frameworkRegistry } from '../core/framework-registry';
import { presets } from '../presets';

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

interface SyncOptions {
  apiUrl?: string;
  apiKey?: string;
}

function getTemplatesPath(): string {
  const devPath = path.join(__dirname, '..', 'templates');
  const prodPath = path.join(__dirname, 'templates');
  return fs.existsSync(devPath) ? devPath : prodPath;
}

function readDirectoryTree(dirPath: string, source?: string): TreeNode[] {
  if (!fs.existsSync(dirPath)) return [];

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree: TreeNode[] = [];

  for (const item of items) {
    if (
      item.name.startsWith('.') ||
      item.name.startsWith('_') ||
      item.name === 'install.sh' ||
      item.name === 'setup.sh'
    ) {
      continue;
    }

    const node: TreeNode = {
      name: item.name,
      type: item.isDirectory() ? 'folder' : 'file',
    };

    if (source) node.source = source;

    if (item.isDirectory()) {
      node.children = readDirectoryTree(path.join(dirPath, item.name), source);
    }

    tree.push(node);
  }

  return tree.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

function collectFiles(
  dirPath: string,
  basePath: string = '',
  source?: string
): Array<{ path: string; content: string; source?: string }> {
  if (!fs.existsSync(dirPath)) return [];

  const files: Array<{ path: string; content: string; source?: string }> = [];
  const items = fs.readdirSync(dirPath, { withFileTypes: true });

  for (const item of items) {
    if (
      item.name.startsWith('.') ||
      item.name.startsWith('_') ||
      item.name === 'install.sh' ||
      item.name === 'setup.sh'
    ) {
      continue;
    }

    const fullPath = path.join(dirPath, item.name);
    const relativePath = basePath ? `${basePath}/${item.name}` : item.name;

    if (item.isDirectory()) {
      files.push(...collectFiles(fullPath, relativePath, source));
    } else {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        files.push({ path: relativePath, content, source });
      } catch {
        // Skip binary files
      }
    }
  }

  return files;
}

export const syncCommand = new Command('sync')
  .description('Sync templates to cache (Redis)')
  .option('-u, --api-url <url>', 'API URL', 'http://localhost:3000')
  .option('-k, --api-key <key>', 'API Key')
  .action(async (options: SyncOptions) => {
    const spinner = ora('Synchronisation des templates...').start();

    const frameworks = frameworkRegistry.getAll();
    const templatesPath = getTemplatesPath();

    const syncData: {
      bases: Array<{ framework: string; tree: TreeNode }>;
      modules: Array<{ framework: string; moduleId: string; tree: TreeNode }>;
      files: Array<{ framework: string; path: string; content: string; module?: string }>;
      presets: Array<{ id: string; name: string; description: string; frameworks: string[]; modules: string[] }>;
    } = {
      bases: [],
      modules: [],
      files: [],
      presets: [],
    };

    for (const framework of frameworks) {
      spinner.text = `Traitement de ${framework.name}...`;

      const basePath = path.join(templatesPath, framework.id, 'base');
      const modulesPath = path.join(templatesPath, framework.id, 'modules');

      // Arbre de base
      const baseTree = readDirectoryTree(basePath);
      syncData.bases.push({
        framework: framework.id,
        tree: { name: 'project', type: 'folder', children: baseTree },
      });

      // Fichiers de base
      const baseFiles = collectFiles(basePath);
      for (const file of baseFiles) {
        syncData.files.push({
          framework: framework.id,
          path: file.path,
          content: file.content,
        });
      }

      // Arbres et fichiers des modules
      const moduleIds = framework.modules.map(m => m.id);
      for (const moduleId of moduleIds) {
        const modulePath = path.join(modulesPath, moduleId);

        // Arbre du module
        const moduleTree = readDirectoryTree(modulePath, moduleId);
        if (moduleTree.length > 0) {
          syncData.modules.push({
            framework: framework.id,
            moduleId,
            tree: { name: moduleId, type: 'folder', children: moduleTree },
          });
        }

        // Fichiers du module
        const moduleFiles = collectFiles(modulePath, '', moduleId);
        for (const file of moduleFiles) {
          syncData.files.push({
            framework: framework.id,
            path: file.path,
            content: file.content,
            module: moduleId,
          });
        }
      }
    }

    // Presets
    spinner.text = 'Collecte des presets...';
    for (const [id, preset] of Object.entries(presets)) {
      syncData.presets.push({
        id,
        name: preset.name,
        description: preset.description,
        frameworks: Array.isArray(preset.framework) ? preset.framework : [preset.framework],
        modules: preset.modules,
      });
    }

    spinner.text = 'Envoi des données au serveur...';

    try {
      const response = await fetch(`${options.apiUrl}/api/cli/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(options.apiKey ? { 'x-api-key': options.apiKey } : {}),
        },
        body: JSON.stringify(syncData),
      });

      const result = await response.json();

      if (result.success) {
        spinner.succeed(
          `Synchronisation terminée: ${syncData.bases.length} bases, ${syncData.modules.length} modules, ${syncData.files.length} fichiers, ${syncData.presets.length} presets`
        );
      } else {
        spinner.fail(`Erreur: ${result.error}`);
      }
    } catch (err) {
      spinner.fail(`Erreur de connexion: ${(err as Error).message}`);
    }
  });
