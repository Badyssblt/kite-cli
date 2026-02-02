import { defineEventHandler, readBody, setHeader, send } from "h3";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import { prisma } from "~~/server/utils/db";
import { auth } from "~~/lib/auth";

const execAsync = promisify(exec);

interface CreateProjectBody {
  projectName: string;
  framework: string;
  modules: string[];
}

export default defineEventHandler(async (event) => {
  try {
    // Vérifier l'authentification
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

    const modulesArg = `--modules "${body.modules?.length > 0 ? body.modules.join(',') : 'none'}"`;

    // Chemin vers la CLI (monté dans le container Docker)
    const cliPath = process.env.KITE_CLI_PATH || '/cli';
    const outputDir = '/tmp/kite-projects';

    // Créer le dossier de sortie s'il n'existe pas
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const command = `cd "${cliPath}" && npx ts-node src/index.ts create --name "${body.projectName}" --framework "${body.framework}" ${modulesArg} --json --no-install --zip --output "${outputDir}"`;

    const { stdout, stderr } = await execAsync(command, {
      timeout: 120000, // 2 minutes timeout
    });

    // Parser la sortie JSON
    let result;
    try {
      result = JSON.parse(stdout.trim());
    } catch {
      return {
        success: false,
        error: "Failed to parse CLI output",
        stdout,
        stderr
      };
    }

    if (!result.success || !result.zipPath) {
      return result;
    }

    // Sauvegarder le projet en base de données
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

    // Lire le fichier zip et le retourner
    const zipPath = result.zipPath;
    const zipBuffer = fs.readFileSync(zipPath);
    const fileName = `${body.projectName}.zip`;

    // Supprimer le fichier zip après lecture
    fs.unlinkSync(zipPath);

    // Définir les headers pour le téléchargement
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
