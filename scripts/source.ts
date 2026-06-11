/**
 * Shared source-fetching + normalization for corpus refresh tooling.
 * Not shipped in the package (scripts/ is excluded from `files`).
 */

/** Both doc sites serve clean markdown at the `.md` suffix. */
export function toMarkdownUrl(url: string): string {
  const md = url.endsWith(".md");
  if (md) return url;
  if (url.includes("modelcontextprotocol.io")) return `${url}.md`;
  if (url.includes("platform.claude.com")) return `${url}.md`;
  return url;
}

/**
 * Strip volatile boilerplate so cosmetic changes don't read as drift:
 * remove a leading docs-index blockquote banner some sources prepend,
 * normalize line endings, collapse 3+ blank lines, and trim.
 */
export function normalizeSource(text: string): string {
  let t = text.replace(/\r\n/g, "\n");
  t = t.replace(/^(?:>[^\n]*\n)+\n?/, ""); // leading "> ## Documentation Index ..." banner
  t = t.replace(/\n{3,}/g, "\n\n");
  return t.trim();
}

export async function fetchSourceText(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return await res.text();
}
