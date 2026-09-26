import express from 'express';
import session from 'express-session';
import * as client from 'openid-client';

const port = 3001;
const env = process.env;
const missing = [
  'ALGEBRIX_ISSUER',
  'ALGEBRIX_CLIENT_ID',
  'ALGEBRIX_CLIENT_SECRET',
  'ALGEBRIX_REDIRECT_URI',
  'ALGEBRIX_POST_LOGOUT_REDIRECT_URI',
  'SESSION_SECRET',
].filter((key) => !env[key]);
if (missing.length) {
  console.error(`Missing configuration: ${missing.join(', ')}. Copy .env.example to .env and set it.`);
  process.exit(1);
}

// discovery() takes every endpoint from the issuer's discovery document and checks that
// the document's issuer equals ALGEBRIX_ISSUER. client_secret_basic is set explicitly.
let config;
try {
  config = await client.discovery(
    new URL(env.ALGEBRIX_ISSUER),
    env.ALGEBRIX_CLIENT_ID,
    undefined,
    client.ClientSecretBasic(env.ALGEBRIX_CLIENT_SECRET),
  );
} catch (err) {
  console.error(`Discovery failed: ${err.message}`);
  console.error('Use the exact issuer value from the console integration view.');
  process.exitCode = 1;
}

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const page = (body) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Algebrix Identity</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 48rem; margin: 0 auto; padding: 1rem; color: #222; background: #fafafa; }
  header { border-bottom: 1px solid #ddd; margin-bottom: 1rem; }
  a.button { display: inline-block; padding: 0.5rem 1rem; border: 1px solid #333; border-radius: 4px; color: #222; text-decoration: none; }
  pre { background: #f0f0f0; padding: 0.75rem; overflow-x: auto; font-size: 0.85rem; }
  dt { font-weight: 600; } dd { margin: 0 0 0.5rem; overflow-wrap: anywhere; }
  .note { color: #666; font-size: 0.85rem; }
  .error { border: 1px solid #c33; background: #fff0f0; padding: 0.75rem; }
</style></head>
<body><header><h1>Algebrix Identity</h1></header>${body}</body></html>`;

const signedOutView = (message) =>
  page(`${message ? `<div class="error">${message}</div>` : ''}
<p>Server-side web sample: sign in with your Algebrix Identity account.</p>
<p><a class="button" href="/login">Sign in</a></p>`);

function signedInView({ claims, access_token, expiresAt }) {
  const roles = JSON.parse(Buffer.from(access_token.split('.')[1], 'base64url')).realm_access?.roles ?? [];
  const fields = ['sub', 'preferred_username', 'email', 'name'].filter((key) => claims[key] !== undefined);
  return page(`<dl>${fields.map((key) => `<dt>${key}</dt><dd>${escapeHtml(claims[key])}</dd>`).join('')}
<dt>Roles (realm_access.roles)</dt><dd>${roles.map(escapeHtml).join(', ')}</dd>
<dt>Access token expires</dt><dd>${escapeHtml(new Date(expiresAt).toLocaleString())}</dd></dl>
<p class="note">Decoded for display only. Your application should not make decisions by decoding the access token; your API validates it.</p>
<h2>ID token claims</h2><pre>${escapeHtml(JSON.stringify(claims, null, 2))}</pre>
<p><a class="button" href="/logout">Sign out</a></p>`);
}

function storeTokens(tokens, previous = {}) {
  return {
    access_token: tokens.access_token,
    id_token: tokens.id_token ?? previous.id_token,
    refresh_token: tokens.refresh_token ?? previous.refresh_token,
    claims: tokens.claims() ?? previous.claims,
    expiresAt: Date.now() + tokens.expires_in * 1000,
  };
}

const app = express();
app.use(
  session({
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    // Set secure: true when the app is served over HTTPS in production.
    cookie: { httpOnly: true, sameSite: 'lax', secure: false },
  }),
);

app.get('/', async (req, res) => {
  const { tokens, error } = req.session;
  if (!tokens) {
    delete req.session.error;
    return res.send(signedOutView(error && `${escapeHtml(error)}. See Troubleshooting in the README.`));
  }
  if (tokens.expiresAt - Date.now() < 30_000 && tokens.refresh_token) {
    try {
      req.session.tokens = storeTokens(await client.refreshTokenGrant(config, tokens.refresh_token), tokens);
      console.log('Access token refreshed.');
    } catch {
      return req.session.destroy(() => res.send(signedOutView('Your session has ended. Sign in again.')));
    }
  }
  res.send(signedInView(req.session.tokens));
});

app.get('/login', async (req, res) => {
  const verifier = client.randomPKCECodeVerifier();
  req.session.signIn = { verifier, state: client.randomState() };
  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: env.ALGEBRIX_REDIRECT_URI,
    scope: 'openid profile email',
    code_challenge: await client.calculatePKCECodeChallenge(verifier),
    code_challenge_method: 'S256',
    state: req.session.signIn.state,
  });
  res.redirect(url.href);
});

app.get('/callback', async (req, res) => {
  const { verifier, state } = req.session.signIn ?? {};
  delete req.session.signIn;
  try {
    if (!state) throw new Error('No sign-in in progress.');
    const tokens = await client.authorizationCodeGrant(config, new URL(req.originalUrl, env.ALGEBRIX_REDIRECT_URI), {
      pkceCodeVerifier: verifier,
      expectedState: state,
    });
    // A new session ID after sign-in prevents session fixation.
    await new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));
    req.session.tokens = storeTokens(tokens);
  } catch (err) {
    // Only errors the library has validated (state and iss) come from the provider. Never
    // show text read from the URL directly: anyone can craft a callback link.
    req.session.error = err.error ? `${err.error}: ${err.error_description ?? 'no description'}` : 'Sign-in could not be completed';
  }
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  if (!req.session.tokens) return res.redirect('/');
  const url = client.buildEndSessionUrl(config, {
    id_token_hint: req.session.tokens.id_token,
    post_logout_redirect_uri: env.ALGEBRIX_POST_LOGOUT_REDIRECT_URI,
  });
  req.session.destroy(() => res.redirect(url.href));
});

if (config) {
  app.listen(port, (err) => {
    if (err) {
      console.error(`Could not listen on port ${port}: ${err.message}`);
      process.exitCode = 1;
      return;
    }
    console.log(`Server-side web sample for ${env.ALGEBRIX_ISSUER} listening on http://localhost:${port}`);
  });
}
