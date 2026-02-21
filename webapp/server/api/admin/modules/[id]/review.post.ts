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

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'ID requis' })
  }

  const body = await readBody<{ action: 'approve' | 'reject'; reason?: string }>(event)

  if (!body.action || !['approve', 'reject'].includes(body.action)) {
    throw createError({ statusCode: 400, statusMessage: 'action doit être "approve" ou "reject"' })
  }

  if (body.action === 'reject' && !body.reason) {
    throw createError({ statusCode: 400, statusMessage: 'Une raison est requise pour le refus' })
  }

  const existing = await prisma.module.findUnique({
    where: { id },
    include: { status: true },
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Module non trouvé' })
  }

  if (!existing.isCommunity) {
    throw createError({ statusCode: 400, statusMessage: 'Ce module n\'est pas communautaire' })
  }

  const newStatus = body.action === 'approve' ? 'ACTIVE' : 'REFUSED'

  const moduleStatus = await prisma.moduleStatus.upsert({
    where: { moduleId: id },
    update: {
      status: newStatus,
      reason: body.action === 'reject' ? body.reason! : null,
    },
    create: {
      moduleId: id,
      status: newStatus,
      reason: body.action === 'reject' ? body.reason! : null,
    },
  })

  return moduleStatus
})
