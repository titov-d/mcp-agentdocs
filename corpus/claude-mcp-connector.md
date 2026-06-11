The Claude API **MCP connector** lets you connect to remote MCP servers directly from the
Messages API — no separate MCP client needed. Claude calls the server's tools when a
request maps to a tool's capability.

## Beta header

Requires `anthropic-beta: mcp-client-2025-11-20`. The previous `mcp-client-2025-04-04` is
deprecated (tool config used to live inside the server definition; it now lives in the
`tools` array — see Migration). Not eligible for Zero Data Retention (ZDR).

## Two components

1. **`mcp_servers`** (array) — connection details.
2. **`tools`** with `mcp_toolset` entries — which tools to enable and how.

### `mcp_servers` entry

| Field | Req | Description |
|-------|-----|-------------|
| `type` | yes | Currently only `"url"`. |
| `url` | yes | MCP server URL; must start with `https://`. |
| `name` | yes | Unique id; must be referenced by exactly one `mcp_toolset`. |
| `authorization_token` | no | OAuth access token if the server requires auth. |

### `mcp_toolset` (in `tools`)

```json
{ "type": "mcp_toolset", "mcp_server_name": "example-mcp",
  "default_config": { "enabled": true, "defer_loading": false },
  "configs": { "some_tool": { "enabled": true, "defer_loading": true } } }
```

- `mcp_server_name` (req) must match a server in `mcp_servers`.
- `default_config` applies to all tools; `configs` overrides per tool.
- Per-tool options: `enabled` (default `true`), `defer_loading` (default `false`; when
  true the tool description isn't sent initially — pair with the Tool search tool).
- Optional `cache_control` for prompt-caching breakpoints.
- **Merge precedence (high→low):** tool `configs` → set `default_config` → system defaults.

### Patterns

- **Enable all:** `mcp_toolset` with no config.
- **Allowlist:** `default_config.enabled:false`, then enable specific tools in `configs`.
- **Denylist:** leave default enabled, set `enabled:false` on unwanted tools (recommended
  for read-only assistants — disable write/destructive tools).

## Validation rules

- The `mcp_server_name` MUST match a server in `mcp_servers`.
- Every server MUST be referenced by exactly one `mcp_toolset` (unique toolset per server).
- Unknown tool names in `configs` log a backend warning but don't error (dynamic tools).

## Response content blocks

```json
{ "type": "mcp_tool_use", "id": "mcptoolu_...", "name": "echo",
  "server_name": "example-mcp", "input": { "param1": "value1" } }
```
```json
{ "type": "mcp_tool_result", "tool_use_id": "mcptoolu_...", "is_error": false,
  "content": [ { "type": "text", "text": "Hello" } ] }
```

## Limitations

- Only **tool calls** are supported (not prompts/resources via the connector).
- The server MUST be publicly reachable over HTTP — both **Streamable HTTP** and **SSE**
  transports. Local **stdio** servers cannot be connected directly.
- Available on the Claude API, Claude Platform on AWS, and Microsoft Foundry — **not** on
  Amazon Bedrock or Vertex AI.

## Authentication

For OAuth-protected servers, obtain an access token yourself (handle the OAuth flow +
refresh) and pass it as `authorization_token`. For testing, the MCP Inspector
(`npx @modelcontextprotocol/inspector`) can run the OAuth flow and yield an access token.

## Multiple servers & batch

Connect multiple servers by listing several `mcp_servers` + one `mcp_toolset` each. For
large tool sets, enable `defer_loading` with the Tool search tool. `mcp_servers` is also
supported in the Message Batches API (priced the same).

## Client-side MCP helpers

If you manage your own MCP client connection (local stdio servers, MCP prompts, or resources),
the Anthropic SDKs provide helpers that convert between MCP types and Claude API types. In the
TypeScript SDK they live in `@anthropic-ai/sdk/helpers/beta/mcp`: `mcpTools(tools, mcpClient)`
(→ Claude API tools for the tool runner), `mcpMessages(...)`, `mcpResourceToContent(...)`,
`mcpResourceToFile(...)`, and they throw `UnsupportedMCPValueError` on unsupported values. Use
the `mcp_servers` API parameter for remote URL servers with tool-only needs; use the helpers for
local servers, prompts, resources, or finer control. Available in the Python, TypeScript, Java,
Go, Ruby, and PHP SDKs (not yet C#) — import the equivalent helpers per language (e.g. Python
`anthropic.lib.tools.mcp`, Go `anthropic-sdk-go/mcp`).

## Remote third-party MCP servers

Several companies host remote MCP servers connectable via this connector. They are
third-party services — not owned or endorsed by Anthropic; connect only to servers you
trust after reviewing their security and terms. Directory of community servers:
github.com/modelcontextprotocol/servers.

---
Sources: platform.claude.com/docs/en/agents-and-tools/mcp-connector and /remote-mcp-servers.
