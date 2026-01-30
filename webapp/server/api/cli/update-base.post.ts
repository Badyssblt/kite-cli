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
      modules: Array<{ id: string; name: string; description: string }>;
    }>;

    

    if (!Array.isArray(body)) {
      return { success: false, error: "Le body doit être un tableau de frameworks" };
    }

    // Inserer ou mettre à jour dans la BDD
    for (const fw of body) {
      await prisma.framework.upsert({
        where: { id: fw.id },
        update: { name: fw.name, description: fw.description },
        create: { id: fw.id, name: fw.name, description: fw.description }
      });

      for (const mod of fw.modules) {
        await prisma.module.upsert({
          where: { id: mod.id },
          update: { name: mod.name, description: mod.description, frameworkId: fw.id },
          create: { id: mod.id, name: mod.name, description: mod.description, frameworkId: fw.id }
        });
      }
    }

    return { success: true, message: "Frameworks et modules insérés/mis à jour" };
  } catch (err) {
    console.error(err);
    return { success: false, error: (err as Error).message };
  } finally {
    await prisma.$disconnect();
  }
});
