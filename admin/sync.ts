import { readdir } from "fs/promises";
import path from "path";
import { pathToFileURL } from "url";
import { execSync } from "child_process";
import { BaseFramework } from "../cli/src/frameworks/base";
import 'dotenv/config';
// Types simplifiés pour la BDD
interface ModuleLite {
  id: string;
  name: string;
  description: string;
  prompts?: any[];
}

interface FrameworkLite {
  id: string;
  name: string;
  description: string;
  modules: ModuleLite[];
}

export const sync = async (): Promise<FrameworkLite[]> => {
  const basePath = "cli/src";
  
  const entries = await readdir('cli/src/frameworks', { withFileTypes: true });

  const availableFrameworks = entries
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(basePath, "frameworks", entry.name, "index.ts"));
  
  const frameworksInfo: FrameworkLite[] = [];

  for (const frameworkPath of availableFrameworks) {
    const moduleUrl = pathToFileURL(path.resolve(frameworkPath)).href;

    const mod = await import(moduleUrl);

    // Récupérer l'instance du framework
    const framework: BaseFramework | undefined = Object.values(mod).find(
      (v): v is BaseFramework => v instanceof BaseFramework
    );

    if (!framework) {
      console.warn(`⚠️ Aucun framework trouvé dans ${frameworkPath}`);
      continue;
    }

    // Créer l'objet léger pour la BDD
    const frameworkLite: FrameworkLite = {
      id: framework.id,
      name: framework.name,
      description: framework.description,
      modules: framework.modules.map(m => ({
        id: m.id,
        name: m.name,
        description: m.description ?? '',
        prompts: m.prompts && m.prompts.length > 0 ? m.prompts : undefined,
      }))
    };

    frameworksInfo.push(frameworkLite);
  }

  try {
    
    const response = await fetch('http://localhost:3000/api/cli/update-base', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': process.env.KITE_API_KEY || ''
        },
        body: JSON.stringify(frameworksInfo),
      })
      const data = await response.json();
      console.log(data);

      // Met à jour le cache local
      console.log('🔄 Mise à jour du cache local...');
      execSync('./node_modules/.bin/tsx src/index.ts sync', { stdio: 'inherit', cwd: 'cli' });
      console.log('✅ Cache local mis à jour');

  }catch(e){
    console.log(e);
    
  }
  return frameworksInfo;
};

sync();
