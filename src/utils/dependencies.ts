// Système de dépendances entre modules

export interface ModuleDependencies {
  [moduleName: string]: string[];
}

// Définir les dépendances de chaque module
export const moduleDependencies: ModuleDependencies = {
  // Shadcn nécessite Tailwind
  shadcn: ['tailwind'],

  // NuxtUI inclut déjà Tailwind
  'nuxt-ui': ['tailwind'],

  // Docker avec Prisma nécessite Prisma
  // (géré dynamiquement dans docker.ts)

  // Prisma nécessite une base de données
  // Pas de dépendance automatique, l'utilisateur choisit

  // NuxtAuth peut fonctionner avec Prisma (optionnel)
  // Pas de dépendance stricte
};

// Résoudre les dépendances récursivement
export function resolveDependencies(selectedModules: string[]): string[] {
  const resolved = new Set<string>(selectedModules);
  const toProcess = [...selectedModules];

  while (toProcess.length > 0) {
    const current = toProcess.shift()!;
    const deps = moduleDependencies[current] || [];

    for (const dep of deps) {
      if (!resolved.has(dep)) {
        resolved.add(dep);
        toProcess.push(dep);
      }
    }
  }

  return Array.from(resolved);
}

// Obtenir les modules ajoutés automatiquement
export function getAddedDependencies(
  originalModules: string[],
  resolvedModules: string[]
): string[] {
  return resolvedModules.filter(m => !originalModules.includes(m));
}

// Obtenir un message explicatif des dépendances ajoutées
export function getDependencyMessage(addedModules: string[]): string {
  if (addedModules.length === 0) return '';

  const messages: string[] = [];

  for (const module of addedModules) {
    const dependents = Object.entries(moduleDependencies)
      .filter(([_, deps]) => deps.includes(module))
      .map(([name, _]) => name);

    if (dependents.length > 0) {
      messages.push(`  • ${module} (requis par: ${dependents.join(', ')})`);
    }
  }

  return messages.join('\n');
}

// Trier les modules selon l'ordre des dépendances (dépendances en premier)
export function sortByDependencies(modules: string[]): string[] {
  const sorted: string[] = [];
  const remaining = new Set(modules);

  // Continuer jusqu'à ce que tous les modules soient triés
  while (remaining.size > 0) {
    let addedThisRound = false;

    for (const module of Array.from(remaining)) {
      const deps = moduleDependencies[module] || [];

      // Vérifier si toutes les dépendances sont déjà dans sorted
      const allDepsAdded = deps.every(dep => sorted.includes(dep));

      if (allDepsAdded) {
        sorted.push(module);
        remaining.delete(module);
        addedThisRound = true;
      }
    }

    // Si aucun module n'a été ajouté ce tour, ajouter le reste (pas de dépendances circulaires)
    if (!addedThisRound && remaining.size > 0) {
      sorted.push(...Array.from(remaining));
      break;
    }
  }

  return sorted;
}
