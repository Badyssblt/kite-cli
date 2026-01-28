"use strict";
// Service de merge des configurations
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeNuxtConfig = mergeNuxtConfig;
exports.mergePackageJson = mergePackageJson;
exports.mergeEnvExample = mergeEnvExample;
const deepmerge_ts_1 = require("deepmerge-ts");
const magicast_1 = require("magicast");
// Merge les configurations nuxt.config.ts avec magicast
function mergeNuxtConfig(existing, incoming) {
    try {
        // Extraire les imports des fichiers
        const incomingImports = extractImports(incoming);
        const existingImports = extractImports(existing);
        // Parser les deux fichiers
        const existingMod = (0, magicast_1.parseModule)(existing);
        const incomingMod = (0, magicast_1.parseModule)(incoming);
        // Extraire les configurations (le contenu de defineNuxtConfig)
        const existingConfig = existingMod.exports.default.$args[0];
        const incomingConfig = incomingMod.exports.default.$args[0];
        // Merger les modules (tableau)
        if (incomingConfig.modules) {
            if (!existingConfig.modules) {
                existingConfig.modules = [];
            }
            // Convertir existingConfig.modules en array si c'est un Proxy
            const existingModulesArray = Array.isArray(existingConfig.modules)
                ? [...existingConfig.modules]
                : Array.from(existingConfig.modules);
            // Fusionner les modules sans doublons
            const existingModulesSet = new Set(existingModulesArray);
            for (const mod of incomingConfig.modules) {
                if (!existingModulesSet.has(mod)) {
                    existingConfig.modules.push(mod);
                    existingModulesSet.add(mod);
                }
            }
        }
        // Merger les autres propriétés (auth, i18n, supabase, etc.)
        for (const [key, value] of Object.entries(incomingConfig)) {
            if (key === 'modules' || key === 'compatibilityDate' || key === 'devtools') {
                continue;
            }
            if (!existingConfig[key]) {
                existingConfig[key] = value;
            }
        }
        // Générer le code
        let result = (0, magicast_1.generateCode)(existingMod).code;
        // Enlever les imports du code généré (car on va les ajouter manuellement)
        result = removeImports(result);
        // Merger les imports (ajouter les nouveaux imports au début)
        const mergedImports = mergeImports(existingImports, incomingImports);
        // Ajouter les imports au début du fichier
        if (mergedImports.length > 0) {
            result = mergedImports.join('\n') + '\n\n' + result;
        }
        return result;
    }
    catch (error) {
        console.error('Erreur lors du merge de nuxt.config.ts:', error);
        return existing;
    }
}
// Extrait les imports d'un fichier
function extractImports(code) {
    const imports = [];
    const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;
    let match;
    while ((match = importRegex.exec(code)) !== null) {
        imports.push(match[0].trim());
    }
    return imports;
}
// Enlève les imports d'un fichier
function removeImports(code) {
    const withoutImports = code.replace(/^import\s+.*?from\s+['"].*?['"];?\n?/gm, '');
    return withoutImports.replace(/^\s*\n/, '');
}
// Merge deux listes d'imports en évitant les doublons
function mergeImports(existing, incoming) {
    const merged = [...existing];
    for (const incomingImport of incoming) {
        const alreadyExists = existing.some(existingImport => {
            const incomingModule = incomingImport.match(/from\s+['"]([^'"]+)['"]/)?.[1];
            const existingModule = existingImport.match(/from\s+['"]([^'"]+)['"]/)?.[1];
            return incomingModule === existingModule;
        });
        if (!alreadyExists) {
            merged.push(incomingImport);
        }
    }
    return merged;
}
// Merge les fichiers package.json avec deepmerge
function mergePackageJson(existing, incoming) {
    try {
        const existingPkg = JSON.parse(existing);
        const incomingPkg = JSON.parse(incoming);
        // On ne garde que les propriétés importantes du incoming
        const incomingFiltered = {
            dependencies: incomingPkg.dependencies || {},
            devDependencies: incomingPkg.devDependencies || {},
            scripts: incomingPkg.scripts || {}
        };
        // Merger avec deepmerge
        const merged = (0, deepmerge_ts_1.deepmerge)(existingPkg, incomingFiltered);
        return JSON.stringify(merged, null, 2) + '\n';
    }
    catch (error) {
        console.error('Erreur lors du merge de package.json:', error);
        return existing;
    }
}
// Merge les fichiers .env.example (concaténation avec section)
function mergeEnvExample(existing, incoming, moduleName) {
    const incomingLines = incoming.trim().split('\n');
    const existingLines = existing.trim().split('\n');
    const newLines = [];
    for (const line of incomingLines) {
        const trimmedLine = line.trim();
        if (trimmedLine === '' || trimmedLine.startsWith('#')) {
            continue;
        }
        // Extraire le nom de la variable (avant le =)
        const varName = trimmedLine.split('=')[0];
        // Vérifier si la variable existe déjà
        const alreadyExists = existingLines.some(existingLine => {
            const existingVar = existingLine.trim().split('=')[0];
            return existingVar === varName;
        });
        if (!alreadyExists) {
            newLines.push(line);
        }
    }
    // Si pas de nouvelles variables, retourner l'existant
    if (newLines.length === 0) {
        return existing;
    }
    // Ajouter les nouvelles variables avec une section
    let result = existing.trim();
    if (result.length > 0 && !result.endsWith('\n')) {
        result += '\n';
    }
    result += `\n# ${moduleName.toUpperCase()} Configuration\n`;
    result += newLines.join('\n') + '\n';
    return result;
}
