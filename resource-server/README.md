# Resource server samples

Rules shared by every resource server (API) sample. A resource server only validates access tokens, so it needs no application registration.

## Signature

- Verify the signature against `jwks_uri` from the issuer's discovery document.
- Cache the keys, and refresh them when a token carries an unknown `kid`.
- Accept `RS256` only.

## Claims

- `iss` must equal the issuer exactly.
- Check `exp`, with a small clock tolerance.
- Do not check `aud`: it is always `account` for every application, so it cannot tell applications apart.
- Use `azp` for that: an optional allowlist of client IDs that may call the API.
- Roles come from `realm_access.roles`.

## Responses

- 401 with `WWW-Authenticate: Bearer` for a missing or invalid token.
- 403 when the token is valid but the required role is missing.

## Revocation

A revoked access token stays valid until its `exp`.

## Stacks

| Stack | Folder | Phase | Status |
|---|---|---|---|
| Node.js (Express) | [`resource-server/node-express`](node-express/) | 1 | Available |
