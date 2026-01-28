"use strict";
// Service de gestion des variantes de fichiers
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.variantService = exports.VariantService = void 0;
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
/**
 * Service de gestion des variantes de fichiers
 *
 * Convention de structure:
 * ```
 * module/
 *   server/utils/
 *     db.ts                    # Fichier par défaut
 *     _variants/
 *       db/
 *         db.postgresql.ts     # Variante PostgreSQL
 *         db.mysql.ts          # Variante MySQL
 * ```
 */
class VariantService {
    /**
     * Résout les variantes de fichiers pour un module
     *
     * @param modulePath - Chemin du dossier du module template
     * @param fileVariants - Définitions des variantes du module
     * @param answers - Réponses de l'utilisateur pour ce module
     * @returns Liste des variantes résolues à copier
     */
    async resolveVariants(modulePath, fileVariants, answers) {
        const resolved = [];
        for (const variant of fileVariants) {
            const result = await this.resolveVariant(modulePath, variant, answers);
            if (result) {
                resolved.push(result);
            }
        }
        return resolved;
    }
    /**
     * Résout une seule variante de fichier
     */
    async resolveVariant(modulePath, variant, answers) {
        const answerValue = answers[variant.promptId];
        if (answerValue === undefined) {
            return null;
        }
        // Déterminer le suffixe de variante
        let variantSuffix;
        if (variant.variantMap && typeof answerValue === 'string') {
            variantSuffix = variant.variantMap[answerValue] ?? answerValue;
        }
        else {
            variantSuffix = String(answerValue);
        }
        // Construire le chemin du fichier variante
        const targetDir = path_1.default.dirname(variant.targetPath);
        const targetFile = path_1.default.basename(variant.targetPath);
        const ext = path_1.default.extname(targetFile);
        const baseName = path_1.default.basename(targetFile, ext);
        // Chemin: module/_variants/{baseName}/{baseName}.{variant}.{ext}
        const variantFileName = `${baseName}.${variantSuffix}${ext}`;
        const variantsDir = path_1.default.join(modulePath, targetDir, VariantService.VARIANTS_FOLDER, baseName);
        const variantPath = path_1.default.join(variantsDir, variantFileName);
        // Vérifier si le fichier variante existe
        if (await fs_extra_1.default.pathExists(variantPath)) {
            return {
                sourcePath: variantPath,
                destinationPath: variant.targetPath,
                variantName: variantSuffix
            };
        }
        // Essayer le fallback si défini
        if (variant.fallback) {
            const fallbackFileName = `${baseName}.${variant.fallback}${ext}`;
            const fallbackPath = path_1.default.join(variantsDir, fallbackFileName);
            if (await fs_extra_1.default.pathExists(fallbackPath)) {
                return {
                    sourcePath: fallbackPath,
                    destinationPath: variant.targetPath,
                    variantName: variant.fallback
                };
            }
        }
        // Aucune variante trouvée, le fichier par défaut sera utilisé
        return null;
    }
    /**
     * Vérifie si un chemin est un dossier de variantes à ignorer
     *
     * @param filePath - Chemin relatif du fichier/dossier
     * @returns true si c'est un dossier _variants
     */
    isVariantsFolder(filePath) {
        return path_1.default.basename(filePath) === VariantService.VARIANTS_FOLDER;
    }
    /**
     * Copie les fichiers variantes résolus vers la destination
     *
     * @param resolvedVariants - Variantes résolues
     * @param destination - Dossier de destination du projet
     */
    async copyVariants(resolvedVariants, destination) {
        for (const variant of resolvedVariants) {
            const destPath = path_1.default.join(destination, variant.destinationPath);
            // S'assurer que le dossier parent existe
            await fs_extra_1.default.ensureDir(path_1.default.dirname(destPath));
            // Copier le fichier variante (écrase le fichier par défaut si existant)
            await fs_extra_1.default.copy(variant.sourcePath, destPath, { overwrite: true });
        }
    }
}
exports.VariantService = VariantService;
/** Nom du dossier contenant les variantes */
VariantService.VARIANTS_FOLDER = '_variants';
exports.variantService = new VariantService();
