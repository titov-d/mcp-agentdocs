/** Builds the MCP server and registers the agentdocs tools over a loaded corpus. */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SERVER_NAME, SERVER_VERSION } from "./config.js";
import { search } from "./corpus/search.js";
import type { Corpus } from "./types.js";

function text(body: string) {
  return { content: [{ type: "text" as const, text: body }] };
}

/** Construct the MCP server with all tools wired to the given corpus. */
export function buildServer(corpus: Corpus): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    "list_topics",
    {
      description:
        "List every curated document available, with its topic, source URL, and last-verified date. " +
        "Call this first to see what is covered before searching.",
      inputSchema: {},
    },
    async () => {
      const lines = corpus.docs.map(
        (d) =>
          `- [${d.id}] ${d.title} (topic: ${d.topic}, verified: ${d.verified}, source: ${d.sourceUrl})`,
      );
      return text(
        `agentdocs corpus v${corpus.version} — ${corpus.docs.length} documents:\n\n${lines.join("\n")}`,
      );
    },
  );

  server.registerTool(
    "search_docs",
    {
      description:
        "Search the curated, source-verified docs for building MCP servers and Claude agents. " +
        "Use this whenever you need current, accurate details about MCP (transports, tools, resources, " +
        "lifecycle, auth), the Claude Agent SDK, or Claude Code — instead of relying on memory, which is " +
        "often stale for these fast-moving APIs. Returns ranked snippets with their source URLs.",
      inputSchema: {
        query: z.string().describe("What to look for, e.g. 'streamable http transport auth'."),
        topic: z
          .string()
          .optional()
          .describe("Optional topic filter, e.g. 'mcp', 'agent-sdk', or 'claude-code'."),
      },
    },
    async ({ query, topic }) => {
      const hits = search(corpus, query, topic);
      if (hits.length === 0) {
        return text(`No matches for "${query}"${topic ? ` in topic "${topic}"` : ""}.`);
      }
      const blocks = hits.map(
        (h) =>
          `### ${h.title} — ${h.heading || "(intro)"} [${h.docId}]\n` +
          `source: ${h.sourceUrl} (verified: ${h.verified})\n\n${h.snippet}`,
      );
      return text(blocks.join("\n\n---\n\n"));
    },
  );

  server.registerTool(
    "get_doc",
    {
      description:
        "Fetch the full curated markdown of one document by its id (from list_topics or search_docs). " +
        "Use when a snippet is not enough and you need the complete, verified document.",
      inputSchema: {
        id: z.string().describe("Document id, e.g. 'mcp-transports'."),
      },
    },
    async ({ id }) => {
      const meta = corpus.metaById.get(id);
      const content = corpus.contentById.get(id);
      if (!meta || content === undefined) {
        const ids = corpus.docs.map((d) => d.id).join(", ");
        return text(`Unknown doc id "${id}". Available ids: ${ids}`);
      }
      return text(
        `# ${meta.title}\nsource: ${meta.sourceUrl}\nlast verified: ${meta.fetchedAt} (verified: ${meta.verified})\n\n${content}`,
      );
    },
  );

  return server;
}
