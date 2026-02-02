import {prisma} from "~~/server/utils/db";


export default defineEventHandler(async (event) => {
    const frameworks = await prisma.framework.findMany({
        include: {
          modules: true
        }
    });

    return frameworks
});
