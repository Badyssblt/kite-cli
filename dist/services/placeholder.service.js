"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaceholderService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
class PlaceholderService {
    /**
     * Remplace les placeholders dans les fichiers déjà copiés dans la destination
     * Cette méthode modifie les fichiers in-place dans le dossier destination
     */
    async replacePlaceholderInDestination(destination, values) {
        if (Object.keys(values).length === 0) {
            return;
        }
        // Fonction récursive pour récupérer tous les fichiers
        function getAllFiles(dir) {
            const entries = fs_extra_1.default.readdirSync(dir);
            let files = [];
            for (const entry of entries) {
                const fullPath = path_1.default.join(dir, entry);
                if (fs_extra_1.default.statSync(fullPath).isDirectory()) {
                    files = files.concat(getAllFiles(fullPath));
                }
                else {
                    files.push(fullPath);
                }
            }
            return files;
        }
        const allFiles = getAllFiles(destination);
        for (const filePath of allFiles) {
            // Ne traiter que les fichiers texte
            const ext = path_1.default.extname(filePath).toLowerCase();
            const textExtensions = ['.ts', '.js', '.vue', '.json', '.md', '.txt', '.yaml', '.yml', '.env', '.prisma', '.css', '.html', '.sh'];
            if (!textExtensions.includes(ext) && !filePath.includes('.env')) {
                continue;
            }
            try {
                // Lire le contenu actuel du fichier destination
                const content = fs_extra_1.default.readFileSync(filePath, 'utf-8');
                let updatedContent = content;
                // Remplacer les placeholders
                for (const [key, value] of Object.entries(values)) {
                    const placeholder = `{{${key}}}`;
                    updatedContent = updatedContent.replace(new RegExp(placeholder, 'g'), value);
                }
                // Écrire seulement si le contenu a changé
                if (updatedContent !== content) {
                    fs_extra_1.default.writeFileSync(filePath, updatedContent, 'utf-8');
                }
            }
            catch (error) {
                // Ignorer les erreurs de lecture (fichiers binaires, etc.)
            }
        }
    }
    /**
     * @deprecated Utiliser replacePlaceholderInDestination à la place
     */
    async replacePlaceholderInFile(basePath, moduleName, destination, values) {
        // Redirige vers la nouvelle méthode
        await this.replacePlaceholderInDestination(destination, values);
    }
}
exports.PlaceholderService = PlaceholderService;
