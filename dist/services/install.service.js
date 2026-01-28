"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const child_process_1 = require("child_process");
class InstallService {
    constructor() {
        this.templatesPath = path_1.default.join(__dirname, '..', 'templates');
    }
    /**
     * Check if a module has an install.sh script
     */
    hasInstallScript(frameworkId, moduleId) {
        const scriptPath = this.getInstallScriptPath(frameworkId, moduleId);
        return fs_extra_1.default.existsSync(scriptPath);
    }
    /**
     * Get the path to a module's install.sh script
     */
    getInstallScriptPath(frameworkId, moduleId) {
        return path_1.default.join(this.templatesPath, frameworkId, 'modules', moduleId, 'install.sh');
    }
    /**
     * Execute a module's install.sh script
     */
    executeInstallScript(frameworkId, moduleId, projectPath) {
        const scriptPath = this.getInstallScriptPath(frameworkId, moduleId);
        if (!fs_extra_1.default.existsSync(scriptPath)) {
            return { success: false, error: `No install.sh found for ${moduleId}` };
        }
        try {
            // Make script executable
            fs_extra_1.default.chmodSync(scriptPath, '755');
            // Execute the script in the project directory
            (0, child_process_1.execSync)(`bash "${scriptPath}"`, {
                cwd: projectPath,
                stdio: 'inherit',
                env: { ...process.env, PATH: process.env.PATH }
            });
            return { success: true };
        }
        catch (error) {
            return { success: false, error: error.message };
        }
    }
    /**
     * Install multiple modules using their install.sh scripts
     */
    installModules(framework, projectPath, moduleIds, onProgress) {
        const installed = [];
        const failed = [];
        for (const moduleId of moduleIds) {
            onProgress?.(moduleId, 'start');
            if (!this.hasInstallScript(framework.id, moduleId)) {
                // Skip modules without install.sh (use legacy method)
                continue;
            }
            const result = this.executeInstallScript(framework.id, moduleId, projectPath);
            if (result.success) {
                installed.push(moduleId);
                onProgress?.(moduleId, 'success');
            }
            else {
                failed.push(moduleId);
                onProgress?.(moduleId, 'error');
                console.error(`Failed to install ${moduleId}: ${result.error}`);
            }
        }
        return { installed, failed };
    }
}
exports.installService = new InstallService();
