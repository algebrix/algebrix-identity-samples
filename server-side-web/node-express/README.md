# Server-side web app: Node.js (Express)

## What this sample shows

- Sign-in with the authorization code flow, PKCE `S256`, and `state`, as a confidential client using `client_secret_basic`.
- Tokens kept in the server-side session. The browser only gets an `httpOnly` session cookie.
- The signed-in user's claims and roles.
- Refreshing the access token when it is about to expire.
- Sign-out through the identity server.

## Prerequisites

- Node.js 22 or later: the oldest supported Node.js line. The dependencies accept it (`express` requires Node.js 18 or later).
- An Algebrix Identity organization with at least one user.

## Register your application in the console

1. Create an application and choose the **Server-side web app** application type.
2. Add both sign-in redirect URIs: `http://localhost:3001/callback` and `http://localhost:3001/`. The console has no separate post-logout field, and sign-out can only return to an address registered as a sign-in redirect URI, so the home address is registered too.
3. Server-side web apps have no allowed origins.
4. Copy the client ID and secret from the application's integration view.

## Configure

| Key | Value |
|---|---|
| `ALGEBRIX_ISSUER` | Your issuer, for example `https://auth.algebrix.co/realms/your-organization` |
| `ALGEBRIX_CLIENT_ID` | The application's client ID |
| `ALGEBRIX_CLIENT_SECRET` | The application's secret |
| `ALGEBRIX_REDIRECT_URI` | `http://localhost:3001/callback` |
| `ALGEBRIX_POST_LOGOUT_REDIRECT_URI` | `http://localhost:3001/` |
| `SESSION_SECRET` | A long random string that signs the session cookie |

Use the exact issuer value from the console integration view, including `/realms/`. With the path form (without `/realms/`), the sample exits at startup with an issuer mismatch.

Generate `SESSION_SECRET` with:

```sh
node -e "console.log(crypto.randomBytes(32).toString('hex'))"
```

## Run locally

```sh
cp .env.example .env              # PowerShell: Copy-Item .env.example .env
# edit .env
npm install
npm start
```

Open `http://localhost:3001`.

## What to look for

- **Sign in:** you return to the home page, signed in.
- **Claims and roles:** `sub`, `preferred_username`, `email`, and `name`, then the roles. Built-in roles such as `default-roles-your-organization`, `offline_access`, and `uma_authorization` appear next to the assigned role.
- **Reload:** you stay signed in.
- **Refresh:** after the access token expires (300 seconds by default), reload. You stay signed in, the expiry moves forward, and the server logs `Access token refreshed.`
- **Sign out:** you pass through the identity server and return to the home page, signed out. Signing in again asks for your password.

## Troubleshooting

- **Issuer mismatch at startup:** `ALGEBRIX_ISSUER` is not the exact issuer value. Copy it from the console integration view, including `/realms/`.
- **Error on the identity server's own page at sign-in, with no return to the app:** `ALGEBRIX_REDIRECT_URI` is not registered on the application exactly.
- **"Invalid redirect uri" on the identity server's page at sign-out:** `ALGEBRIX_POST_LOGOUT_REDIRECT_URI` is not registered as a sign-in redirect URI.
- **401 `unauthorized_client`:** the secret is wrong, or it was rotated in the console.
- **401 `invalid_client`:** the client ID is unknown in this organization.

  Both carry the description "Invalid client or Invalid client credentials".

- **An error on the home page after sign-in:** an error from the identity server shows its code and description, for example `access_denied`. Any other failure, such as opening `/callback` without a sign-in in progress, shows "Sign-in could not be completed."
- **Clock skew:** if the server clock is far off, ID token time checks fail at sign-in. Sync the clock.

## Moving to production

- Use `https://` redirect URIs and set the session cookie to `secure: true`.
- Replace the in-memory session store with a shared store.
- Keep the secret in a secret manager.
- Refresh tokens are not rotated, so they must stay server-side, as they do in this sample.

## Tested with

- express 5.2.1
- express-session 1.19.0
- openid-client 6.8.8
- Node.js 22.23.3
- Algebrix Identity API v2.0

## Download only this sample

```sh
npx degit algebrix/algebrix-identity-samples/server-side-web/node-express my-web-app
```

Or with git sparse checkout:

```sh
git clone --filter=blob:none --sparse https://github.com/algebrix/algebrix-identity-samples.git
cd algebrix-identity-samples
git sparse-checkout set server-side-web/node-express
```
