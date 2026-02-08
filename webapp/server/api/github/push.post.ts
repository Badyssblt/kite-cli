import { auth } from "~~/lib/auth";
import { prisma } from "~~/server/utils/db";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";
import os from "os";

const execAsync = promisify(exec);

interface PushBody {
  projectName: string;
  framework: string;
  modules: string[];
  repoName: string;
  isPrivate: boolean;
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

  // Get GitHub account
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
    throw createError({
      statusCode: 400,
      message: "GitHub account not connected",
    });
  }

  const body = await readBody<PushBody>(event);

  if (!body.projectName || !body.framework || !body.repoName) {
    throw createError({ statusCode: 400, message: "Missing required fields" });
  }

  const scopeString = githubAccount.scope ?? "";
  const scopes = scopeString.split(/[,\s]+/).filter(Boolean);
  const hasRepoScope = scopes.includes("repo") || scopes.includes("public_repo");
  const hasPrivateRepoScope = scopes.includes("repo");

  if (!hasRepoScope) {
    throw createError({
      statusCode: 403,
      message: "GitHub scope missing: repo or public_repo required",
    });
  }

  if (body.isPrivate && !hasPrivateRepoScope) {
    throw createError({
      statusCode: 403,
      message: "GitHub scope missing: repo required for private repositories",
    });
  }

  const tempDir = path.join(os.tmpdir(), `kite-${Date.now()}`);
  const projectDir = path.join(tempDir, body.projectName);

  try {
    // Create temp directory
    fs.mkdirSync(tempDir, { recursive: true });

    // Build CLI command
    const cliPath = path.resolve(process.cwd(), "..");
    const modulesArg =
      body.modules.length > 0
        ? `--modules ${body.modules.map((m) => `"${m}"`).join(" ")}`
        : "";

    const command = `cd "${cliPath}" && npx ts-node src/index.ts create --name "${body.projectName}" --framework "${body.framework}" ${modulesArg} --json --no-install --output "${tempDir}"`;

    // Execute CLI to create project
    await execAsync(command, { timeout: 120000 });

    // Initialize git and push to GitHub
    const token = githubAccount.accessToken;
    const visibility = body.isPrivate ? "private" : "public";

    // Create GitHub repo using API
    const createRepoResponse = await fetch("https://api.github.com/user/repos", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: body.repoName,
        private: body.isPrivate,
        auto_init: false,
      }),
    });

    if (!createRepoResponse.ok) {
      const errorData = await createRepoResponse.json();

      // Check if repo already exists
      if (createRepoResponse.status === 422 && errorData.errors?.some((e: any) => e.message?.includes("already exists"))) {
        throw createError({
          statusCode: 409,
          message: `Repository "${body.repoName}" already exists`,
        });
      }

      throw createError({
        statusCode: createRepoResponse.status,
        message: errorData.message || "Failed to create GitHub repository",
      });
    }

    const repoData = await createRepoResponse.json();
    const repoOwner = repoData?.owner?.login;
    const repoUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${repoOwner}/${body.repoName}.git`;

    // Initialize git, add files, commit and push
    const gitCommands = [
      `cd "${projectDir}"`,
      "git init",
      "git add .",
      'git commit -m "Initial commit - Generated with Kite CLI"',
      "git branch -M main",
      `git remote add origin "${repoUrl}"`,
      "git push -u origin main",
    ].join(" && ");

    await execAsync(gitCommands, { timeout: 60000 });

    // Save project to database
    await prisma.project.create({
      data: {
        name: body.projectName,
        description: `GitHub: ${repoData.html_url}`,
        user: { connect: { id: session.user.id } },
        framework: { connect: { id: body.framework } },
        modules: {
          create: body.modules.map((moduleId) => ({
            module: { connect: { id: moduleId } },
          })),
        },
      },
    });

    // Cleanup
    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      success: true,
      repoUrl: repoData.html_url,
      repoName: body.repoName,
      visibility,
    };
  } catch (err: any) {
    // Cleanup on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    if (err.statusCode) {
      throw err;
    }

    throw createError({
      statusCode: 500,
      message: err.message || "Failed to push to GitHub",
    });
  }
});
