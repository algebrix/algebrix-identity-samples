import * as client from 'openid-client';

const { ALGEBRIX_ISSUER, ALGEBRIX_CLIENT_ID, ALGEBRIX_CLIENT_SECRET, API_BASE_URL } = process.env;
const missing = Object.entries({ ALGEBRIX_ISSUER, ALGEBRIX_CLIENT_ID, ALGEBRIX_CLIENT_SECRET, API_BASE_URL })
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  console.error(`Missing configuration: ${missing.join(', ')}. Copy .env.example to .env and set it.`);
  process.exit(1);
}

// Machine tokens are metered, so reuse one until it is close to expiry.
const RENEW_MARGIN_SECONDS = 60;
let config;
let cached;

async function getAccessToken() {
  const secondsLeft = cached ? Math.floor((cached.expiresAt - Date.now()) / 1000) : 0;
  if (secondsLeft > RENEW_MARGIN_SECONDS) {
    console.log(`Token: from cache, ${secondsLeft} seconds left`);
    return cached.token;
  }

  let tokens;
  try {
    tokens = await client.clientCredentialsGrant(config);
  } catch (err) {
    throw new Error(`Token request failed: ${err.error ? `${err.error} (${err.error_description ?? 'no description'})` : err.message}`);
  }
  cached = { token: tokens.access_token, expiresAt: Date.now() + tokens.expires_in * 1000 };
  console.log(`Token: newly requested, ${tokens.expires_in} seconds left (token_type ${tokens.token_type}, expires_in ${tokens.expires_in})`);
  console.log(
    tokens.refresh_token
      ? 'Refresh token: issued'
      : 'Refresh token: none issued (machine-to-machine applications request a new token instead)',
  );
  return cached.token;
}

async function callApi(path, token) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, token && { headers: { Authorization: `Bearer ${token}` } });
  } catch {
    throw new Error(`Could not connect to ${API_BASE_URL}. Start the resource server sample (resource-server/node-express) first.`);
  }
  console.log(`GET ${path}: ${response.status} ${await response.text()}`);
}

// Failures set process.exitCode instead of calling process.exit(), so open network
// handles close cleanly before Node exits.
try {
  // discovery() takes every endpoint from the issuer's discovery document and checks that
  // the document's issuer equals ALGEBRIX_ISSUER. client_secret_basic is set explicitly.
  try {
    config = await client.discovery(
      new URL(ALGEBRIX_ISSUER),
      ALGEBRIX_CLIENT_ID,
      undefined,
      client.ClientSecretBasic(ALGEBRIX_CLIENT_SECRET),
    );
  } catch (err) {
    throw new Error(`Discovery failed: ${err.message}\nUse the exact issuer value from the console integration view.`);
  }

  await getAccessToken();
  await callApi('/api/public');
  const token = await getAccessToken();
  await callApi('/api/protected', token);
} catch (err) {
  console.error(err.message);
  process.exitCode = 1;
}
