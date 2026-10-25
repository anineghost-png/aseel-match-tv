# PS4 DramaLive bridge

Urgent compatibility path for sources the user is already authorized to watch in a normal desktop browser. The bridge does not bypass DRM, decrypt protected media, or commit subscription credentials/URLs.

## Start

From the ASEEL MATCH TV repository on the computer that can already open DramaLive:

```bash
npm ci
npm run ps4:dramalive
```

The command starts a private-LAN web page (default port `3001`) and opens a dedicated Chrome/Chromium profile at `https://web.dramalive.cc/`.

Select the wanted channel in the opened Chrome window. The bridge watches for HLS/DASH media manifests used by that browser session, then asks FFmpeg to:

1. remux the media to MPEG-TS HLS without re-encoding when possible (low CPU); or
2. fall back to H264/AAC 720p compatibility transcoding when direct remux fails.

The terminal prints the exact URL to open on the PS4, for example:

```text
http://192.168.1.25:3001/dramalive
```

Keep the computer and PS4 on the same trusted private Wi-Fi/LAN. Do not configure router port forwarding.

## Requirements

- Node.js 24+ (already required by this project)
- FFmpeg available in `PATH`, or set `FFMPEG_PATH` to the executable
- Google Chrome, or Playwright Chromium

If neither Chrome nor Playwright Chromium is available, run once:

```bash
npx playwright install chromium
```

## Runtime privacy

- Full media URLs, request cookies and authorization headers are not written to the repository or printed to the terminal.
- They are used only in the running process when FFmpeg needs the same authorized browser request context.
- The dedicated browser profile lives under ignored `data/` so login/session state can persist locally.
- The PS4 status page exposes only state, source hostname, source type and bridge mode.

## Limitations

If a selected source uses DRM/encryption that FFmpeg and the PS4 browser cannot legally/technically consume, the bridge reports it as incompatible and the user must choose another authorized source. No DRM bypass is attempted.
