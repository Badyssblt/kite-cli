"use strict";
// Service d'exécution des scripts setup
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupService = exports.SetupService = void 0;
const child_process_1 = require("child_process");
const dependency_service_1 = require("./dependency.service");
class SetupService {
    // Exécuter les scripts setup dans l'ordre des dépendances
    executeSetupScripts(setupScripts, projectPath, onProgress, onError) {
        const failedModules = [];
        // Trier les scripts selon l'ordre des dépendances
        const moduleNames = setupScripts.map(s => s.name);
        const sortedNames = dependency_service_1.dependencyService.sortByDependencies(moduleNames);
        const sortedScripts = sortedNames
            .map(name => setupScripts.find(s => s.name === name))
            .filter((s) => s !== undefined);
        for (const script of sortedScripts) {
            onProgress?.(script.name);
            try {
                (0, child_process_1.execSync)(`bash "${script.path}"`, {
                    cwd: projectPath,
                    stdio: 'pipe'
                });
            }
            catch (error) {
                failedModules.push(script.name);
                onError?.(script.name, error);
            }
        }
        return failedModules;
    }
    // Installer les dépendances npm
    installDependencies(projectPath) {
        (0, child_process_1.execSync)('npm install', {
            cwd: projectPath,
            stdio: 'pipe'
        });
    }
}
exports.SetupService = SetupService;
exports.setupService = new SetupService();
