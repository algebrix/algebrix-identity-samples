# Server-side web app samples

Rules shared by every server-side web app sample.

## Client and flow

- A server-side web app is a confidential client with a secret, authenticated with `client_secret_basic`.
- It uses the authorization code grant. PKCE is optional and recommended. The samples use it.

## Tokens and session

- Tokens live in the server-side session.
- The browser only gets an `httpOnly` session cookie.

## Redirect URIs

- Redirect URIs use `https://`. `http://` is accepted only for `localhost` and `127.0.0.1`.
- Wildcards are allowed in the path only.
- An unregistered redirect URI shows an error on the identity server's own page and never returns to your callback.
- There is no separate post-logout redirect field: a post-logout redirect must be one of the application's sign-in redirect URIs.
- Server-side web apps have no allowed origins.

## Secret handling

- The secret never reaches a browser.
- Rotating a secret invalidates the previous one immediately.

## Stacks

| Stack | Folder | Phase | Status |
|---|---|---|---|
| Node.js (Express) | [`server-side-web/node-express`](node-express/) | 1 | Available |
| .NET | `server-side-web/dotnet` | 2 | Planned |
| Java (Spring) | `server-side-web/java-spring` | 2 | Planned |
| Python (Flask) | `server-side-web/python-flask` | 2 | Planned |
