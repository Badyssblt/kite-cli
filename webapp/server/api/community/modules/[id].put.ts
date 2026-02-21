import { auth } from '~~/lib/auth'
import { prisma } from '~~/server/utils/db'
import type { CommunityModulePayload } from '~~/types/type'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requis' })
  }

  const existing = await prisma.module.findUnique({
    where: { id },
    include: { status: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Module non trouvé' })
  }

  if (existing.authorId !== session.user.id) {
    throw createError({ statusCode: 403, statusMessage: 'Accès interdit' })
  }

  if (existing.status?.status === 'ACTIVE') {
    throw createError({ statusCode: 400, statusMessage: 'Impossible de modifier un module actif' })
  }

  const body = await readBody<CommunityModulePayload>(event)

  if (!body.name || !body.frameworkId) {
    throw createError({ statusCode: 400, statusMessage: 'name et frameworkId sont requis' })
  }

  if (!body.files?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Au moins un fichier est requis' })
  }

  const module = await prisma.$transaction(async (tx) => {
    // Delete existing related data
    await tx.moduleFile.deleteMany({ where: { moduleId: id } })
    await tx.moduleDependency.deleteMany({ where: { moduleId: id } })
    await tx.moduleEnvVar.deleteMany({ where: { moduleId: id } })

    // Update module and recreate related data
    return tx.module.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || '',
        frameworkId: body.frameworkId,
        category: body.category || 'other',
        prompts: body.prompts?.length ? body.prompts : undefined,
        status: {
          update: {
            status: 'WAITING_FOR_APPROVAL',
            reason: null,
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
  })

  return module
})
