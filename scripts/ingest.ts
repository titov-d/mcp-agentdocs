/**
 * Corpus refresh helper (not shipped in the package).
 *
 * Fetches each source URL from corpus/manifest.json into corpus/_staging/ for
 * human review. It NEVER overwrites a curated corpus/*.md directly — per the
 * data-integrity rule, a human diffs the staged copy against the live doc,
 * promotes it, and flips `verified` in the manifest only after checking it
 * against the source.
 *
 * Usage: npm run ingest
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

interface DocMeta {
  id: string;
  sourceUrl: string;
  file: string;
}
interface Manifest {
  docs: DocMeta[];
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const corpus = join(root, "corpus");
const staging = join(corpus, "_staging");

/** modelcontextprotocol.io serves clean markdown at the `.md` suffix. */
function toMarkdownUrl(url: string): string {
  if (url.includes("modelcontextprotocol.io") && !url.endsWith(".md")) return `${url}.md`;
  return url;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(readFileSync(join(corpus, "manifest.json"), "utf8")) as Manifest;
  mkdirSync(staging, { recursive: true });

  let changed = 0;
  for (const doc of manifest.docs) {
    const url = toMarkdownUrl(doc.sourceUrl);
    process.stderr.write(`fetching ${doc.id} <- ${url}\n`);
    const res = await fetch(url);
    if (!res.ok) {
      process.stderr.write(`  ! ${res.status} ${res.statusText} — skipped\n`);
      continue;
    }
    const fresh = (await res.text()).trim();
    const stagePath = join(staging, doc.file);
    writeFileSync(stagePath, fresh + "\n", "utf8");

    const livePath = join(corpus, doc.file);
    const live = existsSync(livePath) ? readFileSync(livePath, "utf8").trim() : "";
    if (live !== fresh) {
      changed++;
      process.stderr.write(`  ~ differs from live corpus/${doc.file} — review & re-verify\n`);
    } else {
      process.stderr.write(`  = unchanged\n`);
    }
  }

  process.stderr.write(
    `\nDone. ${changed} doc(s) changed. Staged in corpus/_staging/.\n` +
      `Review each diff against its source, promote into corpus/, and set verified:true ` +
      `in manifest.json ONLY after human verification.\n`,
  );
}

main().catch((err: unknown) => {
  process.stderr.write(`ingest failed: ${String(err)}\n`);
  process.exit(1);
});
