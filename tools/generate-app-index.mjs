import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const appsDir = path.join(ROOT, "apps");

async function main() {
  const manifestFiles = await fg(["apps/*/manifest.json"]);

  const apps = [];

  for (const file of manifestFiles) {
    const fullPath = path.join(ROOT, file);
    const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    apps.push({
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      tags: manifest.tags,
      runtime: manifest.runtime,
      entry: `apps/${manifest.id}/${manifest.entry}`,
      hostedUrl: manifest.hosted?.hostedUrl || null,
      hostedStatus: manifest.hosted?.status || null
    });
  }

  apps.sort((a, b) => a.id.localeCompare(b.id));

  const outputPath = path.join(appsDir, "index.json");

  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: apps.length,
        apps
      },
      null,
      2
    )
  );

  console.log(`✅ Generated apps/index.json (${apps.length} apps)`);
}

main();