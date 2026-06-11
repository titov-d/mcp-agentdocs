import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadCorpus } from "../src/corpus/loader.js";
import type { Manifest } from "../src/types.js";

const corpusDir = join(dirname(fileURLToPath(import.meta.url)), "..", "corpus");

describe("corpus manifest integrity", () => {
  const manifest = JSON.parse(
    readFileSync(join(corpusDir, "manifest.json"), "utf8"),
  ) as Manifest;

  it("should declare a version and at least one doc", () => {
    expect(manifest.version).toBeTruthy();
    expect(manifest.docs.length).toBeGreaterThan(0);
  });

  it("every manifest entry resolves to an existing, non-empty file", () => {
    for (const doc of manifest.docs) {
      const path = join(corpusDir, doc.file);
      expect(existsSync(path), `missing file for ${doc.id}: ${doc.file}`).toBe(true);
      expect(readFileSync(path, "utf8").trim().length).toBeGreaterThan(0);
    }
  });

  it("every entry has required, well-typed metadata", () => {
    for (const doc of manifest.docs) {
      expect(doc.id, "id").toBeTruthy();
      expect(doc.title, "title").toBeTruthy();
      expect(doc.topic, "topic").toBeTruthy();
      expect(doc.sourceUrl.startsWith("http"), `sourceUrl for ${doc.id}`).toBe(true);
      expect(typeof doc.verified, `verified flag for ${doc.id}`).toBe("boolean");
    }
  });

  it("doc ids are unique", () => {
    const ids = manifest.docs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("loadCorpus parses the real corpus into sections", () => {
    const corpus = loadCorpus(corpusDir);
    expect(corpus.sections.length).toBeGreaterThan(0);
    expect(corpus.contentById.size).toBe(manifest.docs.length);
  });
});
