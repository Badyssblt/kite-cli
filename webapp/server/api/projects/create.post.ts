import { defineEventHandler, readBody, setHeader, send } from "h3";
import { spawn } from "child_process";
import fs from "fs";
import { prisma } from "~~/server/utils/db";
import { auth } from "~~/lib/auth";

interface CreateProjectBody {
  projectName: string;
  framework: string;
  modules: string[];
  answers?: Record<string, Record<string, string | boolean>>;
  packageManager?: string;
}

// Valide qu'une string ne contient que des caractères safe (alphanum, tirets, underscores, points)
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
  try {
    const session = await auth.api.getSession({
      headers: event.headers,
    });

    if (!session || !session.user) {
      return { success: false, error: "Unauthorized" };
    }

    const body = await readBody<CreateProjectBody>(event);

    if (!body.projectName || !body.framework) {
      return { success: false, error: "projectName and framework are required" };
    }

    const cliPath = process.env.KITE_CLI_PATH || '/cli';
    const outputDir = '/tmp/kite-projects';

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Module IDs from DB are composite (e.g. "nextjs-better-auth")
    // but CLI expects simple IDs (e.g. "better-auth")
    const frameworkPrefix = body.framework + '-';
    const simpleModules = body.modules?.map(m => m.startsWith(frameworkPrefix) ? m.slice(frameworkPrefix.length) : m) || [];
    const modulesStr = simpleModules.length > 0 ? simpleModules.map(sanitize).join(',') : 'none';

    const args = [
      'create',
      '--name', sanitize(body.projectName),
      '--framework', sanitize(body.framework),
      '--modules', modulesStr,
      '--json',
      '--no-install',
      '--zip',
      '--output', outputDir,
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

    const { stdout } = await runCli(args, cliPath);

    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch {
      return {
        success: false,
        error: "Failed to parse CLI output",
      };
    }

    if (!result.success || !result.zipPath) {
      return result;
    }

    await prisma.project.create({
      data: {
        name: body.projectName,
        user: {
          connect: { id: session.user.id },
        },
        framework: {
          connect: { id: body.framework },
        },
        modules: {
          create: body.modules.map((moduleId) => ({
            module: {
              connect: { id: moduleId },
            },
          })),
        },
      },
    });

    const zipPath = result.zipPath;
    const zipBuffer = fs.readFileSync(zipPath);
    const fileName = `${body.projectName}.zip`;

    fs.unlinkSync(zipPath);

    setHeader(event, 'Content-Type', 'application/zip');
    setHeader(event, 'Content-Disposition', `attachment; filename="${fileName}"`);
    setHeader(event, 'Content-Length', zipBuffer.length.toString());

    return send(event, zipBuffer);
  } catch (err) {
    const error = err as Error & { stderr?: string };
    return {
      success: false,
      error: error.message,
      stderr: error.stderr
    };
  }
});
