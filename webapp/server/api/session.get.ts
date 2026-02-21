import { auth } from "~~/lib/auth";
import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session?.user) return session;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return {
    ...session,
    user: {
      ...session.user,
      role: user?.role ?? "USER",
    },
  };
});
