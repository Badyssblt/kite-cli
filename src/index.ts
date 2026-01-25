#!/usr/bin/env node

import { Command } from 'commander';
import { createCommand } from './commands/create';

// Import et enregistrement des frameworks
import { frameworkRegistry } from './core/framework-registry';
import { nuxtFramework } from './frameworks/nuxt';

// Enregistrer les frameworks disponibles
frameworkRegistry.register(nuxtFramework.toDefinition());

const program = new Command();

program
  .name('kite')
  .description('CLI de scaffolding pour créer des projets web modernes')
  .version('1.0.0');

program.addCommand(createCommand);
program.parse(process.argv);
