"use strict";
// Service d'interaction utilisateur (prompts)
Object.defineProperty(exports, "__esModule", { value: true });
exports.promptService = exports.PromptService = void 0;
const prompts_1 = require("@inquirer/prompts");
const inquirer_select_pro_1 = require("inquirer-select-pro");
const framework_registry_1 = require("../core/framework-registry");
const module_registry_1 = require("../core/module-registry");
class PromptService {
    // Demander le nom du projet
    async askProjectName(defaultName = 'mon-projet') {
        return (0, prompts_1.input)({
            message: 'Nom du projet:',
            default: defaultName
        });
    }
    // Demander le choix du framework
    async askFramework() {
        const choices = framework_registry_1.frameworkRegistry.getChoices();
        return (0, prompts_1.select)({
            message: 'Choisissez une stack:',
            choices
        });
    }
    // Demander les modules à installer
    async askModules(frameworkId) {
        const choices = framework_registry_1.frameworkRegistry.getModuleChoices(frameworkId);
        return (0, inquirer_select_pro_1.select)({
            message: 'Choisissez les modules à installer:',
            multiple: true,
            options: choices
        });
    }
    // Demander les modules à ajouter à un projet existant
    async askModulesToAdd(choices) {
        return (0, inquirer_select_pro_1.select)({
            message: 'Choose modules to add:',
            multiple: true,
            options: choices
        });
    }
    // Demander les questions spécifiques à chaque module
    async askModuleQuestions(selectedModules, installedModules = []) {
        const answers = {};
        const allModules = [...installedModules, ...selectedModules];
        for (const moduleId of selectedModules) {
            const module = module_registry_1.moduleRegistry.get(moduleId);
            if (!module?.prompts || module.prompts.length === 0)
                continue;
            const moduleAnswers = {};
            const context = { selectedModules: allModules, answers };
            console.log(`\n⚙️  Configuration de ${module.name}:`);
            for (const prompt of module.prompts) {
                // Vérifier la condition d'affichage
                if (prompt.when && !prompt.when(context))
                    continue;
                const answer = await this.askPrompt(prompt);
                moduleAnswers[prompt.id] = answer;
                // Mettre à jour le context pour les questions suivantes
                answers[moduleId] = moduleAnswers;
            }
            if (Object.keys(moduleAnswers).length > 0) {
                answers[moduleId] = moduleAnswers;
            }
        }
        return answers;
    }
    // Poser une question selon son type
    async askPrompt(prompt) {
        switch (prompt.type) {
            case 'select':
                return (0, prompts_1.select)({
                    message: prompt.message,
                    choices: prompt.choices?.map(c => ({
                        name: c.name,
                        value: c.value,
                        description: c.description
                    })) || [],
                    default: prompt.default
                });
            case 'input':
                return (0, prompts_1.input)({
                    message: prompt.message,
                    default: prompt.default
                });
            case 'confirm':
                return (0, prompts_1.confirm)({
                    message: prompt.message,
                    default: prompt.default ?? true
                });
            default:
                return '';
        }
    }
    // Demander confirmation pour installer les dépendances
    async askInstallDependencies() {
        return (0, prompts_1.confirm)({
            message: 'Installer les dépendances ?',
            default: true
        });
    }
    // Afficher un message
    log(message) {
        console.log(message);
    }
}
exports.PromptService = PromptService;
exports.promptService = new PromptService();
