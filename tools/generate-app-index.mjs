import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";

const ROOT = process.cwd();
const appsDir = path.join(ROOT, "apps");

const DEFAULT_PAGES_BASE_URL =
  "https://iammeter.github.io/IAMMETER-OpenApps/";

const SCREENSHOT_EXTS = ["png", "jpg", "jpeg"];

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
  const parts = repoRoot.replace("https://github.com/", "").split("/");
  const owner = parts[0];
  const repo = parts[1];
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${filePath}`;
}

function findScreenshot(appId) {
  const appRoot = path.join(ROOT, "apps", appId);

  for (const ext of SCREENSHOT_EXTS) {
    const file = `screenshot.${ext}`;
    const full = path.join(appRoot, file);
    if (fs.existsSync(full)) {
      return `apps/${appId}/${file}`;
    }
  }

  return null;
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

    const repoRoot = removeTrailingSlash(
      manifest.links?.source || manifest.source || ""
    );    
    const entryPath = `apps/${manifest.id}/${manifest.entry}`;
    const docsPath =
      manifest.links?.docs || manifest.docs || "";
    const app = {
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      author: manifest.author,
      version: manifest.version,
      tags: manifest.tags,
      runtime: manifest.runtime,

      entry: entryPath,

      repoUrl: repoRoot,
      appDirUrl: repoRoot
        ? buildGitHubDirUrl(repoRoot, manifest.id)
        : null,

      docsUrl:
        repoRoot && docsPath
          ? buildGitHubBlobUrl(repoRoot, docsPath)
          : null,

      rawFileUrl:
        repoRoot
          ? buildRawUrl(repoRoot, entryPath)
          : null
    };

    if (manifest.runtime === "static") {
      app.pagesUrl = buildUrl(pagesBase, entryPath);
      app.previewUrl = app.pagesUrl;

      const screenshotRel = findScreenshot(manifest.id);
      if (screenshotRel) {
        app.screenshotUrl = buildUrl(pagesBase, screenshotRel);
      }
    }

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