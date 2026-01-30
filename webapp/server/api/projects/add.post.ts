import { prisma } from "~~/server/utils/db";
export default defineEventHandler(async (event) => {
    const body = await readBody(event)

    try{
        await prisma.project.create({
            data: {
                name: body.name,
                frameworkId: body.frameworkId,
                modules: {
                    connect: body.moduleIds.map((id: string) => ({ id }))
                }
            }
        })
    }catch(e: any){
        throw createError(e)
    }
});