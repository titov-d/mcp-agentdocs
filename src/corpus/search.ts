/** Pure keyword/section retrieval over a loaded corpus. No I/O — fully testable. */

import { MAX_RESULTS, SNIPPET_RADIUS } from "../config.js";
import type { Corpus, SearchHit, Section } from "../types.js";

/**
 * Tokenize text into lowercase terms. Uses Unicode-aware matching so queries
 * in Cyrillic, CJK, etc. are not silently stripped.
 */
export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}]+/gu);
  return matches ?? [];
}

/** Build a snippet centered on the first query-term occurrence. */
function buildSnippet(content: string, terms: string[]): string {
  const haystack = content.toLowerCase();
  let firstIdx = -1;
  for (const term of terms) {
    const idx = haystack.indexOf(term);
    if (idx !== -1 && (firstIdx === -1 || idx < firstIdx)) firstIdx = idx;
  }
  const center = firstIdx === -1 ? 0 : firstIdx;
  const start = Math.max(0, center - SNIPPET_RADIUS);
  const end = Math.min(content.length, center + SNIPPET_RADIUS);
  const prefix = start > 0 ? "…" : "";
  const suffix = end < content.length ? "…" : "";
  return prefix + content.slice(start, end).trim() + suffix;
}

/** Score a section against query terms; heading matches weigh more than body. */
function scoreSection(section: Section, terms: string[]): number {
  const headingTokens = new Set(tokenize(section.heading));
  const bodyTokens = tokenize(section.content);
  const bodyCounts = new Map<string, number>();
  for (const t of bodyTokens) bodyCounts.set(t, (bodyCounts.get(t) ?? 0) + 1);

  let score = 0;
  for (const term of terms) {
    if (headingTokens.has(term)) score += 5;
    score += bodyCounts.get(term) ?? 0;
  }
  return score;
}

/**
 * Rank corpus sections against a query. Optionally restrict to a topic.
 * Returns at most MAX_RESULTS hits, highest score first.
 */
export function search(corpus: Corpus, query: string, topic?: string): SearchHit[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];

  const scored: { section: Section; score: number }[] = [];
  for (const section of corpus.sections) {
    const meta = corpus.metaById.get(section.docId);
    if (!meta) continue;
    if (topic && meta.topic !== topic) continue;
    const score = scoreSection(section, terms);
    if (score > 0) scored.push({ section, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, MAX_RESULTS).map(({ section }) => {
    const meta = corpus.metaById.get(section.docId)!;
    return {
      docId: meta.id,
      title: meta.title,
      topic: meta.topic,
      heading: section.heading,
      snippet: buildSnippet(section.content, terms),
      sourceUrl: meta.sourceUrl,
      verified: meta.verified,
    };
  });
}
