import { auth } from '~~/lib/auth'
import { prisma } from '~~/server/utils/db'
import type { CommunityModulePayload } from '~~/types/type'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody<CommunityModulePayload>(event)

  if (!body.name || !body.frameworkId) {
    throw createError({ statusCode: 400, statusMessage: 'name et frameworkId sont requis' })
  }

  if (!body.files?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un fichier est requis' })
  }

  const module = await prisma.module.create({
    data: {
      name: body.name,
      description: body.description || '',
      frameworkId: body.frameworkId,
      category: body.category || 'other',
      authorId: session.user.id,
      isCommunity: true,
      prompts: body.prompts?.length ? body.prompts : undefined,
      status: {
        create: {
          status: 'WAITING_FOR_APPROVAL',
        },
      },
      files: {
        create: body.files.map((f) => ({
          path: f.path,
          content: f.content,
        })),
      },
      dependencies: {
        create: (body.dependencies || []).map((d) => ({
          name: d.name,
          isDev: d.isDev,
        })),
      },
      envVars: {
        create: (body.envVars || []).map((e) => ({
          key: e.key,
          defaultValue: e.defaultValue || '',
          description: e.description || null,
        })),
      },
    },
    include: {
      framework: true,
      status: true,
      files: true,
      dependencies: true,
      envVars: true,
      author: { select: { id: true, name: true, image: true } },
    },
  })

  return module
})
