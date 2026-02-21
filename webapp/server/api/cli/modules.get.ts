import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async () => {
  const modules = await prisma.module.findMany({
    where: {
      OR: [
        { isCommunity: false },
        { isCommunity: true, status: { status: 'ACTIVE' } },
      ],
    },
    include: {
      framework: true,
    },
  });

  return modules;
});
