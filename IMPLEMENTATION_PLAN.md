# Implementation plan
Read all eight binding blueprint files in docs/blueprint on 2026-10-24. No earlier prototype supplied. GitHub create blocked: connector lacks operation; browser needs login. Preserve milestone commits locally for upload.

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

## Resume checkpoint — 2026-10-24
- Existing branch work/ps4-foundation and nine M0–M8 commits retained unchanged. No reset/rebase/reinitialization.
- Repository anineghost-png/aseel-match-tv verified private with push permission. origin configured. Git CLI authentication is the remaining upload blocker; no remote commits/branches claimed.
- Original history and staged files checked for secrets; ignore rules expanded.
- M0/M1 desktop gates already passed; validate only, do not rebuild. M2–M8 contain implemented slices with explicit integration gaps in KNOWN_LIMITATIONS. M9 blocked on hardware. M10 LAN hardening in progress, not production signoff.
- Next: authenticated push of exact commits; compare remote branch SHA and tree; then complete remaining M10 checks. Physical M9 cannot be automated here.
