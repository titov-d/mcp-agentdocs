/**
 * Corpus freshness checker (not shipped in the package).
 *
 * Two jobs, per the refresh policy:
 *   1. Staleness ceiling — flag docs whose `verifiedAt` is older than
 *      MAX_VERIFIED_AGE_DAYS, regardless of source changes.
 *   2. Drift detection — fetch each source and diff it against the snapshot
 *      taken at verification time (corpus/_sources/<id>.md). Any difference is
 *      a signal to re-verify.
 *
 * Usage:
 *   npm run check-freshness          # check; nonzero exit if anything needs attention
 *   npm run seed-sources             # (re)write all source snapshots after verifying
 *   npm run seed-sources -- <id...>  # seed only specific docs
 *
 * Exit is nonzero when any doc is stale, drifted, unseeded, or unreachable,
 * so CI can open a re-verification issue. Verification stays a human step:
 * this tool never flips `verified` in the manifest.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_VERIFIED_AGE_DAYS } from "../src/config.js";
import { toMarkdownUrl, fetchSourceText, normalizeSource } from "./source.js";
import { daysBetween, isStale, classifyDrift, type DriftStatus } from "./freshness.js";

interface DocMeta {
  id: string;
  sourceUrl: string;
  verifiedAt: string;
}
interface Manifest {
  docs: DocMeta[];
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = join(root, "corpus");
const sourcesDir = join(corpus, "_sources");

const snapshotPath = (id: string): string => join(sourcesDir, `${id}.md`);

function readSnapshot(id: string): string | null {
  const p = snapshotPath(id);
  return existsSync(p) ? normalizeSource(readFileSync(p, "utf8")) : null;
}

const today = (): string => new Date().toISOString().slice(0, 10);

async function seed(docs: DocMeta[], only: string[]): Promise<void> {
  mkdirSync(sourcesDir, { recursive: true });
  const targets = only.length ? docs.filter((d) => only.includes(d.id)) : docs;
  for (const doc of targets) {
    const url = toMarkdownUrl(doc.sourceUrl);
    process.stderr.write(`seeding ${doc.id} <- ${url}\n`);
    const text = await fetchSourceText(url);
    writeFileSync(snapshotPath(doc.id), normalizeSource(text) + "\n", "utf8");
  }
  process.stderr.write(`\nSeeded ${targets.length} snapshot(s) in corpus/_sources/.\n`);
}

interface Row {
  id: string;
  ageDays: number;
  stale: boolean;
  drift: DriftStatus | "error";
  note?: string;
}

async function check(docs: DocMeta[]): Promise<Row[]> {
  const now = today();
  const rows: Row[] = [];
  for (const doc of docs) {
    const ageDays = daysBetween(doc.verifiedAt, now);
    const stale = isStale(doc.verifiedAt, now, MAX_VERIFIED_AGE_DAYS);
    const snapshot = readSnapshot(doc.id);
    let drift: DriftStatus | "error" = "ok";
    let note: string | undefined;
    if (snapshot === null) {
      drift = "unseeded";
    } else {
      try {
        const current = normalizeSource(await fetchSourceText(toMarkdownUrl(doc.sourceUrl)));
        drift = classifyDrift(snapshot, current);
      } catch (err) {
        drift = "error";
        note = String(err);
      }
    }
    rows.push({ id: doc.id, ageDays, stale, drift, note });
  }
  return rows;
}

function report(rows: Row[]): boolean {
  let needsAttention = false;
  process.stderr.write(`\nCorpus freshness — ${today()} (ceiling ${MAX_VERIFIED_AGE_DAYS}d)\n`);
  for (const r of rows) {
    const flags: string[] = [];
    if (r.stale) flags.push(`STALE(${r.ageDays}d)`);
    if (r.drift !== "ok") flags.push(r.drift.toUpperCase());
    const ok = flags.length === 0;
    if (!ok) needsAttention = true;
    process.stderr.write(
      `  ${ok ? "=" : "~"} ${r.id} ${ok ? "ok" : flags.join(" ")}${r.note ? ` — ${r.note}` : ""}\n`,
    );
  }
  process.stdout.write(
    JSON.stringify({ checkedAt: today(), maxAgeDays: MAX_VERIFIED_AGE_DAYS, rows }, null, 2) + "\n",
  );
  process.stderr.write(
    needsAttention
      ? `\nRe-verification needed. Verify flagged docs against their sources, bump verifiedAt + CHANGELOG, then: npm run seed-sources -- <id...>\n`
      : `\nAll docs fresh and seeded.\n`,
  );
  return needsAttention;
}

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  const doSeed = argv.includes("--seed");
  const ids = argv.filter((a) => !a.startsWith("--"));
  const manifest = JSON.parse(readFileSync(join(corpus, "manifest.json"), "utf8")) as Manifest;

  if (doSeed) {
    await seed(manifest.docs, ids);
    return;
  }
  if (report(await check(manifest.docs))) process.exit(1);
}

main().catch((err: unknown) => {
  process.stderr.write(`check-freshness failed: ${String(err)}\n`);
  process.exit(1);
});
