Elicitation lets a **server** request additional information from the **user**, through the
**client**, mid-interaction (`elicitation/create`). Two modes:
- **form** — in-band structured data with an optional JSON Schema; data is exposed to the client.
- **url** — out-of-band interaction via a URL that must NOT pass through the client (auth,
  payments, secrets). **New in 2025-11-25.**

**Safety (MUST):** servers **MUST NOT** use form mode for sensitive info (passwords, API keys,
tokens, payment credentials) and **MUST** use URL mode for those. Clients **MUST** make clear
which server is asking, offer decline/cancel, let users review/modify form responses, and (URL
mode) show the target domain and get consent before navigating.

## Capability

Clients supporting elicitation **MUST** declare it at initialization:

```json
{ "capabilities": { "elicitation": { "form": {}, "url": {} } } }
```

Empty `{}` = `form` only (backwards compat). A client declaring `elicitation` **MUST** support at
least one mode; servers **MUST NOT** send a mode the client didn't declare.

## `elicitation/create`

Always includes `mode` (`"form"`|`"url"`; optional for form — clients **MUST** treat a missing
`mode` as form) and `message` (human-readable reason).

### Form mode

Adds `requestedSchema` — a **restricted** JSON Schema: a flat object of primitive properties only
(no nesting, no arrays of objects beyond enums):
- string: `minLength`/`maxLength`/`pattern`/`format`(`email`|`uri`|`date`|`date-time`)/`default`
- number or integer: `minimum`/`maximum`/`default`
- boolean: `default`
- enum: single-select via `enum` or `oneOf` of `{const,title}`; multi-select via `type:"array"` +
  `items` (`enum` or `anyOf`), `minItems`/`maxItems`

Clients that support defaults **SHOULD** pre-populate fields. Example:

```json
{ "method": "elicitation/create", "params": { "mode": "form",
  "message": "Please provide your contact information",
  "requestedSchema": { "type": "object",
    "properties": { "name": {"type":"string"}, "email": {"type":"string","format":"email"} },
    "required": ["name", "email"] } } }
```

### URL mode

Adds `url` (**MUST** be a valid URL) and `elicitationId` (unique). The response `action:"accept"`
means the user **consented to open the URL**, NOT that the interaction is complete (it happens out
of band). URL mode is **not** for authorizing the MCP client→server connection (that's
[MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)); the client's bearer token is unchanged.

- **`notifications/elicitation/complete`** — server **MAY** send when the out-of-band interaction
  finishes; **MUST** go only to the initiating client and **MUST** include the `elicitationId`.
  Clients **MUST** ignore unknown/already-completed IDs and **SHOULD** still offer manual retry/cancel.
- **`URLElicitationRequiredError` (code `-32042`)** — server **MAY** return when a request can't
  proceed until a URL-mode elicitation completes (and **MUST NOT** otherwise). Its `data.elicitations`
  **MUST** list URL-mode elicitations, each with an `elicitationId`.

## Response actions (form and URL)

- `"accept"` — user approved; form: `content` matches the schema; URL: `content` omitted.
- `"decline"` — user explicitly declined (`content` omitted).
- `"cancel"` — user dismissed without choosing (`content` omitted).

## Errors

- Server: `-32042` (`URLElicitationRequiredError`).
- Client: `-32602` (Invalid params) when the server requests a mode not declared in capabilities.

## Security

- Servers **MUST** bind elicitation state to the client + verified user identity; state **MUST NOT**
  be tied to a session ID alone; for remote servers derive identity from
  [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) (e.g. `sub`).
- **Safe URL handling** — servers **MUST NOT** put sensitive data or a pre-authenticated URL in the
  elicitation URL, and **SHOULD** use HTTPS. Clients **MUST NOT** pre-fetch or auto-open the URL,
  **MUST** show the full URL and get explicit consent, and **MUST** open it so neither client nor
  LLM can inspect content/input; **SHOULD** highlight the domain and warn on Punycode.
- **Form mode:** servers **MUST NOT** request secrets; clients **SHOULD** validate responses against the schema.
- **Phishing:** the server **MUST** verify that the user who opens the URL is the same user who
  started the elicitation (e.g. session-cookie `sub` matches), resilient to URL tampering — otherwise
  a third party could complete an auth flow bound to the wrong identity (account takeover).
