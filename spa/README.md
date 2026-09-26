# Single-page app samples

Rules shared by every single-page app (SPA) sample.

## Client and flow

- A SPA is a public client and has no secret.
- It uses the authorization code grant with PKCE `S256`. PKCE is required: a request without it, or with `plain`, is refused with `invalid_request`.

## Redirect URIs

- Redirect URIs use `https://`. `http://` is accepted only for `localhost` and `127.0.0.1`.
- Wildcards are allowed in the path only.
- An unregistered redirect URI shows an error on the identity server's own page and never returns to your callback.
- There is no separate post-logout redirect field: a post-logout redirect must be one of the application's sign-in redirect URIs.

## Allowed origins

- Each allowed origin is a bare origin with no path, for example `http://localhost:3000`.
- An application can have at most 20 allowed origins.
- Only single-page apps have allowed origins.

## Token lifetimes

- User access token: 300 seconds by default, configurable from 60 to 3,600 seconds.
- Refresh token: 1,800 seconds idle period, 36,000 seconds maximum session.
- Refresh tokens are not rotated.
- Each refresh returns a new refresh token value, and the previous one stays valid until it expires.

## Token storage

- The SPA samples keep tokens, including the refresh token, in `localStorage`, so users stay signed in across reloads.
- Any script running on the page can read them, and a stolen refresh token stays usable until the session's idle or maximum lifetime ends.
- The Algebrix Identity docs recommend keeping refresh tokens server-side. For production, use a backend-for-frontend: your server holds the tokens, as in the `server-side-web/node-express` sample, and the browser gets only a session cookie.

## Stacks

| Stack | Folder | Phase | Status |
|---|---|---|---|
| React | [`spa/react`](react/) | 1 | Available |
| Angular | [`spa/angular`](angular/) | 1 | Available |
