#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';
import { addCommand } from './commands/add';

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
  .version('1.0.0');

program.addCommand(createCommand);
program.addCommand(addCommand);
program.parse(process.argv);
