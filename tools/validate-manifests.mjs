import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import fg from "fast-glob";
import Ajv from "ajv";
import addFormats from "ajv-formats";

const ROOT = process.cwd();
const SCHEMA_PATH = path.join(ROOT, "schemas", "app-manifest.schema.json");

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch (e) {
    fail(`Invalid JSON: ${p}\n${e.message}`);
  }
}

function exists(relOrAbs, baseDir) {
  const p = path.isAbsolute(relOrAbs) ? relOrAbs : path.join(baseDir, relOrAbs);
  return fs.existsSync(p);
}

const schema = loadJson(SCHEMA_PATH);
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

const manifestFiles = await fg(["apps/*/manifest.json"], { dot: false });

if (manifestFiles.length === 0) {
  fail("No manifests found under apps/*/manifest.json");
}

let okCount = 0;

for (const mf of manifestFiles) {
  const absMf = path.join(ROOT, mf);
  const appDir = path.dirname(absMf);
  const appId = path.basename(appDir);

  const manifest = loadJson(absMf);

  // 1) Schema validate
  const valid = validate(manifest);
  if (!valid) {
    console.error(`\n❌ Schema errors in ${mf}`);
    for (const err of validate.errors || []) {
      console.error(`  - ${err.instancePath || "(root)"} ${err.message}`);
    }
    process.exit(1);
  }

  // 2) id must match directory name
  if (manifest.id !== appId) {
    fail(`Manifest id mismatch: ${mf}\n  manifest.id="${manifest.id}" but folder="${appId}"`);
  }

  // 3) entry must exist
  if (!exists(manifest.entry, appDir)) {
    fail(`Entry not found: ${mf}\n  entry="${manifest.entry}"\n  expected at: ${path.join(appDir, manifest.entry)}`);
  }

  // 4) hosted runtime contract check (extra safety)
  if (manifest.runtime === "hosted") {
    const gw = manifest.hosted?.gateway;
    if (!gw || gw.health !== "/health" || gw.wsPath !== "/ws" || gw.apiBase !== "/api") {
      fail(`Hosted gateway contract must be fixed to /health /ws /api: ${mf}`);
    }
  }

  okCount += 1;
}

console.log(`✅ Manifests validated: ${okCount}`);