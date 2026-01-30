import { defineEventHandler, readBody } from "h3";
import { redis, CACHE_KEYS } from "~~/server/utils/redis";

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

interface PreviewBody {
  framework: string;
  modules: string[];
}

function mergeTreeNodes(base: TreeNode[], additions: TreeNode[]): TreeNode[] {
  const result = [...base];

  for (const addNode of additions) {
    const existingIndex = result.findIndex(n => n.name === addNode.name);

    if (existingIndex === -1) {
      result.push(addNode);
    } else if (addNode.type === 'folder' && result[existingIndex].type === 'folder') {
      result[existingIndex] = {
        ...result[existingIndex],
        children: mergeTreeNodes(
          result[existingIndex].children || [],
          addNode.children || []
        ),
      };
    }
  }

  return result.sort((a, b) => {
    if (a.type === 'folder' && b.type === 'file') return -1;
    if (a.type === 'file' && b.type === 'folder') return 1;
    return a.name.localeCompare(b.name);
  });
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<PreviewBody>(event);

    if (!body.framework) {
      return { success: false, error: "framework is required" };
    }

    const modules = body.modules || [];

    // Get base tree
    const baseKey = CACHE_KEYS.BASE_TREE(body.framework);
    const baseData = await redis.get(baseKey);

    if (!baseData) {
      return { success: false, error: "Framework not found in cache. Run 'kite sync' first." };
    }

    const baseTree: TreeNode = JSON.parse(baseData);

    // Get module trees and merge
    let mergedChildren = baseTree.children || [];

    if (modules.length > 0) {
      const moduleKeys = modules.map(m => CACHE_KEYS.MODULE_TREE(body.framework, m));
      const modulesData = await redis.mget(...moduleKeys);

      for (const moduleData of modulesData) {
        if (moduleData) {
          const moduleTree: TreeNode = JSON.parse(moduleData);
          mergedChildren = mergeTreeNodes(mergedChildren, moduleTree.children || []);
        }
      }
    }

    return {
      success: true,
      framework: body.framework,
      modules,
      tree: {
        name: 'project',
        type: 'folder',
        children: mergedChildren,
      },
      fromCache: true,
    };
  } catch (err) {
    console.error('Preview tree error:', err);
    return {
      success: false,
      error: (err as Error).message,
    };
  }
});
