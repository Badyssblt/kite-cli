#!/usr/bin/env node


import { Command } from 'commander';
import { createCommand } from './commands/create';

const program = new Command();

program
    .name('mycli')
    .description('An example CLI application')
    .version('1.0.0');


program.addCommand(createCommand)
program.parse(process.argv);