import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';

import { frameworkRegistry } from '../core/framework-registry';

interface FileContentOptions {
  framework: string;
  path: string;
  module?: string;
  json?: boolean;
}

function getTemplatesPath(): string {
  const devPath = path.join(__dirname, '..', 'templates');
  const prodPath = path.join(__dirname, 'templates');
  return fs.existsSync(devPath) ? devPath : prodPath;
}

function getFileLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.vue': 'vue',
    '.json': 'json',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.md': 'markdown',
    '.prisma': 'prisma',
    '.yml': 'yaml',
    '.yaml': 'yaml',
    '.env': 'shell',
    '.sh': 'shell',
  };
  return languageMap[ext] || 'text';
}

export const fileContentCommand = new Command('file-content')
  .description('Get the content of a template file')
  .requiredOption('-f, --framework <framework>', 'Framework ID')
  .requiredOption('-p, --path <path>', 'File path relative to project root')
  .option('-m, --module <module>', 'Module that provides this file')
  .option('--json', 'Output as JSON')
  .action(async (options: FileContentOptions) => {
    const framework = frameworkRegistry.get(options.framework);

    if (!framework) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'Framework not found' }));
      } else {
        console.error('Framework not found');
      }
      return;
    }

    const templatesPath = getTemplatesPath();
    let filePath: string;

    if (options.module) {
      filePath = path.join(templatesPath, options.framework, 'modules', options.module, options.path);
    } else {
      filePath = path.join(templatesPath, options.framework, 'base', options.path);
    }

    if (!fs.existsSync(filePath)) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: 'File not found' }));
      } else {
        console.error('File not found');
      }
      return;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const language = getFileLanguage(options.path);

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          path: options.path,
          language,
          content,
        }));
      } else {
        console.log(content);
      }
    } catch (err) {
      if (options.json) {
        console.log(JSON.stringify({ success: false, error: (err as Error).message }));
      } else {
        console.error(err);
      }
    }
  });
