import { defineEventHandler, readBody } from "h3";
import { redis, CACHE_KEYS } from "~~/server/utils/redis";

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

interface SyncBody {
  bases: Array<{ framework: string; tree: TreeNode }>;
  modules: Array<{ framework: string; moduleId: string; tree: TreeNode }>;
  files: Array<{ framework: string; path: string; content: string; module?: string }>;
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<SyncBody>(event);

    if (!body.bases || !body.modules || !body.files) {
      return { success: false, error: "bases, modules and files are required" };
    }

    const pipeline = redis.pipeline();

    // Store base trees
    for (const base of body.bases) {
      const key = CACHE_KEYS.BASE_TREE(base.framework);
      pipeline.set(key, JSON.stringify(base.tree));
    }

    // Store module trees
    for (const mod of body.modules) {
      const key = CACHE_KEYS.MODULE_TREE(mod.framework, mod.moduleId);
      pipeline.set(key, JSON.stringify(mod.tree));
    }

    // Store files
    for (const file of body.files) {
      const key = CACHE_KEYS.FILE(file.framework, file.path, file.module);
      pipeline.set(key, JSON.stringify({
        path: file.path,
        content: file.content,
        module: file.module,
      }));
    }

    await pipeline.exec();

    return {
      success: true,
      basesCount: body.bases.length,
      modulesCount: body.modules.length,
      filesCount: body.files.length,
    };
  } catch (err) {
    console.error('Sync error:', err);
    return {
      success: false,
      error: (err as Error).message,
    };
  }
});
