# agentdocs

**Fresh, source-verified docs for building MCP servers and Claude agents — served straight to your AI coding agent over MCP.**

[![npm](https://img.shields.io/npm/v/agentdocs)](https://www.npmjs.com/package/agentdocs)
[![license: MIT](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
[![Model Context Protocol](https://img.shields.io/badge/MCP-server-blue)](https://modelcontextprotocol.io)

Coding agents hallucinate on fast-moving APIs like the Model Context Protocol and the Claude Agent SDK: training data lags the spec, so you get plausible-but-wrong imports, deprecated patterns, and invented options. `agentdocs` is a local MCP server that gives your agent a curated, **source-verified** corpus to search instead of guessing.

- 🔎 Three tools: `list_topics`, `search_docs`, `get_doc`
- 📎 Every answer is attributed to its upstream source URL
- 🏠 Runs **locally** over stdio — no account, no hosting, no data leaves your machine
- ✅ Each doc carries a `verified` flag set only after human review against the source

## Install & connect

Requires Node.js 18+.

### Claude Code

```bash
claude mcp add agentdocs -- npx -y agentdocs@latest
```

### Cursor / other MCP clients (`mcp.json`)

```json
{
  "mcpServers": {
    "agentdocs": {
      "command": "npx",
      "args": ["-y", "agentdocs@latest"]
    }
  }
}
```

Then ask your agent things like *"check agentdocs for how MCP stdio handles logging"* or
*"search agentdocs for the Streamable HTTP session header"* — it will call the tools and
answer from the verified corpus.

## Tools

| Tool | Use it to |
|------|-----------|
| `list_topics` | See every curated doc, its topic, source URL, and verified status |
| `search_docs(query, topic?)` | Get ranked, source-attributed snippets for a question |
| `get_doc(id)` | Read the full verified markdown of one document |

## What's covered (v1)

The Model Context Protocol (spec 2025-11-25) and building MCP servers / Claude agents.
Corpus grows over time; run `list_topics` for the current set.

## Freshness

Every document records the date it was last verified against its primary source. Sources
are diffed on a regular cadence; when one drifts, the affected doc is re-verified and a new
version is published. Using `agentdocs@latest` (as above) keeps you on the current corpus.
See [CHANGELOG.md](./CHANGELOG.md) for what changed and when.

## Development

```bash
npm install
npm run build      # tsc -> dist/
npm test           # vitest: retrieval, manifest integrity, unicode safety
npm run ingest     # refresh sources into corpus/_staging/ for human review
```

Curation is the point: `npm run ingest` fetches upstream sources for review but never
silently overwrites a curated doc — a human diffs, promotes, and sets `verified: true`
in `corpus/manifest.json` only after checking the content against its source. Run
`npm run check-freshness` to flag docs that have drifted or are due for re-verification.

## License

MIT
