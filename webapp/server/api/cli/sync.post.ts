import { defineEventHandler, readBody } from "h3";
import { redis, CACHE_KEYS } from "~~/server/utils/redis";
import { prisma } from "~~/server/utils/db";

interface TreeNode {
  name: string;
  type: 'file' | 'folder';
  source?: string;
  children?: TreeNode[];
}

interface PresetSync {
  id: string;
  name: string;
  description: string;
  frameworks: string[];
  modules: string[];
}

interface SyncBody {
  bases: Array<{ framework: string; tree: TreeNode }>;
  modules: Array<{ framework: string; moduleId: string; tree: TreeNode }>;
  files: Array<{ framework: string; path: string; content: string; module?: string }>;
  presets?: PresetSync[];
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

    // Sync presets to database
    let presetsCount = 0;
    if (body.presets && body.presets.length > 0) {
      for (const preset of body.presets) {
        await prisma.preset.upsert({
          where: { id: preset.id },
          create: {
            id: preset.id,
            name: preset.name,
            description: preset.description,
          },
          update: {
            name: preset.name,
            description: preset.description,
          },
        });

        // Delete existing relations and recreate
        await prisma.presetFramework.deleteMany({ where: { presetId: preset.id } });
        await prisma.presetModule.deleteMany({ where: { presetId: preset.id } });

        if (preset.frameworks.length > 0) {
          await prisma.presetFramework.createMany({
            data: preset.frameworks.map((frameworkId) => ({
              presetId: preset.id,
              frameworkId,
            })),
          });
        }

        if (preset.modules.length > 0) {
          // Build composite ids for each framework-module combination
          const presetModuleData: { presetId: string; moduleId: string }[] = [];
          for (const frameworkId of preset.frameworks) {
            for (const moduleId of preset.modules) {
              presetModuleData.push({
                presetId: preset.id,
                moduleId: `${frameworkId}-${moduleId}`,
              });
            }
          }
          // Only insert modules that actually exist in DB
          const existingModules = await prisma.module.findMany({
            where: { id: { in: presetModuleData.map(d => d.moduleId) } },
            select: { id: true },
          });
          const existingIds = new Set(existingModules.map(m => m.id));
          const validData = presetModuleData.filter(d => existingIds.has(d.moduleId));

          if (validData.length > 0) {
            await prisma.presetModule.createMany({ data: validData });
          }
        }

        presetsCount++;
      }
    }

    return {
      success: true,
      basesCount: body.bases.length,
      modulesCount: body.modules.length,
      filesCount: body.files.length,
      presetsCount,
    };
  } catch (err) {
    console.error('Sync error:', err);
    return {
      success: false,
      error: (err as Error).message,
    };
  }
});
