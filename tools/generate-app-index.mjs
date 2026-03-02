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

function removeTrailingSlash(u) {
  return u.endsWith("/") ? u.slice(0, -1) : u;
}

function buildUrl(base, relPath) {
  const b = ensureTrailingSlash(base);
  const p = relPath.startsWith("/") ? relPath.slice(1) : relPath;
  return new URL(p, b).toString();
}

function buildGitHubDirUrl(repoRoot, appId) {
  return `${repoRoot}/tree/main/apps/${appId}`;
}

function buildGitHubBlobUrl(repoRoot, filePath) {
  return `${repoRoot}/blob/main/${filePath}`;
}

function buildRawUrl(repoRoot, filePath) {
  // repoRoot: https://github.com/owner/repo
  const parts = repoRoot.replace("https://github.com/", "").split("/");
  const owner = parts[0];
  const repo = parts[1];
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
}

async function main() {
  const manifestFiles = await fg(["apps/*/manifest.json"]);
  const apps = [];

  const pagesBase = ensureTrailingSlash(
    process.env.PAGES_BASE_URL || DEFAULT_PAGES_BASE_URL
  );

  for (const file of manifestFiles) {
    const fullPath = path.join(ROOT, file);
    const manifest = JSON.parse(fs.readFileSync(fullPath, "utf8"));

    const repoRoot = removeTrailingSlash(manifest.links?.source || "");
    const entryPath = `apps/${manifest.id}/${manifest.entry}`;
    const docsPath = manifest.links?.docs || "";

    const app = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      tags: manifest.tags,
      runtime: manifest.runtime,

      // Original entry path (relative to repo root)
      entry: entryPath,

      // Repository info
      repoUrl: repoRoot,
      appDirUrl: repoRoot
        ? buildGitHubDirUrl(repoRoot, manifest.id)
        : null,

      // Docs URL
      docsUrl:
        repoRoot && docsPath
          ? buildGitHubBlobUrl(repoRoot, docsPath)
          : null,

      // Raw entry file (useful for debugging / advanced usage)
      rawFileUrl:
        repoRoot
          ? buildRawUrl(repoRoot, entryPath)
          : null
    };

    // Only for static apps
    if (manifest.runtime === "static") {
      app.pagesUrl = buildUrl(pagesBase, entryPath);
      app.previewUrl = app.pagesUrl;
    }

    // Hosted info (kept as-is)
    if (manifest.runtime === "hosted") {
      app.hostedUrl = manifest.hosted?.hostedUrl || null;
      app.hostedStatus = manifest.hosted?.status || null;
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