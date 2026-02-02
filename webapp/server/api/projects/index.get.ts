import { auth } from "~~/lib/auth";
import { prisma

 } from "~~/server/utils/db";
export default defineEventHandler(async (event) => {
    const session = await auth.api.getSession({
        headers: event.headers
      });

    if (!session || !session.user) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const projects = await prisma.project.findMany({
        where: {
            userId: session.user.id, 
          },
          include: {
            framework: true
          },
    })

    return projects
});