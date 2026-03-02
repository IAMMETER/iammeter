// tools/generate-app-index.mjs
import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const appsDir = path.join(ROOT, "apps");

// GitHub Pages base
const DEFAULT_PAGES_BASE_URL =
  "https://iammeter.github.io/IAMMETER-OpenApps/";

function ensureTrailingSlash(u) {
  return u.endsWith("/") ? u : u + "/";
}

function stripLeadingSlash(p) {
  return p.startsWith("/") ? p.slice(1) : p;
}

function removeTrailingSlash(u) {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function buildUrl(base, relPath) {
  const b = ensureTrailingSlash(base);
  const p = stripLeadingSlash(relPath);
  return new URL(p, b).toString();
}

async function main() {
  const manifestFiles = await fg(["apps/*/manifest.json"]);
  const apps = [];

  const pagesBase = ensureTrailingSlash(
    (process.env.PAGES_BASE_URL &&
      process.env.PAGES_BASE_URL.trim()) ||
      DEFAULT_PAGES_BASE_URL
  );

  for (const file of manifestFiles) {
    const fullPath = path.join(ROOT, file);
    const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    const entryPath = `apps/${manifest.id}/${manifest.entry}`;

    const app = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      tags: manifest.tags,
      runtime: manifest.runtime,
      entry: entryPath,

      // ✅ 统一去掉 source 末尾 /
      source: manifest.links?.source
        ? removeTrailingSlash(manifest.links.source.trim())
        : null,

      docs: manifest.links?.docs || null,

      hostedUrl: manifest.hosted?.hostedUrl || null,
      hostedStatus: manifest.hosted?.status || null
    };

    // ✅ Only static apps get pagesUrl + previewUrl
    if (manifest.runtime === "static") {
      app.pagesUrl = buildUrl(pagesBase, entryPath);
      app.previewUrl = app.pagesUrl;
    }

    apps.push(app);
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

main().catch((err) => {
  console.error("❌ Failed to generate apps/index.json");
  console.error(err);
  process.exit(1);
});