import { auth } from '~~/lib/auth'
import { prisma } from '~~/server/utils/db'

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers })
  if (!session?.user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  if (user?.role !== 'ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Accès réservé aux administrateurs' })
  }

  const query = getQuery(event)
  const status = query.status as string | undefined

  const where: any = { isCommunity: true }
  if (status) {
    where.status = { is: { status } }
  }

  const modules = await prisma.module.findMany({
    where,
    include: {
      framework: true,
      status: true,
      files: true,
      dependencies: true,
      envVars: true,
      author: { select: { id: true, name: true, image: true } },
    },
    orderBy: { name: 'asc' },
  })

  return modules
})
