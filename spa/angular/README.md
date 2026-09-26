# Single-page app: Angular

## What this sample shows

- Sign-in with the authorization code flow, PKCE `S256`, and `state`, as a public client with no secret, using `angular-auth-oidc-client`.
- The signed-in user's claims and roles.
- Staying signed in across a reload.
- Automatic renewal with the refresh token, including when the access token expired while the page was closed.
- Sign-out through the identity server.

## Prerequisites

- Node.js 22.22.3 or later: Angular 22 requires `^22.22.3 || ^24.15.0 || >=26.0.0`.
- An Algebrix Identity organization with at least one user.

## Register your application in the console

1. Create an application and choose the **Single-page app** application type. It has no secret.
2. Add both sign-in redirect URIs: `http://localhost:4400/callback` and `http://localhost:4400/`. The console has no separate post-logout field, and sign-out can only return to an address registered as a sign-in redirect URI, so the home address is registered too.
3. Add the allowed origin `http://localhost:4400`.
4. Copy the client ID from the application's integration view.

## Configure

Angular has no `.env` file, so this sample reads `public/config.json` when the page loads.

| Key | Value |
|---|---|
| `ALGEBRIX_ISSUER` | Your issuer, for example `https://auth.algebrix.co/realms/your-organization` |
| `ALGEBRIX_CLIENT_ID` | The application's client ID |
| `ALGEBRIX_REDIRECT_URI` | `http://localhost:4400/callback` |
| `ALGEBRIX_POST_LOGOUT_REDIRECT_URI` | `http://localhost:4400/` |

Everything in `config.json` is served to the browser and is public. Never put a secret here.

Use the exact issuer value from the console integration view, including `/realms/`. See "Issuer mismatch" under Troubleshooting.

## Run locally

```sh
cp public/config.example.json public/config.json     # PowerShell: Copy-Item public/config.example.json public/config.json
# edit public/config.json
npm install
npm start
```

Open `http://localhost:4400`.

## What to look for

- **Sign in:** you return to the home page, signed in.
- **Claims and roles:** `sub`, `preferred_username`, `email`, and `name`, then the roles. Built-in roles such as `default-roles-your-organization`, `offline_access`, and `uma_authorization` appear next to the assigned role.
- **Reload:** you stay signed in, with no trip to the identity server.
- **Automatic renewal:** the access token lasts 300 seconds by default. Shortly before it expires, the app requests a new one with the refresh token (`grant_type=refresh_token` in the browser's network tab), and the expiry moves forward.
- **Sign out:** you pass through the identity server and return to the home page, signed out. Signing in again asks for your password.

## Troubleshooting

- **Issuer mismatch:** with the path form (without `/realms/`), clicking Sign in shows "Sign-in could not start: the configured issuer does not match the discovery document." `angular-auth-oidc-client` compares `ALGEBRIX_ISSUER` with the issuer in the discovery document. Copy the exact issuer value from the console integration view.
- **Error on the identity server's own page at sign-in, with no return to the app:** `ALGEBRIX_REDIRECT_URI` is not registered on the application exactly.
- **"Invalid redirect uri" on the identity server's page at sign-out:** `ALGEBRIX_POST_LOGOUT_REDIRECT_URI` is not registered as a sign-in redirect URI.
- **CORS or origin error in the browser console at sign-in:** `http://localhost:4400` is missing from the allowed origins, or was entered with a path.
- **`invalid_request` about `code_challenge_method`:** the identity server refuses a single-page app's sign-in without PKCE `S256`. This sample always sends it; a changed configuration or another library may not.
- **Clock skew:** if your computer's clock is far off, tokens look expired or not yet valid. Sync the clock.
- **"Your session has ended. Please sign in again."** This is normal when the identity session ends, for example after the idle period or at its maximum lifetime.

## Token storage

- This sample keeps tokens, including the refresh token, in `localStorage`, so users stay signed in across reloads.
- Any script running on the page can read them. Refresh tokens are not invalidated on use, so a stolen one stays usable until the session's idle or maximum lifetime ends.
- The Algebrix Identity docs recommend keeping refresh tokens server-side.
- For production, use a backend-for-frontend: your server holds the tokens, as in the `server-side-web/node-express` sample, and the browser gets only a session cookie.

## Moving to production

- Use `https://` addresses for the redirect URIs and the allowed origin.
- Read "Token storage" above, and prefer a backend-for-frontend.
- Serve the app with a strict Content Security Policy.

## Tested with

- Angular 22.2.0 (`@angular/cli`, `@angular/core`, and the other `@angular` packages)
- angular-auth-oidc-client 22.0.1
- rxjs 7.8.2, typescript 6.0.3
- Node.js 22.23.3
- Algebrix Identity API v2.0

## Download only this sample

```sh
npx degit algebrix/algebrix-identity-samples/spa/angular my-spa
```

Or with git sparse checkout:

```sh
git clone --filter=blob:none --sparse https://github.com/algebrix/algebrix-identity-samples.git
cd algebrix-identity-samples
git sparse-checkout set spa/angular
```
