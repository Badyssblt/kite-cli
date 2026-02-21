import { defineEventHandler, readBody } from 'h3';
import { prisma } from '~~/server/utils/db';

interface CreatePresetBody {
  name: string;
  description?: string;
  framework: string;
  modules: string[];
  answers?: Record<string, Record<string, string | boolean>>;
}

export default defineEventHandler(async (event) => {
  const body = await readBody<CreatePresetBody>(event);

  if (!body.name || !body.framework || !body.modules?.length) {
    throw createError({ statusCode: 400, statusMessage: 'name, framework et modules sont requis' });
  }

  const preset = await prisma.preset.create({
    data: {
      name: body.name,
      description: body.description ?? null,
      answers: body.answers ?? undefined,
      frameworks: {
        create: { frameworkId: body.framework },
      },
      modules: {
        create: body.modules.map((moduleId) => ({ moduleId })),
      },
    },
    include: {
      frameworks: true,
      modules: true,
    },
  });

  return preset;
});
