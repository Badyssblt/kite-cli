import { auth } from '~~/lib/auth'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requis' })
  }

  const module = await prisma.module.findUnique({
    where: { id },
    include: {
      framework: true,
      status: true,
      files: true,
      dependencies: true,
      envVars: true,
      author: { select: { id: true, name: true, image: true } },
    },
  })

  if (!module) {
    throw createError({ statusCode: 404, statusMessage: 'Module non trouvé' })
  }

  const isOwner = module.authorId === session.user.id
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  const isAdmin = dbUser?.role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Accès interdit' })
  }

  return module
})
