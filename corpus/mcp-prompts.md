Prompts let an MCP server expose reusable prompt templates (structured messages +
instructions) that clients can discover, fetch, and parameterize. Prompts are
**user-controlled** — exposed so the user can explicitly select them, typically via
user-initiated UI like slash commands.

## Capability

A server that supports prompts **MUST** declare the `prompts` capability during
initialization. `listChanged` indicates it will notify when the prompt list changes:

```json
{ "capabilities": { "prompts": { "listChanged": true } } }
```

## Protocol messages

- **`prompts/list`** — discover prompts; supports pagination (`cursor` / `nextCursor`).
- **`prompts/get`** — params `name` + `arguments`; arguments may be auto-completed via the
  completion API. Returns `description` + a `messages` array.

```json
{ "method": "prompts/get", "params": { "name": "code_review", "arguments": { "code": "..." } } }
```

```json
{ "result": { "description": "Code review prompt",
  "messages": [ { "role": "user", "content": { "type": "text", "text": "Please review..." } } ] } }
```

- **`notifications/prompts/list_changed`** — servers that declared `listChanged` **SHOULD**
  send it when the prompt set changes.

## Prompt definition

- `name`: unique identifier (required)
- `title`: optional human-readable display name
- `description`: optional
- `icons`: optional
- `arguments`: optional list, each with `name`, `description`, `required`

## PromptMessage

- `role`: `"user"` or `"assistant"`
- `content`: one of the content types below (all support optional `annotations`):
  - **text**: `{ "type": "text", "text": "..." }`
  - **image**: `{ "type": "image", "data": "<base64>", "mimeType": "image/png" }` — data **MUST**
    be base64-encoded with a valid MIME type.
  - **audio**: `{ "type": "audio", "data": "<base64>", "mimeType": "audio/wav" }` — base64 + MIME.
  - **embedded resource**: `{ "type": "resource", "resource": { "uri": "...", "mimeType": "...", "text": "..." } }`
    — **MUST** include a valid resource URI, the MIME type, and either text or base64 `blob`.

## Errors

Standard JSON-RPC errors:
- Invalid prompt name: `-32602` (Invalid params)
- Missing required arguments: `-32602` (Invalid params)
- Internal error: `-32603`

## Implementation & security

Servers **SHOULD** validate prompt arguments before processing; clients **SHOULD** handle
pagination; both **SHOULD** respect capability negotiation. Implementations **MUST**
carefully validate all prompt inputs and outputs to prevent injection attacks or
unauthorized access to resources.
