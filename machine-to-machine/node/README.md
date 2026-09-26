# Machine-to-machine: Node.js

## What this sample shows

- The client credentials grant, authenticated with `client_secret_basic`.
- Caching the access token until 60 seconds before it expires.
- No refresh token: a machine-to-machine application requests a new token instead.
- Calling your own API with the token.

## Prerequisites

- Node.js 22 or later: the oldest supported Node.js line. `openid-client` states no minimum.
- The resource server sample (`resource-server/node-express`) running on `http://localhost:8081`.

## Register your application in the console

1. Create an application and choose the **Machine-to-machine** application type. It has no redirect URIs and no origins.
2. Copy the client ID and secret from the application's integration view.

The application counts against your account's application allowance.

## Configure

| Key | Value |
|---|---|
| `ALGEBRIX_ISSUER` | Your issuer, for example `https://auth.algebrix.co/realms/your-organization` |
| `ALGEBRIX_CLIENT_ID` | The application's client ID |
| `ALGEBRIX_CLIENT_SECRET` | The application's secret |
| `API_BASE_URL` | Where the resource server sample runs: `http://localhost:8081` |

Use the exact issuer value from the console integration view, including `/realms/`. With the path form (without `/realms/`), the sample exits at startup with an issuer mismatch.

## Run locally

```sh
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
# edit .env
npm install
npm start
```

## What to look for

```text
Token: newly requested, 3600 seconds left (...)
Refresh token: none issued (machine-to-machine applications request a new token instead)
GET /api/public: 200 {"message":"Public endpoint: no token required."}
Token: from cache, 3599 seconds left
GET /api/protected: 200 {"sub":"...","azp":"your-client-id","roles":[...]}
```

`azp` in the `/api/protected` response is your application's client ID. Machine tokens carry no `admin` role, so this application receives 403 from the resource server's `/api/admin-only` by design.

## Troubleshooting

- **Issuer mismatch at startup:** `ALGEBRIX_ISSUER` is not the exact issuer value. Copy it from the console integration view, including `/realms/`.
- **401 `unauthorized_client`:** the secret is wrong, or it was rotated in the console.
- **401 `invalid_client`:** the client ID is unknown in this organization.

  Both carry the description "Invalid client or Invalid client credentials".
- **401 from the token endpoint while other applications work:** your account's monthly machine token allowance is used up.
- **Could not connect to the API:** the resource server sample is not running.
- **401 from the API:** the clocks of the two machines differ too much, or `ALLOWED_AZP` on the resource server does not include this client ID.

## Moving to production

- Keep the secret in a secret manager. Never ship it in a browser or mobile app.
- Rotating the secret invalidates the old one immediately. Token requests fail with `unauthorized_client` until every deployment has the new secret, so plan the rotation and update deployments straight away.
- Cache tokens per process: machine tokens are metered per calendar month.
- Machine tokens cannot call the Algebrix Identity management API.

## Tested with

- openid-client 6.8.8
- Node.js 25.2.1 (full run against a live organization) and Node.js 22.23.3 (install and module-load check)
- Algebrix Identity API v2.0

## Download only this sample

```sh
npx degit algebrix/algebrix-identity-samples/machine-to-machine/node my-service
```

Or with git sparse checkout:

```sh
git clone --filter=blob:none --sparse https://github.com/algebrix/algebrix-identity-samples.git
cd algebrix-identity-samples
git sparse-checkout set machine-to-machine/node
```
