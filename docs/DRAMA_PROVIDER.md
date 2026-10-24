# Drama Live provider bridge

ASEEL MATCH TV can accept an authorized source handoff from Drama Live and can also use an optional direct provider mode for an installation whose operator controls the entitlement.

## Mode 1: share/handoff

Supported handoffs:

- Direct M3U/M3U8 URL.
- Xtream server + username + password share text, in English or Arabic labels.
- Legacy Drama Live Xtream relay URLs are normalized to the provider's direct standard `get.php` playlist so credentials are not sent through the legacy relay by ASEEL MATCH TV.
- FG Code URLs are detected, but they are not guessed to be M3U.

From `/admin`, use **ربط Drama Live** to preview the handoff before importing it. The preview returns only the source kind and hostname.

## Mode 2: direct FG provider

For a Drama Live installation that opens with an operator-owned FG entitlement and does not expose a username/password, the persistent backend can speak the application's encrypted live-catalog protocol directly. This mode is disabled by default and never contains entitlement values in source control.

Configure only in the private runtime `.env`:

```text
DRAMA_DIRECT_ENABLED=true
DRAMA_LIVE_API_BASE=<authorized live API base>
DRAMA_FG_CODE=<private entitlement code>
DRAMA_PROTOCOL_KEY=<private protocol key>
DRAMA_PROTOCOL_IV=<private protocol IV>
DRAMA_DEVICE_ID=<stable local device id, optional>
```

Optional request metadata can be overridden with the other `DRAMA_*` environment variables in `.env.example`. `DRAMA_REQUEST_CONTEXT_JSON` exists only for compatibility when a provider requires additional request metadata.

The API hostname and every stream hostname returned by the catalog must also be explicitly allowed in `MEDIA_ALLOWED_HOSTS`. The first refresh reports blocked hostnames in the protected admin status instead of silently bypassing the allow-list.

Protected admin endpoints:

- `GET /api/admin/providers/drama-direct/status` — configuration state, hostname and last sync counts only; no entitlement value is returned.
- `POST /api/admin/providers/drama-direct/refresh` — refresh topics/channels/sources immediately.

When direct mode is ready, a background job refreshes the catalog at startup and then approximately hourly. Existing source-health ranking and playback failover continue to operate on the normalized sources.

## Security

- Never commit Drama Live share text, playlists, usernames, passwords, FG codes, protocol material, tokens, provider URLs or real stream URLs.
- The TV UI never receives the upstream provider URL or credentials.
- Admin diagnostics redact provider URLs and source URLs.
- All API and media URLs pass through `SafeNet` host allow-list and SSRF validation.
- The direct client does not bypass DRM, access controls or provider authorization; it only uses runtime credentials supplied by the authorized operator.
- Data stored by the persistent backend belongs in `DATA_DIR`; protect that directory as sensitive application state.

## PS4 flow

Drama Live remains a backend provider, not an Android app running on PS4. The intended path is:

`authorized Drama Live provider -> ASEEL backend/gateway -> PS4 browser`

This keeps provider details off the PS4 and lets ASEEL handle the Arabic match-first UI, source ranking, fallback and browser compatibility.
