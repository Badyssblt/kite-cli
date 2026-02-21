import { defineEventHandler, readBody } from "h3";
import { validateApiKey } from "~~/server/utils/apiKey";
import {prisma} from "~~/server/utils/db";
export default defineEventHandler(async (event) => {

  await validateApiKey(event);

  try {
    // Lire le body JSON
    const body = await readBody(event) as Array<{
      id: string;
      name: string;
      description: string;
      modules: Array<{ id: string; name: string; description: string; prompts?: any[] }>;
    }>;

    

    if (!Array.isArray(body)) {
      return { success: false, error: "Le body doit être un tableau de frameworks" };
    }

    // Collect all expected composite ids
    const allCompositeIds: string[] = [];

    // Inserer ou mettre à jour dans la BDD
    for (const fw of body) {
      await prisma.framework.upsert({
        where: { id: fw.id },
        update: { name: fw.name, description: fw.description },
        create: { id: fw.id, name: fw.name, description: fw.description }
      });

      for (const mod of fw.modules) {
        const compositeId = `${fw.id}-${mod.id}`;
        allCompositeIds.push(compositeId);
        await prisma.module.upsert({
          where: { id: compositeId },
          update: { name: mod.name, description: mod.description, prompts: mod.prompts ?? null, frameworkId: fw.id },
          create: { id: compositeId, name: mod.name, description: mod.description, prompts: mod.prompts ?? null, frameworkId: fw.id }
        });
      }
    }

    // Cleanup old official modules that are no longer in the sync payload
    const frameworkIds = body.map(fw => fw.id);
    const staleModules = await prisma.module.findMany({
      where: {
        frameworkId: { in: frameworkIds },
        isCommunity: false,
        id: { notIn: allCompositeIds },
      },
      select: { id: true },
    });
    const staleIds = staleModules.map(m => m.id);

    if (staleIds.length > 0) {
      await prisma.projectModule.deleteMany({ where: { moduleId: { in: staleIds } } });
      await prisma.presetModule.deleteMany({ where: { moduleId: { in: staleIds } } });
      await prisma.module.deleteMany({ where: { id: { in: staleIds } } });
    }

    return { success: true, message: "Frameworks et modules insérés/mis à jour" };
  } catch (err) {
    console.error(err);
    return { success: false, error: (err as Error).message };
  } finally {
    await prisma.$disconnect();
  }
});
