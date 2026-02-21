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

  const existing = await prisma.module.findUnique({
    where: { id },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Module non trouvé' })
  }

  const isOwner = existing.authorId === session.user.id
  const isAdmin = (session.user as any).role === 'ADMIN'

  if (!isOwner && !isAdmin) {
    throw createError({ statusCode: 403, statusMessage: 'Accès interdit' })
  }

  await prisma.module.delete({ where: { id } })

  return { success: true }
})
