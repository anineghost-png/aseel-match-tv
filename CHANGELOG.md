# Changelog
## M0
Binding blueprint preserved; plan written before code. Monorepo, dependency pins, CI and secret exclusions.
## M1
Arabic RTL TV, stable cards, modal focus trap, directional navigation, optional gamepad fallback, capability profile persistence and controller page. ES5 parser/budget tests passed; Chromium integration passed. PS4 unverified.
## M2
Sports adapters, normalized fixtures and explicit demo, persisted quota reserve/cache/backoff and duplicate-request coalescing. Seven tests + Chromium passed; real credentials not tested.
## M3
M3U deduplication/lineage, chunked SAX XMLTV parser with DTD rejection and rolling window, DNS-pinned outbound allowlist and bounded fetches. Eleven tests passed.
## M4
Conservative bilingual evidence scorer, persistent review/rules, admin onboarding and diagnostic UI. Eighteen tests passed; wrong simultaneous teams and stale EPG cannot auto-confirm.
## M5
Bounded HLS manifest/segment probing, measured throughput/TTFB, history and weighted ranking. Controlled HTTP stable/dead tests passed (21 total).
## M6
Capability-gated native/HLS.js player and opaque registered-source HLS gateway; local FFmpeg H264/AAC test assets. Client-observed playback verification remains distinct from physical PS4 acceptance. Integrated authenticated ingestion, review, health and diagnostic routes. 23 unit/integration passed; 4 browser passed, actual H264/AAC playback skipped because installed Chromium lacks codecs. Not a playback success claim.
## M7
One local player retry, serialized failover requests, stale callback cancellation, source circuit cooldown, session cleanup and deterministic no-flapping selection. 25 tests passed including server failover and source URL secrecy.
## M8
Threadfin-compatible authorized upstream refresh contract and removed-source disabling tested with local HTTP fixtures. Actual Threadfin application/version is untested; optional adapter requires no Threadfin dependency.
## M10 LAN hardening checkpoint (M9 remains blocked)
- Preserved M0–M8 commit history and resumed existing worktree; no reset/rewrite.
- Fixed stale fixture filtering, removed-EPG mapping invalidation, source cooldown selection, gamepad press edges, callback races and ES5 formatter regression.
- Added full authorized-ingest-to-gateway integration and security tests, PS4 checklist, security/run docs and local startup scripts.
- Dependency audit: zero known vulnerabilities after pinned upgrades. 31 unit/integration tests and 6 browser tests pass; actual codec-playback test skipped explicitly.
- Expanded secret/playlist exclusions and added history/staging scanner.
- Verified target repository is private and configured origin. Exact-history push still requires Git CLI authentication; connector-created replacement commits would change original SHAs and are not used.
