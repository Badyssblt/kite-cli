import { execa } from "execa";

export async function installDeps(cwd: string) {
  await execa("npm", ["install"], {
    cwd,
    stdio: "inherit",
  });
}
