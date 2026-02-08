import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async () => {
  const presets = await prisma.preset.findMany({
    include: {
      frameworks: {
        include: {
          framework: true,
        },
      },
      modules: {
        include: {
          module: true,
        },
      },
    },
  });

  return presets.map((preset) => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
    image: preset.image,
    frameworks: preset.frameworks.map((pf) => pf.frameworkId),
    modules: preset.modules.map((pm) => pm.moduleId),
  }));
});
