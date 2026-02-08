import { Command } from "commander";
import path from "path";
import { promises as fs } from "fs"
import { promptService } from "../services/prompt.service";

type kiteConfig = {
    provider: "github" | "gitlab" | "bitbucket",
    repository: string,
}

export async function writeKiteConfig(rootDir: string, config: kiteConfig): Promise<void> {
    const kiteDir = path.join(rootDir, ".kite");
    const filePath = path.join(kiteDir, "config.json");

    await fs.mkdir(kiteDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf-8");
}

export const initCommand = new Command("init")
.action(async () => {
    const rootDir = process.cwd();
    const config: kiteConfig = {
        provider: "github",
        repository: "my-repo",
    };

    const provider = await promptService.askProvider();

    config.provider = provider as "github" | "gitlab" | "bitbucket";
    
    writeKiteConfig(rootDir, config);
})