#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { addCommand } from './commands/add';
import { removeCommand } from './commands/remove';
import { listCommand } from './commands/list';
import { infoCommand } from './commands/info';
import { doctorCommand } from './commands/doctor';
import { previewCommand } from './commands/preview';
import { fileContentCommand } from './commands/file-content';
import { syncCommand } from './commands/sync';
import { initCommand } from './commands/init';
import { setVerbose } from './utils/debug';

// Import et enregistrement des frameworks
import { frameworkRegistry } from './core/framework-registry';
import { nuxtFramework } from './frameworks/nuxt';
import { nextJsFramework } from './frameworks/nextjs';

// Enregistrer les frameworks disponibles
frameworkRegistry.register(nuxtFramework.toDefinition());
frameworkRegistry.register(nextJsFramework.toDefinition());

const program = new Command();

program
  .name('kite')
  .description('CLI de scaffolding pour créer des projets web modernes')
  .version('1.0.0')
  .option('--verbose', 'Enable verbose debug output')
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.verbose) {
      setVerbose(true);
    }
  });

// Core commands
program.addCommand(createCommand);
program.addCommand(addCommand);
program.addCommand(removeCommand);
program.addCommand(listCommand);
program.addCommand(infoCommand);
program.addCommand(doctorCommand);

// Utility commands
program.addCommand(previewCommand);
program.addCommand(initCommand);
program.addCommand(fileContentCommand);
program.addCommand(syncCommand);

program.parse(process.argv);
