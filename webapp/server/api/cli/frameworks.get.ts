import {prisma} from "~~/server/utils/db";


export default defineEventHandler(async (event) => {
    const frameworks = await prisma.framework.findMany({
        include: {
          modules: {
            where: {
              OR: [
                { isCommunity: false },
                { isCommunity: true, status: { status: 'ACTIVE' } },
              ],
            },
            select: {
              id: true,
              name: true,
              description: true,
              category: true,
              isCommunity: true,
              prompts: true,
            },
          },
        },
    });

    return frameworks
});
