#!/usr/bin/env node
/** agentdocs — entry point. Loads the corpus and serves it over MCP stdio. */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { corpusDir, SERVER_NAME, SERVER_VERSION } from "./config.js";
import { loadCorpus } from "./corpus/loader.js";
import { buildServer } from "./server.js";

async function main(): Promise<void> {
  const corpus = loadCorpus(corpusDir());
  const server = buildServer(corpus);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is reserved for the MCP protocol; logs go to stderr.
  console.error(
    `${SERVER_NAME} v${SERVER_VERSION} running on stdio — corpus ${corpus.version}, ${corpus.docs.length} docs`,
  );
}

main().catch((error: unknown) => {
  console.error("Fatal error starting agentdocs:", error);
  process.exit(1);
});
