"use strict";
// Service de gestion des fragments de fichiers (générique)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fragmentService = exports.FragmentService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const yaml_1 = __importDefault(require("yaml"));
/**
 * Service générique pour fusionner les fragments de fichiers
 * Supporte différents types de fichiers et stratégies de merge
 */
class FragmentService {
    /**
     * Traite tous les fragments d'un module
     */
    async processModuleFragments(modulePath, projectPath, moduleId, fragments, context) {
        for (const fragment of fragments) {
            if (this.shouldProcessFragment(fragment, moduleId, context)) {
                await this.processFragment(modulePath, projectPath, moduleId, fragment);
            }
        }
    }
    /**
     * Vérifie si un fragment doit être traité selon ses conditions
     */
    shouldProcessFragment(fragment, moduleId, context) {
        // Condition sur module
        if (fragment.ifModule) {
            if (!context.selectedModules.includes(fragment.ifModule)) {
                return false;
            }
        }
        // Condition sur réponse de prompt
        if (fragment.ifPrompt) {
            const answers = context.moduleAnswers[moduleId];
            if (!answers)
                return false;
            const answerValue = answers[fragment.ifPrompt.id];
            const expectedValues = Array.isArray(fragment.ifPrompt.value)
                ? fragment.ifPrompt.value
                : [fragment.ifPrompt.value];
            if (!expectedValues.includes(String(answerValue))) {
                return false;
            }
        }
        return true;
    }
    /**
     * Traite un fragment individuel
     */
    async processFragment(modulePath, projectPath, moduleId, fragment) {
        const sourcePath = path_1.default.join(modulePath, fragment.source);
        const targetPath = path_1.default.join(projectPath, fragment.target);
        // Vérifier que le fichier source existe
        if (!(await fs_extra_1.default.pathExists(sourcePath))) {
            console.warn(`Fragment source not found: ${sourcePath}`);
            return;
        }
        // Lire le contenu du fragment
        const fragmentContent = await fs_extra_1.default.readFile(sourcePath, 'utf-8');
        // Créer le fichier cible s'il n'existe pas
        if (!(await fs_extra_1.default.pathExists(targetPath))) {
            await fs_extra_1.default.ensureDir(path_1.default.dirname(targetPath));
            await fs_extra_1.default.writeFile(targetPath, '', 'utf-8');
        }
        // Appliquer la stratégie de fusion
        const strategy = fragment.strategy || 'append';
        await this.mergeContent(targetPath, fragmentContent, strategy, moduleId, fragment.separator);
    }
    /**
     * Fusionne le contenu selon la stratégie
     */
    async mergeContent(targetPath, fragmentContent, strategy, moduleId, separator) {
        const existingContent = await fs_extra_1.default.readFile(targetPath, 'utf-8');
        let newContent;
        const defaultSeparator = `\n\n// ========== ${moduleId.toUpperCase()} ==========\n`;
        const sep = separator !== undefined ? separator : defaultSeparator;
        switch (strategy) {
            case 'append':
                newContent = existingContent.trimEnd() + sep + fragmentContent.trim() + '\n';
                break;
            case 'prepend':
                newContent = fragmentContent.trim() + sep + existingContent.trimStart();
                break;
            case 'merge-json':
                newContent = this.mergeJson(existingContent, fragmentContent);
                break;
            case 'merge-yaml':
                newContent = this.mergeYaml(existingContent, fragmentContent);
                break;
            default:
                newContent = existingContent + fragmentContent;
        }
        await fs_extra_1.default.writeFile(targetPath, newContent, 'utf-8');
    }
    /**
     * Fusionne deux contenus JSON
     */
    mergeJson(existing, fragment) {
        try {
            const existingObj = existing.trim() ? JSON.parse(existing) : {};
            const fragmentObj = JSON.parse(fragment);
            const merged = this.deepMerge(existingObj, fragmentObj);
            return JSON.stringify(merged, null, 2) + '\n';
        }
        catch (error) {
            console.warn('Failed to merge JSON, appending instead');
            return existing + '\n' + fragment;
        }
    }
    /**
     * Fusionne deux contenus YAML
     */
    mergeYaml(existing, fragment) {
        try {
            const existingObj = existing.trim() ? yaml_1.default.parse(existing) : {};
            const fragmentObj = yaml_1.default.parse(fragment);
            const merged = this.deepMerge(existingObj, fragmentObj);
            return yaml_1.default.stringify(merged);
        }
        catch (error) {
            console.warn('Failed to merge YAML, appending instead');
            return existing + '\n' + fragment;
        }
    }
    /**
     * Deep merge de deux objets
     */
    deepMerge(target, source) {
        const output = { ...target };
        for (const key of Object.keys(source)) {
            if (source[key] &&
                typeof source[key] === 'object' &&
                !Array.isArray(source[key])) {
                if (target[key] && typeof target[key] === 'object') {
                    output[key] = this.deepMerge(target[key], source[key]);
                }
                else {
                    output[key] = source[key];
                }
            }
            else if (Array.isArray(source[key])) {
                output[key] = [...(target[key] || []), ...source[key]];
            }
            else {
                output[key] = source[key];
            }
        }
        return output;
    }
}
exports.FragmentService = FragmentService;
exports.fragmentService = new FragmentService();
