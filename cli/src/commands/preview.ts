import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

import { frameworkRegistry } from '../core/framework-registry';
import { dependencyService } from '../services/dependency.service';

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string; // Which module added this (undefined = base)
  children?: TreeNode[];
}

interface PreviewOptions {
  framework: string;
  modules?: string;
  json?: boolean;
}

function getTemplatesPath(): string {
  // En dev: cli/src/templates, en prod: cli/dist/templates
  const devPath = path.join(__dirname, '..', 'templates');
  const prodPath = path.join(__dirname, 'templates');

  if (fs.existsSync(devPath)) return devPath;
  return prodPath;
}

function readDirectoryTree(dirPath: string, source?: string): TreeNode[] {
  if (!fs.existsSync(dirPath)) return [];

  const items = fs.readdirSync(dirPath, { withFileTypes: true });
  const tree: TreeNode[] = [];

  for (const item of items) {
    // Skip hidden files, internal folders and specific files
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

    if (source) {
      node.source = source;
    }

    if (item.isDirectory()) {
      const childPath = path.join(dirPath, item.name);
      node.children = readDirectoryTree(childPath, source);
    }

    tree.push(node);
  }

  return tree.sort((a, b) => {
    // Folders first, then files, alphabetically
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

function mergeTreeNodes(base: TreeNode[], additions: TreeNode[]): TreeNode[] {
  const result = [...base];

  for (const addNode of additions) {
    const existingIndex = result.findIndex(n => n.name === addNode.name);

    if (existingIndex === -1) {
      // Node doesn't exist, add it
      result.push(addNode);
    } else if (addNode.type === 'folder' && result[existingIndex].type === 'folder') {
      // Merge folder children
      result[existingIndex].children = mergeTreeNodes(
        result[existingIndex].children || [],
        addNode.children || []
      );
    }
    // If file exists, keep the base version (or could override with module version)
  }

  return result.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

export const previewCommand = new Command('preview')
  .description('Preview the project file tree')
  .requiredOption('-f, --framework <framework>', 'Framework ID (nuxt, nextjs)')
  .option('-m, --modules <modules>', 'Comma-separated list of module IDs')
  .option('--json', 'Output result as JSON')
  .action(async (options: PreviewOptions) => {
    const framework = frameworkRegistry.get(options.framework);

    if (!framework) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: `Framework "${options.framework}" not found` }));
      } else {
        console.error(`Framework "${options.framework}" non trouvé`);
      }
      return;
    }

    // Parse modules
    const selectedModules = options.modules
      ? options.modules.split(',').map(m => m.trim()).filter(Boolean)
      : [];

    // Resolve dependencies
    const modules = dependencyService.resolveDependencies(options.framework, selectedModules);

    const templatesPath = getTemplatesPath();
    const basePath = path.join(templatesPath, options.framework, 'base');

    // Read base tree
    let tree = readDirectoryTree(basePath);

    // Merge module trees
    for (const moduleId of modules) {
      const modulePath = path.join(templatesPath, options.framework, 'modules', moduleId);
      const moduleTree = readDirectoryTree(modulePath, moduleId);
      tree = mergeTreeNodes(tree, moduleTree);
    }

    const result = {
      success: true,
      framework: options.framework,
      modules,
      tree: {
        name: 'project',
        type: 'folder' as const,
        children: tree
      }
    };

    if (options.json) {
      console.log(JSON.stringify(result));
    } else {
      // Pretty print tree
      console.log('\n📁 Project structure:\n');
      printTree(result.tree, '');
    }
  });

function printTree(node: TreeNode, indent: string): void {
  const icon = node.type === 'folder' ? '📁' : '📄';
  const source = node.source ? ` (${node.source})` : '';
  console.log(`${indent}${icon} ${node.name}${source}`);

  if (node.children) {
    for (const child of node.children) {
      printTree(child, indent + '  ');
    }
  }
}
