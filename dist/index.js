#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const create_1 = require("./commands/create");
const add_1 = require("./commands/add");
// Import et enregistrement des frameworks
const framework_registry_1 = require("./core/framework-registry");
const nuxt_1 = require("./frameworks/nuxt");
const nextjs_1 = require("./frameworks/nextjs");
// Enregistrer les frameworks disponibles
framework_registry_1.frameworkRegistry.register(nuxt_1.nuxtFramework.toDefinition());
framework_registry_1.frameworkRegistry.register(nextjs_1.nextJsFramework.toDefinition());
const program = new commander_1.Command();
program
    .name('kite')
    .description('CLI de scaffolding pour créer des projets web modernes')
    .version('1.0.0');
program.addCommand(create_1.createCommand);
program.addCommand(add_1.addCommand);
program.parse(process.argv);
