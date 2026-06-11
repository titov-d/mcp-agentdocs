import fallback from "../data/freshness.json";

const CDN_MANIFEST = "https://cdn.jsdelivr.net/npm/mcp-agentdocs@latest/corpus/manifest.json";
const CDN_CHANGELOG = "https://cdn.jsdelivr.net/npm/mcp-agentdocs@latest/CHANGELOG.md";

export interface DocEntry {
  id: string;
  title: string;
  topic: string;
  sourceUrl: string;
  verifiedAt: string;
}
export interface ChangelogEntry {
  date: string;
  items: string[];
}
export interface Freshness {
  lastVerified: string | null;
  docCount: number;
  topics: string[];
  docs: DocEntry[];
  changelog: ChangelogEntry[];
  source: "cdn" | "local";
}

interface ManifestDoc {
  id: string;
  title: string;
  topic: string;
  sourceUrl: string;
  verifiedAt?: string;
}

async function fetchText(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    return res.ok ? await res.text() : null;
  } catch {
    return null;
  }
}

function parseChangelog(md: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  let cur: ChangelogEntry | null = null;
  for (const line of md.split("\n")) {
    const h = line.match(/^##\s+(\d{4}-\d{2}-\d{2})/);
    if (h) {
      cur = { date: h[1] ?? "", items: [] };
      entries.push(cur);
      continue;
    }
    const b = line.match(/^\s*-\s+(.*\S)/);
    if (b && cur) cur.items.push((b[1] ?? "").trim());
  }
  return entries;
}

/**
 * Prefer the published manifest (jsDelivr) so the site can never claim freshness
 * the installable package doesn't have. Falls back to the corpus bundled at
 * build time when the package isn't published yet.
 */
export async function getFreshness(): Promise<Freshness> {
  const manifestRaw = await fetchText(CDN_MANIFEST);
  if (!manifestRaw) return fallback as Freshness;

  const docs: DocEntry[] = (JSON.parse(manifestRaw).docs as ManifestDoc[]).map((d) => ({
    id: d.id,
    title: d.title,
    topic: d.topic,
    sourceUrl: d.sourceUrl,
    verifiedAt: d.verifiedAt ?? "",
  }));
  const verified = docs.map((d) => d.verifiedAt).filter(Boolean).sort();
  const changelogRaw = await fetchText(CDN_CHANGELOG);

  return {
    lastVerified: verified.length ? (verified[verified.length - 1] ?? null) : null,
    docCount: docs.length,
    topics: [...new Set(docs.map((d) => d.topic))],
    docs,
    changelog: changelogRaw ? parseChangelog(changelogRaw) : (fallback as Freshness).changelog,
    source: "cdn",
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "2026-06-11" -> "June 11, 2026" (deterministic, locale-free). */
export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return iso;
  const year = m[1];
  const month = MONTHS[Number(m[2]) - 1] ?? m[2];
  const day = Number(m[3]);
  return `${month} ${day}, ${year}`;
}
