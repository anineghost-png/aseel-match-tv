# DATA SOURCES / CURRENT RESEARCH

## football-data.org
Use:
- fixtures
- schedules
- tables
for covered competitions.

Free coverage currently includes:
- UEFA Champions League
- Premier League
- Bundesliga
- Ligue 1
- Serie A
- La Liga
and others.

Free plan has delayed scores; do not label it a live-score source.

## API-Football
Use:
- richer/live fixture data
- events
- lineups
- standings when needed

Current free plan: 100 requests/day.
Therefore a quota manager is mandatory.
Do not poll every 15 seconds on free mode.

## TheSportsDB
Use optionally for:
- team/league artwork
- metadata
Cache and respect image/trademark terms.

## iptv-org/epg
Useful tooling for XMLTV/EPG workflows where use is allowed.
Do not scrape restricted/protected services.

## Threadfin
Optional upstream M3U/XMLTV manager.
Useful features:
- merge/update M3U/XMLTV
- filters/mapping/order/logos/categories
- HLS/M3U8 buffering support
- up to three backup channels per active channel

## hls.js
Use only after feature detection.
Capabilities include:
- adaptive bitrate
- quality switching
- emergency downswitch
- retries/recovery
- redundant/failover playlists
Requires MediaSource-compatible runtime for normal use.

## PlayStation 4 browser
Sony documents the PS4 browser and controller operations.
The browser is WebKit-based.
Sony's user guide documents:
- L1/R1 back/forward
- L2/R2 windows
- left stick pointer
- right stick scroll
- Square toggles browser fullscreen
Because Square/OPTIONS have browser-level meaning, ASEEL must not depend on them for core app navigation.
