MCP defines a connection lifecycle in three phases:

1. **Initialization** — capability negotiation and protocol-version agreement
2. **Operation** — normal protocol communication
3. **Shutdown** — graceful termination

## Initialization

The initialization phase **MUST** be the first interaction. The client **MUST** start by
sending an `initialize` request containing the protocol version it supports, its
capabilities, and its implementation info (`clientInfo`):

```json
{
  "method": "initialize",
  "params": {
    "protocolVersion": "2025-11-25",
    "capabilities": { "roots": { "listChanged": true }, "sampling": {}, "elicitation": {} },
    "clientInfo": { "name": "ExampleClient", "version": "1.0.0" }
  }
}
```

The server **MUST** respond with its own `protocolVersion`, `capabilities`, and
`serverInfo` (and may include an optional `instructions` string). After a successful
response the client **MUST** send an `initialized` notification before normal operation:

```json
{ "method": "notifications/initialized" }
```

Ordering rules:
- The client **SHOULD NOT** send requests other than pings before the server has
  responded to `initialize`.
- The server **SHOULD NOT** send requests other than pings and logging before receiving
  the `initialized` notification.

### Version negotiation

The client **MUST** send a protocol version it supports — **SHOULD** be the latest it
supports. If the server supports that version it **MUST** respond with the same version;
otherwise it **MUST** respond with another version it supports (**SHOULD** be its latest).
If the client doesn't support the server's version, it **SHOULD** disconnect. Over HTTP,
the client **MUST** then include `MCP-Protocol-Version: <version>` on all subsequent
requests.

### Capability negotiation

Capabilities establish which optional features are available for the session. Both
parties **MUST** respect the negotiated version and only use successfully negotiated
capabilities.

| Side | Capability | Meaning |
|------|-----------|---------|
| Client | `roots` | provide filesystem roots |
| Client | `sampling` | support LLM sampling requests |
| Client | `elicitation` | support server elicitation requests |
| Server | `prompts` | offer prompt templates |
| Server | `resources` | provide readable resources |
| Server | `tools` | expose callable tools |
| Server | `logging` | emit structured log messages |
| Server | `completions` | support argument autocompletion |

Sub-capabilities: `listChanged` (prompts/resources/tools) and `subscribe` (resources only).

## Operation

Client and server exchange messages per the negotiated capabilities and version.

## Shutdown

No shutdown messages are defined — the transport signals termination.
- **stdio**: the client **SHOULD** close the server's stdin, wait for exit, then send
  `SIGTERM`, then `SIGKILL` if needed. The server **MAY** initiate shutdown by closing
  its stdout and exiting.
- **HTTP**: shutdown is indicated by closing the HTTP connection(s).

## Timeouts

Implementations **SHOULD** set timeouts on all requests; on timeout the sender **SHOULD**
issue a cancellation notification and stop waiting. Timeouts **SHOULD** be configurable
per request. Receiving a progress notification **MAY** reset the timeout, but a maximum
timeout **SHOULD** always be enforced.

## Error handling

Be ready for protocol-version mismatch, failed capability negotiation, and request
timeouts. Example initialization error:

```json
{ "error": { "code": -32602, "message": "Unsupported protocol version",
  "data": { "supported": ["2024-11-05"], "requested": "1.0.0" } } }
```
