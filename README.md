# ASEEL MATCH TV

Arabic RTL, match-first football hub designed for the PlayStation 4 browser and DUALSHOCK 4.

## Current status — V1 Product Pass

- Source of truth: `anineghost-png/aseel-match-tv`
- Production branch: `main`
- Hosted PS4 smoke URL: `https://aseel-match-tv.vercel.app`
- Hosted smoke health: `/api/health`
- Hosted smoke mode is intentionally `DEMO_MODE=true` until a real sports-data credential and an authorized viewing source are configured.
- The hosted smoke deployment provides the production TV shell, controller navigation, device-registration compatibility page, and safe playback refusal when no authorized source exists.
- The full persistent Node backend remains the source implementation for authorized M3U/XMLTV import, media validation, ranking, gateway playback and failover.

## Verified physical PS4 evidence

The following were verified on a real PS4 browser during M9 physical testing:

- ASEEL MATCH TV opened over LAN.
- DUALSHOCK 4 navigation/select/back worked.
- `/compat` local H264/AAC HLS test played with audio and advanced beyond the acceptance threshold.
- Home navigation, opening a match card and closing the viewer worked.

See `docs/PS4_ACCEPTANCE.md` for the recorded evidence and the remaining M9 items.

## Hosted architecture

The final user experience is intended to be:

1. Turn on PS4.
2. Open one permanent HTTPS ASEEL MATCH TV URL.
3. Browse matches in Arabic with the controller.
4. Open a match and let ASEEL select the best confirmed authorized source.

The PS4 must not depend on a phone, Termux or laptop for normal daily runtime.

### Current Vercel smoke deployment

Vercel currently hosts the public TV shell and stateless smoke endpoints so the permanent HTTPS path can be tested on PS4 without A9/Termux. This is not the final persistent media gateway: Vercel's serverless runtime is intentionally not used to proxy full match streams or preserve the on-disk catalog.

For the complete backend deployment, use a persistent Node host with writable persistent storage and FFmpeg available. The repository includes `Dockerfile` for that deployment model.

## Drama Live bridge

The persistent backend includes a dedicated handoff adapter for an operator-owned or otherwise authorized Drama Live installation.

From `/admin`, **ربط Drama Live** can inspect the text produced by Drama Live's share action and recognize:

- direct M3U/M3U8 sources;
- Xtream connection details in English or Arabic;
- legacy Drama Live Xtream relay URLs, which ASEEL normalizes to the provider's direct standard playlist instead of using the relay;
- FG Code handoffs, which are identified separately and are not guessed to be M3U.

The preview reveals only the source type and hostname. Upstream URLs and credentials remain server-side and are excluded from the TV UI and diagnostics. Add the authorized provider hostname to `MEDIA_ALLOWED_HOSTS` before importing it.

See `docs/DRAMA_PROVIDER.md` for the handoff and security flow.

## Environment variables

Copy `.env.example` to `.env` for local or persistent-host deployment. Never commit secrets.

Required for the full backend:

- `HOST=0.0.0.0`
- `PORT` — usually supplied by the hosting provider; local default is 3000.
- `ADMIN_TOKEN` — random 32+ printable ASCII secret.
- `DEMO_MODE=true|false`
- `DATA_DIR=/data` on a persistent host.
- `MEDIA_ALLOWED_HOSTS` — comma-separated domains belonging only to authorized viewing providers.
- `MEDIA_LAN_HOSTS` — normally empty in cloud hosting.

Sports data (choose one):

- `FOOTBALL_DATA_API_KEY`
- `API_FOOTBALL_KEY`

## Authorized media only

ASEEL MATCH TV does not discover, bundle or bypass protected pay-TV streams. Media is imported only from a source the operator is authorized to use, through the Admin interface/API. Provider URLs and credentials must remain server-side and must never be exposed in the TV UI or committed to Git.

The backend supports authorized M3U/XMLTV imports, conservative match-to-channel mapping, source health probes, ranking, opaque playback URLs and controlled fallback.

## Local development

```bash
npm ci
npm run check
npm run media
npm start
```

Open:

- TV: `http://localhost:3000/`
- Compatibility: `http://localhost:3000/compat`
- Controller test: `http://localhost:3000/controller`
- Admin: `http://localhost:3000/admin`

## Docker

```bash
docker build -t aseel-match-tv .
docker run --rm -p 3000:3000 \
  -e ADMIN_TOKEN='replace-me-with-a-long-random-secret' \
  -e DEMO_MODE=true \
  -v aseel-data:/data \
  aseel-match-tv
```

For a persistent host, mount a volume at `/data`.

## Tests

The CI pipeline runs TypeScript build/checks, unit/integration tests, FFmpeg media generation and browser tests. PS4-specific acceptance still includes real-device checks that automation cannot replace.
