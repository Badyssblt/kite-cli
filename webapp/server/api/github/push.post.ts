import { auth } from "~~/lib/auth";
import { prisma } from "~~/server/utils/db";
import { spawn, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

interface PushBody {
  projectName: string;
  framework: string;
  modules: string[];
  answers?: Record<string, Record<string, string | boolean>>;
  packageManager?: string;
  repoName: string;
  isPrivate: boolean;
}

function sanitize(input: string): string {
  return input.replace(/[^a-zA-Z0-9\-_.]/g, '');
}

function runCli(args: string[], cwd: string): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn('npx', ['ts-node', 'src/index.ts', ...args], {
      cwd,
      timeout: 120000,
      env: { ...process.env },
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const error = new Error(`CLI exited with code ${code}`) as Error & { stderr: string };
        error.stderr = stderr;
        reject(error);
      }
    });

    child.on('error', reject);
  });
}

export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({ headers: event.headers });

  if (!session || !session.user) {
    throw createError({ statusCode: 401, message: "Unauthorized" });
  }

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
    fs.mkdirSync(tempDir, { recursive: true });

    const cliPath = process.env.KITE_CLI_PATH || '/cli';
    // Module IDs from DB are composite (e.g. "nextjs-better-auth")
    // but CLI expects simple IDs (e.g. "better-auth")
    const frameworkPrefix = body.framework + '-';
    const simpleModules = body.modules.map(m => m.startsWith(frameworkPrefix) ? m.slice(frameworkPrefix.length) : m);
    const modulesStr = simpleModules.length > 0 ? simpleModules.map(sanitize).join(',') : 'none';

    const args = [
      'create',
      '--name', sanitize(body.projectName),
      '--framework', sanitize(body.framework),
      '--modules', modulesStr,
      '--json',
      '--no-install',
      '--output', tempDir,
    ];

    if (body.packageManager) {
      args.push('--pm', sanitize(body.packageManager));
    }

    if (body.answers && Object.keys(body.answers).length > 0) {
      const cliAnswers: Record<string, any> = {};
      for (const [key, value] of Object.entries(body.answers)) {
        const simpleKey = key.startsWith(frameworkPrefix) ? key.slice(frameworkPrefix.length) : key;
        cliAnswers[simpleKey] = value;
      }
      args.push('--answers', JSON.stringify(cliAnswers));
    }

    await runCli(args, cliPath);

    const token = githubAccount.accessToken;
    const visibility = body.isPrivate ? "private" : "public";

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

    execSync(
      [
        "git init",
        "git add .",
        'git commit -m "Initial commit - Generated with Kite CLI"',
        "git branch -M main",
        `git remote add origin "${repoUrl}"`,
        "git push -u origin main",
      ].join(" && "),
      { cwd: projectDir, timeout: 60000 }
    );

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

    fs.rmSync(tempDir, { recursive: true, force: true });

    return {
      success: true,
      repoUrl: repoData.html_url,
      repoName: body.repoName,
      visibility,
    };
  } catch (err: any) {
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
