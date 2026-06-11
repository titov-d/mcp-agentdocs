MCP defines transport-level authorization for **HTTP-based transports**, letting clients
make requests to restricted servers on behalf of a resource owner.

## Scope & requirements

Authorization is **OPTIONAL**. When supported:
- HTTP-based transports **SHOULD** conform to this spec.
- **stdio** transports **SHOULD NOT** follow it — retrieve credentials from the
  environment instead.
- Alternative transports **MUST** follow established security best practices.

Based on a selected subset of: **OAuth 2.1** (draft-ietf-oauth-v2-1), OAuth 2.0
Authorization Server Metadata (**RFC 8414**), Dynamic Client Registration (**RFC 7591**),
Protected Resource Metadata (**RFC 9728**), and OAuth Client ID Metadata Documents.

## Roles

- **MCP server** = OAuth 2.1 **resource server** (accepts/validates access tokens).
- **MCP client** = OAuth 2.1 **client** (makes requests on behalf of the resource owner).
- **Authorization server** = issues access tokens; may be co-hosted or separate.

## Discovery

- MCP servers **MUST** implement Protected Resource Metadata (**RFC 9728**); the metadata
  **MUST** include an `authorization_servers` field with ≥1 server.
- Servers **MUST** advertise metadata via one of: the `WWW-Authenticate` header with
  `resource_metadata=...` on a `401 Unauthorized`, or a well-known URI
  (`/.well-known/oauth-protected-resource[/path]`). Clients **MUST** support both and
  prefer the header when present.
- Servers **SHOULD** include a `scope` parameter in `WWW-Authenticate` (RFC 6750 §3) for
  least-privilege guidance.
- AS metadata: servers **MUST** provide OAuth 2.0 AS Metadata (RFC 8414) and/or OpenID
  Connect Discovery 1.0; clients **MUST** try the well-known endpoints in priority order.

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer resource_metadata="https://mcp.example.com/.well-known/oauth-protected-resource",
                         scope="files:read"
```

## Client registration (priority order)

1. Pre-registered client info if available.
2. **Client ID Metadata Documents** (HTTPS URL as `client_id`) if AS advertises
   `client_id_metadata_document_supported`.
3. **Dynamic Client Registration** (RFC 7591) as fallback (**MAY**; backwards-compat).
4. Prompt the user for client info.

## Resource parameter (audience binding)

Clients **MUST** implement Resource Indicators (**RFC 8707**): include the `resource`
parameter in **both** authorization and token requests, identifying the MCP server via
its canonical URI (e.g. `https://mcp.example.com/mcp`; no fragment; scheme required).
Clients **MUST** send it regardless of whether the AS supports it.

## Access token usage

- Tokens **MUST** be sent in the `Authorization: Bearer <token>` header on **every**
  request — even within one logical session.
- Tokens **MUST NOT** be placed in the URI query string.
- Servers **MUST** validate tokens (OAuth 2.1 §5.2) and **MUST** verify the token's
  audience is themselves (RFC 8707). Invalid/expired → `HTTP 401`.
- Servers **MUST** only accept tokens issued for their own resources, **MUST NOT** accept
  or transit other tokens, and **MUST NOT** pass through a client token to upstream APIs
  (confused-deputy). Clients **MUST NOT** send tokens not issued by the server's AS.

## Errors

| Status | Meaning |
|--------|---------|
| 401 | Authorization required or token invalid |
| 403 | Invalid scopes / insufficient permissions |
| 400 | Malformed authorization request |

Insufficient scope at runtime → `403` with `WWW-Authenticate: Bearer error="insufficient_scope",
scope="...", resource_metadata="..."`; clients **SHOULD** do a step-up authorization (with
retry limits).

## Security must-dos

- **PKCE** (**RFC**/OAuth 2.1 §7.5.2) is **MUST**; clients **MUST** use the `S256` method
  and **MUST** verify PKCE support via AS metadata (`code_challenge_methods_supported`) —
  refuse to proceed if absent.
- All AS endpoints **MUST** be HTTPS; redirect URIs **MUST** be `localhost` or HTTPS and
  **MUST** be pre-registered and exact-matched; clients **SHOULD** use `state`.
- AS **SHOULD** issue short-lived access tokens and **MUST** rotate refresh tokens for
  public clients.
