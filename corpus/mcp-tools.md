Tools let an MCP server expose functions an LLM can invoke (query a database, call an
API, compute). Tools are **model-controlled**: the model discovers and calls them based
on context. For trust & safety there **SHOULD** always be a human in the loop able to
deny a tool invocation; apps **SHOULD** show which tools are exposed, indicate when a
tool is invoked, and confirm sensitive operations.

## Capability

A server that supports tools **MUST** declare the `tools` capability. `listChanged`
indicates it will notify when the tool list changes:

```json
{ "capabilities": { "tools": { "listChanged": true } } }
```

## Listing tools — `tools/list`

Supports pagination (`cursor` param, `nextCursor` in result). Returns an array of tool
definitions.

## Calling tools — `tools/call`

Params: `name` and `arguments`. Result has a `content` array and optional `isError`:

```json
{ "method": "tools/call", "params": { "name": "get_weather", "arguments": { "location": "New York" } } }
```

```json
{ "result": { "content": [ { "type": "text", "text": "..." } ], "isError": false } }
```

## Tool definition

- `name`: unique identifier. Names **SHOULD** be 1–128 chars, case-sensitive, unique
  within a server; allowed characters **SHOULD** be only A–Z a–z 0–9 `_` `-` `.` (no
  spaces/commas/special chars). e.g. `getUser`, `DATA_EXPORT_v2`, `admin.tools.list`.
- `title`: optional human-readable display name.
- `description`: human-readable functionality.
- `inputSchema`: JSON Schema for parameters. Defaults to draft 2020-12 if no `$schema`.
  **MUST** be a valid JSON Schema object (not `null`). For no-parameter tools use
  `{ "type": "object", "additionalProperties": false }` (recommended) or `{ "type": "object" }`.
- `outputSchema`: optional JSON Schema for structured output.
- `annotations`: optional behavior hints. Clients **MUST** treat tool annotations as
  untrusted unless they come from trusted servers.
- `execution.taskSupport`: `"forbidden"` (default), `"optional"`, or `"required"`.

## Result content types

Unstructured content goes in `content` (multiple items allowed). Types:
- **text**: `{ "type": "text", "text": "..." }`
- **image**: `{ "type": "image", "data": "<base64>", "mimeType": "image/png" }`
- **audio**: `{ "type": "audio", "data": "<base64>", "mimeType": "audio/wav" }`
- **resource_link**: `{ "type": "resource_link", "uri": "file:///...", "name": "...", "mimeType": "..." }`
  — a link to a Resource (not guaranteed to appear in `resources/list`).
- **embedded resource**: `{ "type": "resource", "resource": { "uri": "...", "mimeType": "...", "text": "..." } }`
  — servers using embedded resources **SHOULD** implement the `resources` capability.

All content types support optional `annotations` (audience, priority, lastModified).

## Structured content & output schema

Structured results go in `structuredContent` (a JSON object). For backwards compatibility
a tool returning structured content **SHOULD** also return the serialized JSON in a text
content block. If an `outputSchema` is provided, servers **MUST** return structured
results conforming to it and clients **SHOULD** validate against it.

## Errors — two mechanisms

1. **Protocol errors** (JSON-RPC `error`): unknown tool, malformed request, server error.
   e.g. `{ "error": { "code": -32602, "message": "Unknown tool: ..." } }`.
2. **Tool execution errors**: returned in the result with `isError: true` and a `content`
   message (API failures, input validation, business logic). Clients **SHOULD** pass
   execution errors to the LLM so it can self-correct.

## List-changed notification

Servers that declared `listChanged` **SHOULD** send `notifications/tools/list_changed`
when the tool set changes.

## Security

Servers **MUST** validate all tool inputs, enforce access controls, rate-limit
invocations, and sanitize outputs. Clients **SHOULD** confirm sensitive operations with
the user, show inputs before calling, validate results before passing to the LLM,
implement timeouts, and log usage.
