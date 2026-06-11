/** Shared types for the agentdocs corpus and retrieval layer. */

/** Metadata for one curated document, as stored in corpus/manifest.json. */
export interface DocMeta {
  /** Stable identifier, e.g. "mcp-transports". */
  id: string;
  /** Human-readable title. */
  title: string;
  /** Topic group used for filtering, e.g. "mcp" | "agent-sdk" | "claude-code". */
  topic: string;
  /** Canonical upstream URL this doc was curated from. */
  sourceUrl: string;
  /** ISO date the content was last fetched from source. */
  fetchedAt: string;
  /** True only after a maintainer verified the document against its primary source. */
  verified: boolean;
  /** ISO date the verification was recorded. Present iff verified is true. */
  verifiedAt?: string;
  /** Markdown filename inside corpus/, relative to the manifest. */
  file: string;
}

/** The corpus manifest file shape. */
export interface Manifest {
  /** Upstream spec/SDK version the corpus tracks, e.g. "2025-11-25". */
  version: string;
  /** ISO date the corpus was generated. */
  generatedAt: string;
  docs: DocMeta[];
}

/** A heading-delimited section of a document, the unit of retrieval. */
export interface Section {
  docId: string;
  /** Nearest heading text for this section ("" for pre-heading preamble). */
  heading: string;
  /** Section body (markdown). */
  content: string;
}

/** A loaded, in-memory corpus ready for retrieval. */
export interface Corpus {
  version: string;
  docs: DocMeta[];
  sections: Section[];
  /** Full markdown content keyed by doc id. */
  contentById: Map<string, string>;
  metaById: Map<string, DocMeta>;
}

/** One ranked search result returned by search_docs. */
export interface SearchHit {
  docId: string;
  title: string;
  topic: string;
  heading: string;
  snippet: string;
  sourceUrl: string;
  verified: boolean;
}
