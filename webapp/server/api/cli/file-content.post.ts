import { defineEventHandler, readBody } from "h3";
import { exec } from "child_process";
import { promisify } from "util";
import { redis, CACHE_KEYS } from "~~/server/utils/redis";

const execAsync = promisify(exec);

interface FileContentBody {
  framework: string;
  path: string;
  module?: string;
}

function getFileLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    vue: 'vue',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    prisma: 'prisma',
    yml: 'yaml',
    yaml: 'yaml',
    env: 'shell',
    sh: 'shell',
  };
  return languageMap[ext || ''] || 'text';
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<FileContentBody>(event);

    if (!body.framework || !body.path) {
      return { success: false, error: "framework and path are required" };
    }

    // Try cache first
    const cacheKey = CACHE_KEYS.FILE(body.framework, body.path, body.module);
    const cached = await redis.get(cacheKey);

    if (cached) {
      const data = JSON.parse(cached);
      return {
        success: true,
        path: data.path,
        language: getFileLanguage(data.path),
        content: data.content,
        fromCache: true,
      };
    }

    // Fallback to CLI
    const cliPath = process.env.KITE_CLI_PATH || '/cli';
    const moduleArg = body.module ? `--module "${body.module}"` : '';

    const command = `cd "${cliPath}" && npx ts-node src/index.ts file-content --framework "${body.framework}" --path "${body.path}" ${moduleArg} --json`;

    const { stdout } = await execAsync(command, { timeout: 10000 });

    return JSON.parse(stdout.trim());
  } catch (err) {
    const error = err as Error & { stderr?: string };
    return {
      success: false,
      error: error.message,
      stderr: error.stderr
    };
  }
});
