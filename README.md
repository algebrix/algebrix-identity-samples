# Algebrix Identity samples

Runnable starter apps that show how to sign users in and validate tokens with Algebrix Identity, using standard OpenID Connect (OIDC) libraries.

## Reference samples, not an SDK

Each sample uses a widely used open-source OIDC library directly. Nothing from Algebrix needs to be installed. The samples are reference material: copy them and adapt them to your own application.

## Samples

| Application type | Stack | Folder | Phase | Status |
|---|---|---|---|---|
| [Single-page app](spa/) | React | [`spa/react`](spa/react/) | 1 | Available |
| [Single-page app](spa/) | Angular | [`spa/angular`](spa/angular/) | 1 | Available |
| [Server-side web app](server-side-web/) | Node.js (Express) | [`server-side-web/node-express`](server-side-web/node-express/) | 1 | Available |
| [Server-side web app](server-side-web/) | .NET | `server-side-web/dotnet` | 2 | Planned |
| [Server-side web app](server-side-web/) | Java (Spring) | `server-side-web/java-spring` | 2 | Planned |
| [Server-side web app](server-side-web/) | Python (Flask) | `server-side-web/python-flask` | 2 | Planned |
| [Machine-to-machine](machine-to-machine/) | Node.js | [`machine-to-machine/node`](machine-to-machine/node/) | 1 | Available |
| [Machine-to-machine](machine-to-machine/) | Python | `machine-to-machine/python` | 2 (optional, not yet decided) | Planned |
| [Resource server (API)](resource-server/) | Node.js (Express) | [`resource-server/node-express`](resource-server/node-express/) | 1 | Available |
| Native mobile app | iOS | `native-mobile/ios` | 3 | Planned |
| Native mobile app | Android | `native-mobile/android` | 3 | Planned |

## Before you start

You need an Algebrix Identity organization and access to its console. Every sample runs locally on your machine. Nothing is deployed.

## How it fits together

| Application type | Client type | Grant | Secret | PKCE |
|---|---|---|---|---|
| Single-page app | Public | Authorization code | No | S256, required |
| Server-side web app | Confidential | Authorization code | Yes, `client_secret_basic` | S256, optional and recommended (the samples use it) |
| Native mobile app | Public | Authorization code | No | S256 |
| Machine-to-machine | Confidential | Client credentials | Yes | Not applicable |

The resource server sample is an API that validates access tokens issued to the other application types. It does not sign anyone in and needs no application registration.

## Download only the sample you need

With degit:

```sh
npx degit algebrix/algebrix-identity-samples/<type>/<stack> my-app

# Example
npx degit algebrix/algebrix-identity-samples/spa/react my-app
```

With git sparse checkout:

```sh
git clone --filter=blob:none --sparse https://github.com/algebrix/algebrix-identity-samples.git
cd algebrix-identity-samples
git sparse-checkout set <type>/<stack>
```

## Configuration and the issuer value

- Set the authority to the exact issuer value shown in your application's integration view, for example `https://auth.algebrix.co/realms/your-organization`. The samples fetch every endpoint from that issuer's discovery document at startup.
- Do not use the path form (the same URL without `/realms/`) as the authority. Its discovery document reports the `/realms/` issuer, so strict libraries reject it with an issuer mismatch. Each sample's README says what its library does.
- Never commit your real configuration. Each sample ships an example file with placeholders only: `.env.example`, or `public/config.example.json` in the Angular sample.

## Tested platform version

Algebrix Identity API documentation v2.0.

## Security

See [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).
