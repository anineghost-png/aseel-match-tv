# Security and operating boundary
- LAN prototype, single trusted user/network. Default binds 127.0.0.1. Do not expose to the Internet; hosted user/session authentication and TLS termination are not implemented.
- Admin data/actions require a bearer token, origin checks and rate limiting. UI shell contains no private data. Token lives only in page memory; never put it into query strings. HTTP LAN still lacks encryption: use a trusted network or separately configured TLS.
- Provider URLs, keys and credentials stay in .env / ignored data SQLite. SQLite is NOT encrypted. OS account permissions and encrypted disks/backups are the operator's responsibility.
- Gateway accepts only per-session opaque resource IDs derived from registered manifests. Every URL/redirect is exact-host allowlisted and IPv4 DNS-pinned. Private/special IPv4 denied unless exact LAN host explicitly configured. IPv6 outbound deliberately unsupported.
- Manifest 1MB and media segment 8MB caps; 5-second fetch timeout; 3 redirects; encrypted HLS rejected. No DRM/access-control bypass. Only authorization-confirmed provider import.
- Only public TV/app assets served statically; .env and data are outside static roots. CSP prevents external scripts and framing. HTML uses textContent for provider data.
- Diagnostics omit provider/source URLs and auth headers; logs omit query strings and media capabilities. User-agent and device features are retained locally.
- Session resource URLs are temporary bearer capabilities: do not share them. Restart invalidates sessions. TV profile verification is client-reported observed playback, not cryptographic hardware attestation.
- Dependency audit recorded in TEST_RESULTS.md. A clean audit is not proof of zero vulnerabilities.
