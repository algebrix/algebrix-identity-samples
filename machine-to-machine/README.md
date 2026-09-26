# Machine-to-machine samples

Rules shared by every machine-to-machine (M2M) sample.

## Client and flow

- A machine-to-machine application uses the client credentials grant with a secret.
- It has no redirect URIs and no allowed origins.

## Tokens

- The access token lasts 3,600 seconds (read `expires_in`), and no refresh token is issued.
- Cache the token and request a new one before it expires.

## Limits

- Machine tokens cannot call the management API: they get 403.
- Machine tokens are metered per calendar month. If the token endpoint returns 401 for a machine application while other applications work, the monthly allowance is exhausted.
- A machine-to-machine application counts against the account's application allowance.

## Stacks

| Stack | Folder | Phase | Status |
|---|---|---|---|
| Node.js | [`machine-to-machine/node`](node/) | 1 | Available |
| Python | `machine-to-machine/python` | 2 (optional, not yet decided) | Planned |
