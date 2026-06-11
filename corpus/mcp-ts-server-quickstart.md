How to build a minimal MCP server in TypeScript using the production SDK
(`@modelcontextprotocol/sdk`, v1.x) over the stdio transport. Verified against the
official "Build an MCP server" guide (2026-06).

## Install

```bash
npm install @modelcontextprotocol/sdk zod@3
```

The production SDK is `@modelcontextprotocol/sdk` (v1.x). A `@modelcontextprotocol/server`
v2 line exists but is pre-alpha — use v1 for anything shippable. Input schemas use Zod 3.

## Imports and server instance

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "weather", version: "1.0.0" });
```

Note the `.js` extensions on the import paths (required under Node16 ESM resolution).

## Registering a tool

`server.registerTool(name, config, handler)`. The `inputSchema` is a **raw shape object**
of Zod validators (not `z.object(...)`). The handler returns
`{ content: [{ type: "text", text }] }`.

```typescript
server.registerTool(
  "get_alerts",
  {
    description: "Get weather alerts for a state",
    inputSchema: {
      state: z.string().length(2).describe("Two-letter state code (e.g. CA, NY)"),
    },
  },
  async ({ state }) => {
    const text = `Active alerts for ${state.toUpperCase()}: ...`;
    return { content: [{ type: "text", text }] };
  },
);
```

Write tool descriptions prescriptively — state *when* to call the tool, not just what it
does. Recent models call tools conservatively, so trigger conditions in the description
raise the should-call rate.

## Connecting over stdio and running as a bin

```typescript
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // stdout is the MCP wire — logs MUST go to stderr.
  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
```

Make the entry file an executable: start `src/index.ts` with `#!/usr/bin/env node`, set
`"bin": { "name": "dist/index.js" }` and `"type": "module"` in package.json, compile to
`dist/`, and ship `dist/` via the package `files` allowlist.

## Wiring into a client

Claude Code: `claude mcp add weather -- node /abs/path/dist/index.js`. Cursor and other
clients use an `mcp.json` entry of the form `{ "command": "node", "args": ["/abs/path/dist/index.js"] }`.
Test interactively with the MCP Inspector before publishing.
