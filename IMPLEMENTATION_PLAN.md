# Implementation plan
Read all eight binding blueprint files in docs/blueprint on 2026-10-24. No earlier prototype supplied. GitHub history imported; origin/work/ps4-foundation verified at 0be31703c9453caae7a61450c09286b323c08e09 before RC changes.

M0: Node 24 LTS, TypeScript, SQLite, locked dependencies, CI. Gate: build and tests.
M1: ES5 Arabic RTL TV, spatial focus/modal restoration, controller page, persisted capabilities. Gate: browser tests + ES5 parse/budgets.
M2: football-data.org/API-Football adapters, cache/coalescing/quota/backoff, Baghdad dates, explicit demo. Real API acceptance awaits keys.
M3: authorized M3U/XMLTV, streaming bounded parsing, rolling window, lineage/deduplication. Gate: adversarial parser tests.
M4: conservative bilingual mapping, authenticated manual review. Gate: wrong/stale/one-team reject autoplay.
M5: SSRF-safe bounded HLS probes, weighted ranking/history. Gate: controlled healthy/dead sources.
M6: capability-gated player, native HLS, optional hls.js, restricted gateway, locally generated legal media. Gate: desktop browser tests; PS4 pending.
M7: retry/failover with cooldown, bounded telemetry. Gate: deterministic state-machine tests.
M8: optional Threadfin via same authorized M3U/XMLTV import, explicit LAN allowlist, documentation.
M9: BLOCKED on physical PS4. Produce checklist/evidence template; continue independent work.
M10: security, performance, audit, runbook and honest limitations. No public hosted deployment.

Use vertical slices and test before each milestone commit. Native node:sqlite avoids addon build dependency; requires Node 24+. Client is vanilla ES5. Secrets server-only. Registered sources only, DNS-pinned outbound allowlist. No demo substitution on production failure. Capability existence never means verified playback. Record reductions and unfinished gates explicitly.

## RC1 scope — 2026-10-24
- M0–M8: preserve existing implementation/evidence; do not rebuild.
- Synced exact remote commit 0be31703c9453caae7a61450c09286b323c08e09 by verified Git objects and fast-forward; native git fetch had no credentials. CI FFmpeg fix retained.
- M10 only: portable media generation, two-command LAN startup, printed PS4 URL candidates, bounded device storage, no-store API responses, orderly worker shutdown, initial network error state, stricter ES5 asset budgets, current runbook.
- Final gates: npm run check; npm run media; npm run test:browser; npm audit; history/secret check; parent-preserving commit publication and green GitHub Actions.
- M9: pending physical PS4. Follow docs/PS4_ACCEPTANCE.md; do not declare video/controller/fullscreen/soak successful from desktop evidence.
- No optional feature expansion; known provider/codec and trusted-LAN limitations remain explicit.
