# Resource server: Node.js (Express)

## What this sample shows

An Express API that validates Algebrix Identity access tokens locally, against the keys published by your organization, and gates one route on a role.

| Route | Needs |
|---|---|
| `GET /api/public` | Nothing |
| `GET /api/protected` | A valid access token |
| `GET /api/admin-only` | A valid access token whose `realm_access.roles` includes `admin` |

## Prerequisites

- Node.js 22 or later: the oldest supported Node.js line. The dependencies accept it (`express` requires Node.js 18 or later).
- An Algebrix Identity organization.

## Register your application in the console

None needed. A resource server only validates tokens that other applications obtain.

## Configure

| Key | Required | Value |
|---|---|---|
| `ALGEBRIX_ISSUER` | Yes | Your issuer, for example `https://auth.algebrix.co/realms/your-organization` |
| `ALLOWED_AZP` | No | Comma-separated client IDs allowed to call this API. Empty accepts any application in your organization. |

Use the exact issuer value from the console integration view, including `/realms/`. With the path form (without `/realms/`), the sample exits at startup with an issuer mismatch.

## Run locally

```sh
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
# edit .env
npm install
npm start
```

The API listens on `http://localhost:8081`.

## What to look for

Get a machine token with the client credentials grant, using any machine-to-machine application in your organization. Read `token_endpoint` from the discovery document first:

```sh
curl -s https://auth.algebrix.co/realms/your-organization/.well-known/openid-configuration

curl -s -u your-client-id:your-client-secret \
  -d grant_type=client_credentials \
  <token_endpoint>
```

Copy `access_token` from the response, then call each route:

```sh
TOKEN=<access_token>

curl -i http://localhost:8081/api/public                                           # 200
curl -i http://localhost:8081/api/protected                                        # 401, WWW-Authenticate: Bearer
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/protected      # 200, sub, azp and roles
curl -i -H "Authorization: Bearer $TOKEN" http://localhost:8081/api/admin-only     # 403 for a machine token
```

The machine-to-machine sample in this repository (`machine-to-machine/node`) calls this API.

## Why `aud` is not checked

Algebrix Identity sets `aud` to `account` on every access token, so it cannot identify your API or the calling application. Use `azp`, the client ID of the calling application, for that, with `ALLOWED_AZP`.

## Roles

- Roles are in `realm_access.roles`, alongside built-in roles such as `default-roles-your-organization`, `offline_access`, and `uma_authorization`. Test that a role is present; never assume the array holds one entry.
- Machine tokens carry no `admin` role, so they get 403 on `/api/admin-only` by design.
- In Algebrix Identity, `admin` is also the role that grants access to the management API. A user holding it can administer your organization's users.

## Troubleshooting

- **Issuer mismatch at startup:** `ALGEBRIX_ISSUER` is not the exact issuer value. Copy it from the console integration view, including `/realms/`.
- **401 with `error="invalid_token"`:** the token has expired, comes from a different organization, has been altered, or its `azp` is not in `ALLOWED_AZP`. The server log states the reason.
- **403 on `/api/admin-only`:** the token is valid but `realm_access.roles` does not include `admin`. This is expected for machine tokens.
- **Clock skew:** the server accepts 30 seconds of difference on `exp`. Larger drift causes 401s: sync the server clock.

## Moving to production

- Serve the API over HTTPS.
- Set `ALLOWED_AZP` to the applications that may call it.
- A revoked access token stays valid until its `exp`, so the access token lifetime is your revocation window.

## Tested with

- express 5.2.1
- jose 6.2.12
- Node.js 22.23.3
- Algebrix Identity API v2.0

## Download only this sample

```sh
npx degit algebrix/algebrix-identity-samples/resource-server/node-express my-api
```

Or with git sparse checkout:

```sh
git clone --filter=blob:none --sparse https://github.com/algebrix/algebrix-identity-samples.git
cd algebrix-identity-samples
git sparse-checkout set resource-server/node-express
```
