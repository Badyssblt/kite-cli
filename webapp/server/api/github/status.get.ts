import { auth } from "~~/lib/auth";
import { prisma } from "~~/server/utils/db";

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session || !session.user) {
    return { connected: false };
  }

  // Check if user has a GitHub account connected
  const githubAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
    select: {
      accessToken: true,
      accountId: true,
      scope: true,
    },
  });

  if (!githubAccount || !githubAccount.accessToken) {
    return { connected: false };
  }

  const scopeString = githubAccount.scope ?? "";
  const scopes = scopeString.split(/[,\s]+/).filter(Boolean);
  const hasRepoScope = scopes.includes("repo") || scopes.includes("public_repo");

  let username = githubAccount.accountId;
  try {
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${githubAccount.accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData?.login) {
        username = userData.login;
      }
    }
  } catch {
    // fallback to accountId
  }

  return {
    connected: true,
    username,
    hasRepoScope,
  };
});
