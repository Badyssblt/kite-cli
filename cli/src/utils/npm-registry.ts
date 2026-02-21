import { debug } from './debug';

// Cache des versions pour éviter les requêtes multiples pour le même package
const versionCache = new Map<string, string>();

// Récupère la dernière version d'un package depuis le registre npm
export async function getLatestVersion(packageName: string): Promise<string | null> {
  if (versionCache.has(packageName)) {
    return versionCache.get(packageName)!;
  }

  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}/latest`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      debug(`npm registry: ${packageName} → HTTP ${response.status}`);
      return null;
    }

    const data = await response.json() as { version: string };
    const version = data.version;

    if (version) {
      versionCache.set(packageName, version);
      debug(`npm registry: ${packageName} → ^${version}`);
    }

    return version ?? null;
  } catch (error) {
    debug(`npm registry: ${packageName} → erreur (${(error as Error).message})`);
    return null;
  }
}

// Résout les versions "latest" dans un objet de dépendances
export async function resolveLatestVersions(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  const entries = Object.entries(deps);
  const results = await Promise.all(
    entries.map(async ([name, version]) => {
      if (version === 'latest') {
        const latestVersion = await getLatestVersion(name);
        return [name, latestVersion ? `^${latestVersion}` : 'latest'] as const;
      }
      return [name, version] as const;
    })
  );

  for (const [name, version] of results) {
    resolved[name] = version;
  }

  return resolved;
}

// Résout TOUTES les dépendances vers leur dernière version npm
export async function resolveAllToLatest(
  deps: Record<string, string>
): Promise<Record<string, string>> {
  const resolved: Record<string, string> = {};

  const entries = Object.entries(deps);
  const results = await Promise.all(
    entries.map(async ([name, version]) => {
      const latestVersion = await getLatestVersion(name);
      return [name, latestVersion ? `^${latestVersion}` : version] as const;
    })
  );

  for (const [name, version] of results) {
    resolved[name] = version;
  }

  return resolved;
}
