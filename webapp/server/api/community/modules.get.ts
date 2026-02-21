import { auth } from '~~/lib/auth'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const modules = await prisma.module.findMany({
    where: {
      authorId: session.user.id,
      isCommunity: true,
    },
    include: {
      framework: true,
      status: true,
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { name: 'asc' },
  })

  return modules
})
