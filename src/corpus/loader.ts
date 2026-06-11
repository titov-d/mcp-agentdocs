/** Loads the curated corpus from disk into an in-memory, searchable structure. */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Corpus, DocMeta, Manifest, Section } from "../types.js";

/**
 * Split a markdown document into heading-delimited sections.
 * Pure and deterministic — exported for testing. Content before the first
 * heading is captured as a section with an empty heading.
 */
export function splitSections(markdown: string, docId: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let heading = "";
  let buffer: string[] = [];

  const flush = () => {
    const content = buffer.join("\n").trim();
    if (content.length > 0) sections.push({ docId, heading, content });
    buffer = [];
  };

  for (const line of lines) {
    const match = /^#{1,4}\s+(.*)$/.exec(line);
    if (match) {
      flush();
      heading = (match[1] ?? "").trim();
    } else {
      buffer.push(line);
    }
  }
  flush();
  return sections;
}

/** Load and validate the corpus from a directory containing manifest.json. */
export function loadCorpus(dir: string): Corpus {
  const manifestRaw = readFileSync(join(dir, "manifest.json"), "utf8");
  const manifest = JSON.parse(manifestRaw) as Manifest;

  const sections: Section[] = [];
  const contentById = new Map<string, string>();
  const metaById = new Map<string, DocMeta>();

  for (const doc of manifest.docs) {
    const content = readFileSync(join(dir, doc.file), "utf8");
    contentById.set(doc.id, content);
    metaById.set(doc.id, doc);
    sections.push(...splitSections(content, doc.id));
  }

  return {
    version: manifest.version,
    docs: manifest.docs,
    sections,
    contentById,
    metaById,
  };
}
