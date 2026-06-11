Resources let an MCP server expose data that provides context to a model — files,
database schemas, app-specific info. Each resource is identified by a URI (RFC 3986).
Resources are **application-driven**: the host app decides how to incorporate them
(explicit picker, search/filter, or automatic inclusion).

## Capability

A server that supports resources **MUST** declare the `resources` capability, with two
optional features:

```json
{ "capabilities": { "resources": { "subscribe": true, "listChanged": true } } }
```

- `subscribe`: client can subscribe to changes of individual resources.
- `listChanged`: server notifies when the resource list changes.

Both are optional — a server may support neither, either, or both (`"resources": {}`).

## Protocol messages

- **`resources/list`** — discover resources; supports pagination (`cursor` / `nextCursor`).
- **`resources/read`** — params `uri`; returns a `contents` array.
- **`resources/templates/list`** — parameterized resources via URI templates (RFC 6570),
  returned as `resourceTemplates` with a `uriTemplate` (e.g. `file:///{path}`); arguments
  may be auto-completed via the completion API.
- **`resources/subscribe`** — params `uri`; server later sends
  `notifications/resources/updated` with the `uri` when it changes.
- **`notifications/resources/list_changed`** — sent by servers that declared
  `listChanged` when the resource set changes.

## Resource definition

- `uri`: unique identifier (required)
- `name`: the resource's name (required)
- `title`: optional human-readable display name
- `description`: optional
- `mimeType`: optional
- `size`: optional size in bytes
- `icons`: optional

## Resource contents

Either text or binary (exactly one of `text`/`blob`):
- **text**: `{ "uri": "...", "mimeType": "text/plain", "text": "..." }`
- **binary**: `{ "uri": "...", "mimeType": "image/png", "blob": "<base64>" }`

## Annotations

Resources, templates, and content blocks support optional `annotations`:
- `audience`: array of `"user"` and/or `"assistant"`.
- `priority`: 0.0–1.0 (1 = most important, 0 = least).
- `lastModified`: ISO 8601 timestamp (e.g. `"2025-01-12T15:00:58Z"`).

## Common URI schemes

Not exhaustive — custom schemes are allowed (and **MUST** conform to RFC 3986).
- **https://** — a resource the client can fetch directly from the web; servers **SHOULD**
  use it only when the client can load it on its own (not via the MCP server).
- **file://** — filesystem-like resources (need not map to a real filesystem); servers
  **MAY** use an XDG MIME type like `inode/directory` for non-regular files.
- **git://** — git version-control integration.

## Errors

Standard JSON-RPC errors:
- Resource not found: `-32002`
- Internal error: `-32603`

```json
{ "error": { "code": -32002, "message": "Resource not found", "data": { "uri": "file:///nonexistent.txt" } } }
```

## Security

Servers **MUST** validate all resource URIs; access controls **SHOULD** be implemented
for sensitive resources; binary data **MUST** be properly encoded; resource permissions
**SHOULD** be checked before operations.
