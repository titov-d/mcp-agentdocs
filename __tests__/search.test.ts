import { describe, it, expect } from "vitest";
import { search, tokenize } from "../src/corpus/search.js";
import { splitSections } from "../src/corpus/loader.js";
import type { Corpus, DocMeta } from "../src/types.js";

function makeCorpus(): Corpus {
  const docs: DocMeta[] = [
    {
      id: "transports",
      title: "Transports",
      topic: "mcp",
      sourceUrl: "https://example.com/transports",
      fetchedAt: "2026-06-11",
      verified: true,
      file: "transports.md",
    },
    {
      id: "agents",
      title: "Agents",
      topic: "agent-sdk",
      sourceUrl: "https://example.com/agents",
      fetchedAt: "2026-06-11",
      verified: false,
      file: "agents.md",
    },
  ];
  const transports =
    "## stdio\nThe server writes JSON-RPC to stdout and logs to stderr.\n## Streamable HTTP\nUses POST and GET with an Origin header check.";
  const agents = "## Loop\nThe agent loop calls tools until done.";
  const contentById = new Map([
    ["transports", transports],
    ["agents", agents],
  ]);
  const sections = [
    ...splitSections(transports, "transports"),
    ...splitSections(agents, "agents"),
  ];
  return {
    version: "test",
    docs,
    sections,
    contentById,
    metaById: new Map(docs.map((d) => [d.id, d])),
  };
}

describe("tokenize", () => {
  it("should lowercase and split on non-alphanumerics", () => {
    expect(tokenize("Streamable HTTP, POST/GET!")).toEqual(["streamable", "http", "post", "get"]);
  });
});

describe("search", () => {
  const corpus = makeCorpus();

  it("should return empty for an empty query", () => {
    expect(search(corpus, "   ")).toEqual([]);
  });

  it("should rank a heading match above a body-only match", () => {
    const hits = search(corpus, "stdio");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits[0]!.heading.toLowerCase()).toContain("stdio");
  });

  it("should carry source metadata into hits", () => {
    const hit = search(corpus, "origin")[0]!;
    expect(hit.docId).toBe("transports");
    expect(hit.sourceUrl).toBe("https://example.com/transports");
    expect(hit.verified).toBe(true);
  });

  it("should filter by topic", () => {
    const mcpHits = search(corpus, "loop", "mcp");
    expect(mcpHits).toEqual([]);
    const sdkHits = search(corpus, "loop", "agent-sdk");
    expect(sdkHits[0]!.docId).toBe("agents");
  });

  it("should produce a snippet containing the matched term", () => {
    const hit = search(corpus, "stderr")[0]!;
    expect(hit.snippet.toLowerCase()).toContain("stderr");
  });
});
