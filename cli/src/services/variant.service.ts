// Service de gestion des variantes de fichiers

import path from 'path';
import fs from 'fs-extra';
import type { FileVariantGroup } from '../types';

/**
 * Résultat de la résolution d'une variante
 */
export interface ResolvedVariant {
  /** Chemin source du fichier variante */
  sourcePath: string;
  /** Chemin de destination final */
  destinationPath: string;
  /** Nom de la variante utilisée */
  variantName: string;
}

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
export class VariantService {
  /** Nom du dossier contenant les variantes */
  static readonly VARIANTS_FOLDER = '_variants';

  /**
   * Résout les variantes de fichiers pour un module
   *
   * @param modulePath - Chemin du dossier du module template
   * @param fileVariants - Définitions des variantes du module
   * @param answers - Réponses de l'utilisateur pour ce module
   * @returns Liste des variantes résolues à copier
   */
  async resolveVariants(
    modulePath: string,
    fileVariants: FileVariantGroup[],
    answers: Record<string, string | boolean>
  ): Promise<ResolvedVariant[]> {
    const resolved: ResolvedVariant[] = [];

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
  private async resolveVariant(
    modulePath: string,
    variant: FileVariantGroup,
    answers: Record<string, string | boolean>
  ): Promise<ResolvedVariant | null> {
    const answerValue = answers[variant.promptId];

    if (answerValue === undefined) {
      return null;
    }

    // Déterminer le suffixe de variante
    let variantSuffix: string;

    if (variant.variantMap && typeof answerValue === 'string') {
      variantSuffix = variant.variantMap[answerValue] ?? answerValue;
    } else {
      variantSuffix = String(answerValue);
    }

    // Construire le chemin du fichier variante
    const targetDir = path.dirname(variant.targetPath);
    const targetFile = path.basename(variant.targetPath);
    const ext = path.extname(targetFile);
    const baseName = path.basename(targetFile, ext);

    // Chemin: module/_variants/{baseName}/{baseName}.{variant}.{ext}
    const variantFileName = `${baseName}.${variantSuffix}${ext}`;
    const variantsDir = path.join(
      modulePath,
      targetDir,
      VariantService.VARIANTS_FOLDER,
      baseName
    );
    const variantPath = path.join(variantsDir, variantFileName);

    // Vérifier si le fichier variante existe
    if (await fs.pathExists(variantPath)) {
      return {
        sourcePath: variantPath,
        destinationPath: variant.targetPath,
        variantName: variantSuffix
      };
    }

    // Essayer le fallback si défini
    if (variant.fallback) {
      const fallbackFileName = `${baseName}.${variant.fallback}${ext}`;
      const fallbackPath = path.join(variantsDir, fallbackFileName);

      if (await fs.pathExists(fallbackPath)) {
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
  isVariantsFolder(filePath: string): boolean {
    return path.basename(filePath) === VariantService.VARIANTS_FOLDER;
  }

  /**
   * Copie les fichiers variantes résolus vers la destination
   *
   * @param resolvedVariants - Variantes résolues
   * @param destination - Dossier de destination du projet
   */
  async copyVariants(
    resolvedVariants: ResolvedVariant[],
    destination: string
  ): Promise<void> {
    for (const variant of resolvedVariants) {
      const destPath = path.join(destination, variant.destinationPath);

      // S'assurer que le dossier parent existe
      await fs.ensureDir(path.dirname(destPath));

      // Copier le fichier variante (écrase le fichier par défaut si existant)
      await fs.copy(variant.sourcePath, destPath, { overwrite: true });
    }
  }
}

export const variantService = new VariantService();
