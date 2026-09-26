import express from 'express';
import { createRemoteJWKSet, jwtVerify } from 'jose';

const port = 8081;
const issuer = process.env.ALGEBRIX_ISSUER;
if (!issuer) {
  console.error('ALGEBRIX_ISSUER is not set. Copy .env.example to .env and set it.');
  process.exit(1);
}
const allowedAzp = (process.env.ALLOWED_AZP || '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);

// Take every endpoint from the issuer's discovery document.
let discovery;
try {
  const response = await fetch(`${issuer}/.well-known/openid-configuration`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  discovery = await response.json();
} catch (err) {
  console.error(`Could not fetch the discovery document for ${issuer}: ${err.message}`);
  process.exit(1);
}
if (discovery.issuer !== issuer) {
  console.error(
    `Issuer mismatch: ALGEBRIX_ISSUER is "${issuer}" but the discovery document reports "${discovery.issuer}". ` +
      'Use the exact issuer value from the console integration view.',
  );
  process.exit(1);
}

// jose caches the keys and refetches them when a token carries an unknown kid.
const jwks = createRemoteJWKSet(new URL(discovery.jwks_uri));

async function requireToken(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.headers.authorization || '');
  if (!match) return res.set('WWW-Authenticate', 'Bearer').status(401).end();

  try {
    // No audience check: Algebrix sets aud to "account" on every token, so it cannot
    // identify this API or the calling application. Use azp for that.
    const { payload } = await jwtVerify(match[1], jwks, {
      issuer,
      algorithms: ['RS256'],
      clockTolerance: 30,
    });
    if (allowedAzp.length && !allowedAzp.includes(payload.azp)) {
      throw new Error(`azp "${payload.azp}" is not in ALLOWED_AZP`);
    }
    req.claims = payload;
    next();
  } catch (err) {
    console.warn(`Token rejected: ${err.message}`);
    res.set('WWW-Authenticate', 'Bearer error="invalid_token"').status(401).end();
  }
}

const rolesOf = (claims) => claims.realm_access?.roles ?? [];

const app = express();

app.get('/api/public', (req, res) => {
  res.json({ message: 'Public endpoint: no token required.' });
});

app.get('/api/protected', requireToken, (req, res) => {
  res.json({ sub: req.claims.sub, azp: req.claims.azp, roles: rolesOf(req.claims) });
});

app.get('/api/admin-only', requireToken, (req, res) => {
  // realm_access.roles also holds built-in roles, so test that admin is present.
  if (!rolesOf(req.claims).includes('admin')) {
    return res.status(403).json({ error: 'The admin role is required.' });
  }
  res.json({ message: 'Admin endpoint: access granted.', sub: req.claims.sub });
});

app.listen(port, (err) => {
  if (err) {
    console.error(`Could not listen on port ${port}: ${err.message}`);
    process.exit(1);
  }
  console.log(`Resource server for ${issuer} listening on http://localhost:${port}`);
});
