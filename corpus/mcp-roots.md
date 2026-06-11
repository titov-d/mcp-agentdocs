Roots let a **client** expose filesystem boundaries to a **server** — which directories/files
the server may operate within. Servers can request the list of roots from supporting clients
and receive notifications when it changes. The protocol mandates no specific UI for choosing
roots (typically a workspace/project picker).

## Capability

A client that supports roots **MUST** declare the `roots` capability during
[initialization](https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#initialization).
`listChanged` indicates the client will notify when the root list changes:

```json
{ "capabilities": { "roots": { "listChanged": true } } }
```

## Protocol messages

- **`roots/list`** — server → client request to retrieve roots. Result is `roots`, an array of
  Root objects.

```json
{ "jsonrpc": "2.0", "id": 1, "method": "roots/list" }
```
```json
{ "jsonrpc": "2.0", "id": 1, "result": {
  "roots": [ { "uri": "file:///home/user/projects/myproject", "name": "My Project" } ] } }
```

- **`notifications/roots/list_changed`** — clients that declared `listChanged` **MUST** send
  this when the root list changes (the server then re-requests `roots/list`).

## Root data type

- `uri` — unique identifier. In the current spec this **MUST** be a `file://` URI.
- `name` — optional human-readable display name.

## Errors

Clients **SHOULD** return standard JSON-RPC errors:
- Client does not support roots: `-32601` (Method not found)
- Internal error: `-32603`

## Security & implementation

- Clients **MUST**: only expose roots with appropriate permissions; validate all root URIs to
  prevent path traversal; implement access controls; monitor root accessibility.
- Clients **SHOULD**: prompt the user for consent before exposing roots; validate accessibility
  before exposing; provide clear root-management UI.
- Servers **SHOULD**: check for the `roots` capability before use; respect root boundaries and
  validate all paths against the provided roots; handle list changes and unavailable roots
  gracefully; cache root information appropriately.
