import path from 'path';
import fs from 'fs-extra';

export class PlaceholderService {

/**
 * Remplace les placeholders dans les fichiers déjà copiés dans la destination
 * Cette méthode modifie les fichiers in-place dans le dossier destination
 */
public async replacePlaceholderInDestination(
    destination: string,
    values: Record<string, any>
) {
    if (Object.keys(values).length === 0) {
      return;
    }

    // Fonction récursive pour récupérer tous les fichiers
    function getAllFiles(dir: string): string[] {
      const entries = fs.readdirSync(dir);
      let files: string[] = [];

      for (const entry of entries) {
        const fullPath = path.join(dir, entry);

        if (fs.statSync(fullPath).isDirectory()) {
          files = files.concat(getAllFiles(fullPath));
        } else {
          files.push(fullPath);
        }
      }

      return files;
    }

    const allFiles = getAllFiles(destination);

    for (const filePath of allFiles) {
      // Ne traiter que les fichiers texte
      const ext = path.extname(filePath).toLowerCase();
      const textExtensions = ['.ts', '.js', '.vue', '.json', '.md', '.txt', '.yaml', '.yml', '.env', '.prisma', '.css', '.html', '.sh'];

      if (!textExtensions.includes(ext) && !filePath.includes('.env')) {
        continue;
      }

      try {
        // Lire le contenu actuel du fichier destination
        const content = fs.readFileSync(filePath, 'utf-8');
        let updatedContent = content;

        // Remplacer les placeholders
        for (const [key, value] of Object.entries(values)) {
          const placeholder = `{{${key}}}`;
          updatedContent = updatedContent.replace(new RegExp(placeholder, 'g'), value);
        }

        // Écrire seulement si le contenu a changé
        if (updatedContent !== content) {
          fs.writeFileSync(filePath, updatedContent, 'utf-8');
        }
      } catch (error) {
        // Ignorer les erreurs de lecture (fichiers binaires, etc.)
      }
    }
}

/**
 * @deprecated Utiliser replacePlaceholderInDestination à la place
 */
public async replacePlaceholderInFile(
    basePath: string,
    moduleName: string,
    destination: string,
    values: Record<string, any>
) {
    // Redirige vers la nouvelle méthode
    await this.replacePlaceholderInDestination(destination, values);
}


}