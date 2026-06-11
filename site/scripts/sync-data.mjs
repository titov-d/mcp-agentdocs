/**
 * Build-time data sync. Reads the package corpus (one level up in the monorepo)
 * and writes a bundled fallback at data/freshness.json, so the site always
 * renders even before the package is published to npm. At runtime the site
 * prefers the published manifest via jsDelivr (see lib/data.ts); this file is
 * the offline/pre-publish fallback.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, "..");
const repoRoot = join(siteRoot, "..");

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return null;
  }
}

function parseChangelog(md) {
  const entries = [];
  let cur = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (h) {
      cur = { date: h[1], items: [] };
      entries.push(cur);
      continue;
    }
    const b = line.match(/^\s*-\s+(.*\S)/);
    if (b && cur) cur.items.push(b[1].trim());
  }
  return entries;
}

const manifestRaw = safeRead(join(repoRoot, "corpus", "manifest.json"));
const changelogRaw = safeRead(join(repoRoot, "CHANGELOG.md")) ?? "";

const docs = [];
if (manifestRaw) {
  const m = JSON.parse(manifestRaw);
  for (const d of m.docs ?? []) {
    docs.push({
      id: d.id,
      title: d.title,
      topic: d.topic,
      sourceUrl: d.sourceUrl,
      verifiedAt: d.verifiedAt ?? "",
    });
  }
}

const verifiedDates = docs.map((d) => d.verifiedAt).filter(Boolean).sort();
const freshness = {
  lastVerified: verifiedDates.length ? verifiedDates[verifiedDates.length - 1] : null,
  docCount: docs.length,
  topics: [...new Set(docs.map((d) => d.topic))],
  docs,
  changelog: parseChangelog(changelogRaw),
  source: "local",
};

mkdirSync(join(siteRoot, "data"), { recursive: true });
writeFileSync(join(siteRoot, "data", "freshness.json"), JSON.stringify(freshness, null, 2) + "\n", "utf8");
process.stdout.write(`sync-data: wrote data/freshness.json (${docs.length} docs)\n`);
