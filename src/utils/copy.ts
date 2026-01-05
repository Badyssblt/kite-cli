import path from "path";
import fs from "fs-extra";
import { deepmerge } from "deepmerge-ts";
import { parseModule, generateCode } from "magicast";
import { generateDockerCompose, generateDockerfile } from "./docker";

export async function copyTemplate(
  templateName: string,
  destination: string,
  modules: string[]
) {
  const basePath = path.join(__dirname, "..", "templates", templateName);
  const basicTemplatePath = path.join(basePath, "base");

  // Tracker les scripts setup.sh à exécuter
  const setupScripts: Array<{ name: string; path: string }> = [];

  try {
    // Supprime la destination existante
    await fs.remove(destination);

    // Copie le template de base
    await fs.copy(basicTemplatePath, destination);

    for (const moduleName of modules) {
      const modulePath = path.join(basePath, "modules", moduleName);

      if (!(await fs.pathExists(modulePath))) {
        console.warn(`Module "${moduleName}" introuvable à ${modulePath}`);
        continue;
      }

      // Vérifier si ce module a un setup.sh
      const setupShPath = path.join(modulePath, "setup.sh");
      if (await fs.pathExists(setupShPath)) {
        setupScripts.push({ name: moduleName, path: setupShPath });
      }

      // Parcours tous les fichiers du module
      const files = await fs.readdir(modulePath, { withFileTypes: true });

      for (const file of files) {
        const srcPath = path.join(modulePath, file.name);
        const destPath = path.join(destination, file.name);

        if (file.isDirectory()) {
          // Copie les dossiers comme avant
          await fs.copy(srcPath, destPath, { overwrite: true });
        } else if (file.name === "nuxt.config.ts" && (await fs.pathExists(destPath))) {
          // Merge de nuxt.config.ts
          const existingContent = await fs.readFile(destPath, "utf-8");
          const moduleContent = await fs.readFile(srcPath, "utf-8");

          const mergedContent = mergeNuxtConfigModules(existingContent, moduleContent);
          await fs.writeFile(destPath, mergedContent, "utf-8");
        } else if (file.name === "package.json" && (await fs.pathExists(destPath))) {
          // Merge de package.json
          const existingContent = await fs.readFile(destPath, "utf-8");
          const moduleContent = await fs.readFile(srcPath, "utf-8");

          const mergedContent = mergePackageJson(existingContent, moduleContent);
          await fs.writeFile(destPath, mergedContent, "utf-8");
        } else if (file.name === ".env.example" && (await fs.pathExists(destPath))) {
          // Merge de .env.example (concaténation)
          const existingContent = await fs.readFile(destPath, "utf-8");
          const moduleContent = await fs.readFile(srcPath, "utf-8");

          const mergedContent = mergeEnvExample(existingContent, moduleContent, moduleName);
          await fs.writeFile(destPath, mergedContent, "utf-8");
        } else if (moduleName === "docker" && (file.name === "docker-compose.yml" || file.name === "Dockerfile")) {
          // Ignorer ces fichiers pour le module docker, on les générera dynamiquement
        } else if (file.name === "setup.sh") {
          // Ignorer setup.sh, il sera exécuté mais pas copié
        } else {
          // Copie le fichier s'il n'existe pas
          await fs.copy(srcPath, destPath, { overwrite: true });
        }
      }
    }

    // Génération dynamique des fichiers Docker si le module docker est présent
    if (modules.includes("docker")) {
      const dockerCompose = generateDockerCompose(modules);
      await fs.writeFile(
        path.join(destination, "docker-compose.yml"),
        dockerCompose,
        "utf-8"
      );

      const dockerfile = generateDockerfile(modules);
      await fs.writeFile(
        path.join(destination, "Dockerfile"),
        dockerfile,
        "utf-8"
      );
    }

    return {
      setupScripts
    };
  } catch (err) {
    console.error("Erreur lors de la copie du template :", err);
    return {
      setupScripts: []
    };
  }
}

// Fonction pour merger les configurations nuxt.config.ts avec magicast
function mergeNuxtConfigModules(existing: string, incoming: string): string {
  try {
    // Extraire les imports du fichier incoming (regex)
    const incomingImports = extractImports(incoming);
    const existingImports = extractImports(existing);

    // Parser les deux fichiers
    const existingMod = parseModule(existing);
    const incomingMod = parseModule(incoming);

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

      const incomingModulesArray = Array.isArray(incomingConfig.modules)
        ? [...incomingConfig.modules]
        : Array.from(incomingConfig.modules);

      // Fusionner les modules sans doublons
      const existingModulesSet = new Set(existingModulesArray);

      for (const mod of incomingConfig.modules) {
        if (!existingModulesSet.has(mod)) {
          existingConfig.modules.push(mod);
          existingModulesSet.add(mod);
        } else {
          console.log('  ⏭️  Module déjà présent:', mod);
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
      } else {
        console.log('  ⏭️  Propriété déjà existante:', key);
      }
    }

    // Générer le code
    let result = generateCode(existingMod).code;

    // Enlever les imports du code généré (car on va les ajouter manuellement)
    result = removeImports(result);

    // Merger les imports (ajouter les nouveaux imports au début)
    const mergedImports = mergeImports(existingImports, incomingImports);

    // Ajouter les imports au début du fichier
    if (mergedImports.length > 0) {
      result = mergedImports.join('\n') + '\n\n' + result;
    }

    return result;
  } catch (error) {
    console.error("❌ Erreur lors du merge de nuxt.config.ts:", error);
    console.log("⚠️  Fallback: conservation du fichier existant");
    return existing;
  }
}

// Extrait les imports d'un fichier
function extractImports(code: string): string[] {
  const imports: string[] = [];
  // Regex pour capturer les imports (import ... from '...')
  const importRegex = /^import\s+.*?from\s+['"].*?['"];?$/gm;

  let match;
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[0].trim());
  }

  return imports;
}

// Enlève les imports d'un fichier
function removeImports(code: string): string {
  // Enlever toutes les lignes d'import
  const withoutImports = code.replace(/^import\s+.*?from\s+['"].*?['"];?\n?/gm, '');

  // Enlever les lignes vides au début
  return withoutImports.replace(/^\s*\n/, '');
}

// Merge deux listes d'imports en évitant les doublons
function mergeImports(existing: string[], incoming: string[]): string[] {
  const merged = [...existing];

  for (const incomingImport of incoming) {
    // Vérifier si cet import existe déjà (comparaison simple)
    const alreadyExists = existing.some(existingImport => {
      // Extraire le module source pour comparer
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
function mergePackageJson(existing: string, incoming: string): string {
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
    const merged = deepmerge(existingPkg, incomingFiltered);

    // Retourner le JSON formaté
    return JSON.stringify(merged, null, 2) + '\n';
  } catch (error) {
    console.error("Erreur lors du merge de package.json:", error);
    return existing;
  }
}

// Merge les fichiers .env.example (concaténation avec section)
function mergeEnvExample(existing: string, incoming: string, moduleName: string): string {
  // Éviter les doublons : vérifier si le contenu incoming est déjà présent
  const incomingLines = incoming.trim().split('\n');
  const existingLines = existing.trim().split('\n');

  const newLines: string[] = [];

  for (const line of incomingLines) {
    const trimmedLine = line.trim();
    // Ignorer les lignes vides et les commentaires pour la comparaison
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
