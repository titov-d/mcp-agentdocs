Sampling lets a **server** request an LLM completion from the **client** (`sampling/createMessage`).
The client keeps control of model access, selection, and permissions — the server needs no API
key. It enables agentic behavior: LLM calls nested inside other server features. Servers can
request text/image/audio and (2025-11-25) tool use.

Human-in-the-loop: for trust & safety there **SHOULD** always be a human able to deny a sampling
request; apps **SHOULD** let users review/edit prompts before sending and review responses before
delivery.

## Capability

A client that supports sampling **MUST** declare it during
[initialization](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#initialization):

```json
{ "capabilities": { "sampling": {} } }                       // basic
{ "capabilities": { "sampling": { "tools": {} } } }          // with tool use
{ "capabilities": { "sampling": { "context": {} } } }        // includeContext (soft-deprecated)
```

`includeContext` values `"thisServer"`/`"allServers"` are **soft-deprecated** (defaults to
`"none"`); servers **SHOULD NOT** use them unless the client declares `sampling.context`.

## `sampling/createMessage`

Request params: `messages` (array of `{role, content}`; role `"user"`/`"assistant"`),
`modelPreferences`, `systemPrompt`, `maxTokens`, and optionally `tools` + `toolChoice`.

```json
{ "jsonrpc": "2.0", "id": 1, "method": "sampling/createMessage", "params": {
  "messages": [{ "role": "user", "content": { "type": "text", "text": "Capital of France?" } }],
  "modelPreferences": { "hints": [{ "name": "claude-3-sonnet" }], "intelligencePriority": 0.8, "speedPriority": 0.5 },
  "systemPrompt": "You are a helpful assistant.", "maxTokens": 100 } }
```

Result: `{ role: "assistant", content, model, stopReason }`. `stopReason` is `"endTurn"` for a
normal completion or `"toolUse"` when the model wants to call tools.

**Content types:** `text`; `image` (`data` base64 + `mimeType`); `audio` (`data` base64 + `mimeType`).

## Tools in sampling (2025-11-25)

Servers add a `tools` array (`{name, description, inputSchema}`) and optional `toolChoice`.
Clients **MUST** declare `sampling.tools` to receive tool-enabled requests; servers **MUST NOT**
send them otherwise.

`toolChoice` modes: `{mode:"auto"}` (model decides — default), `{mode:"required"}` (MUST use ≥1
tool), `{mode:"none"}` (MUST NOT use tools). Parallel tool use is allowed (an array of
`tool_use` blocks).

**Multi-turn loop:** on `stopReason:"toolUse"`, the server executes the tools and sends a new
`sampling/createMessage` with the tool results appended, repeating until a final text response.

**Message constraints (MUST):**
- A user message containing a `tool_result` **MUST** contain ONLY tool results (no text/image/audio) — for compatibility with provider tool roles.
- Every assistant message with `tool_use` blocks **MUST** be immediately followed by a user message of entirely `tool_result` blocks, each `toolUseId` matching a `tool_use` `id`, before any other message.

## Model preferences

Servers express needs as three normalized priorities (0–1): `costPriority`, `speedPriority`,
`intelligencePriority`. `hints` (e.g. `[{ "name": "claude-3-sonnet" }]`) are advisory substrings
matched flexibly; clients **MAY** map them to an equivalent model from another provider and make
the final selection.

## Errors

Clients **SHOULD** return:
- User rejected the request: `-1`
- Tool result missing, or tool results mixed with other content: `-32602` (Invalid params)

## Security

Clients **SHOULD** implement user-approval controls, respect model hints, and rate-limit; both
parties **SHOULD** validate content and **MUST** handle sensitive data appropriately. With tools,
servers **MUST** answer each `tool_use` with a matching `tool_result` (user message = tool results
only), and both parties **SHOULD** enforce tool-loop iteration limits.
