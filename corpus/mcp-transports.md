MCP encodes all messages as JSON-RPC, UTF-8 encoded. The spec (2025-11-25) defines two
standard transports: **stdio** and **Streamable HTTP**. Clients SHOULD support stdio
whenever possible. Custom transports are also permitted as long as they preserve the
JSON-RPC message format and lifecycle.

## stdio transport

The client launches the MCP server as a subprocess and exchanges newline-delimited
JSON-RPC messages over the server's stdin/stdout.

- The server reads JSON-RPC messages from `stdin` and writes them to `stdout`.
- Messages are individual JSON-RPC requests, notifications, or responses, delimited by
  newlines, and MUST NOT contain embedded newlines.
- The server **MUST NOT** write anything to `stdout` that is not a valid MCP message.
- The server **MAY** write UTF-8 strings to `stderr` for any logging (info, debug, error).
- The client MAY capture, forward, or ignore `stderr`, and SHOULD NOT assume `stderr`
  output indicates an error.
- The client MUST NOT write anything to the server's `stdin` that is not a valid MCP message.

Practical rule for server authors: **all logging goes to stderr** (`console.error` in
Node). A single stray `console.log` (stdout) corrupts the protocol stream.

## Streamable HTTP transport

The server runs as an independent process handling multiple client connections over HTTP
POST and GET, optionally using Server-Sent Events (SSE) to stream multiple server
messages. (This replaces the deprecated 2024-11-05 HTTP+SSE transport.)

- The server MUST expose a **single MCP endpoint path** supporting both POST and GET
  (e.g. `https://example.com/mcp`).
- **Sending to the server:** every client JSON-RPC message is a new HTTP POST to the MCP
  endpoint. The client MUST send an `Accept` header listing both `application/json` and
  `text/event-stream`. For a JSON-RPC *response/notification* the server returns `202
  Accepted` with no body; for a *request* the server returns either
  `Content-Type: application/json` (one JSON object) or `text/event-stream` (an SSE
  stream that SHOULD eventually carry the JSON-RPC response).
- **Listening for server messages:** the client MAY issue an HTTP GET (with
  `Accept: text/event-stream`) to open an SSE stream for server-initiated
  messages; the server returns the SSE stream or `405 Method Not Allowed`.
- **Resumability:** servers MAY attach an `id` to SSE events (globally unique per
  session/stream); clients resume after disconnect via HTTP GET with the `Last-Event-ID`
  header. Servers MUST NOT replay messages from a different stream.

### Session management

- The server MAY assign a session ID at initialization via an `MCP-Session-Id` response
  header (globally unique, cryptographically secure, visible ASCII 0x21–0x7E).
- If assigned, the client MUST send `MCP-Session-Id` on all subsequent requests. Servers
  requiring a session SHOULD return `400 Bad Request` for non-initialize requests lacking it.
- The server MAY terminate a session, then MUST return `404 Not Found` for that ID; the
  client MUST then start a new session with a fresh `InitializeRequest`. Clients SHOULD
  send HTTP DELETE with the session header to end a session.

### Protocol version header

Over HTTP, the client MUST send `MCP-Protocol-Version: <version>` (e.g. `2025-11-25`) on
all requests after initialization. If absent, the server SHOULD assume `2025-03-26`; if
invalid/unsupported, the server MUST respond `400 Bad Request`.

### Security (Streamable HTTP)

1. Servers **MUST** validate the `Origin` header on all incoming connections to prevent
   DNS-rebinding attacks; invalid origin → `403 Forbidden`.
2. When running locally, servers **SHOULD** bind only to `127.0.0.1`, not `0.0.0.0`.
3. Servers **SHOULD** implement proper authentication for all connections.

Without these, a remote website could use DNS rebinding to reach a local MCP server.
