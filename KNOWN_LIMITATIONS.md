# Known limitations / release blockers

1. Private GitHub repository exists and origin is configured. It has NOT been pushed: connector permissions are available, but terminal Git authentication is unavailable. Connector commit creation cannot preserve original commit SHAs. Local history is preserved pending authenticated git push.
2. M9 physical PS4 acceptance NOT run. DUALSHOCK 4 key delivery, native HLS, MSE, audio/video, fullscreen, 30-minute real refresh and 2-hour soak remain unverified.
3. Installed Chromium lacks H264 and AAC (`MediaSource.isTypeSupported` false). Actual HLS playback test explicitly skipped; codec failure path tested. Gateway HTTP success is not video decode success.
4. No real provider credentials used; fixture/standings adapters tested with mocks only. Real-data v1 acceptance remains open.
5. One sports provider selected at a time (football-data preferred); no merged API-Football live supplementation, selected-match live polling, lineup/events or artwork integration. Fixture cache interval 15 minutes to preserve budget. Scores from football-data labeled delayed.
6. HLS only. Gateway rewrites/proxies authorized registered manifests and segments; no FFmpeg remux gateway, DASH, progressive IPTV, transcoding, DRM or encrypted HLS. Playback requires native HLS or verified MSE. This remains a compatibility decision until PS4 evidence exists.
7. Threadfin's exported M3U/XMLTV contract tested with local fixtures; actual Threadfin version/application not tested. Optional Xtream account adapter not implemented.
8. LAN single-user mode only. No hosted TLS/login/user isolation, production deployment, or Internet exposure. Admin APIs require bearer auth but TV endpoints assume trusted LAN. Admin shell itself contains no private information.
9. Provider credentials in .env/SQLite are server-side but not encrypted at rest. Protect local OS account, disk and backups. Exported diagnostics omit URLs/secrets.
10. XMLTV is parsed incrementally but URL downloads are bounded buffers (20MB scheduled, 1.9MB admin upload); not a fully network-streamed ingest. HLS segment cap 8MB, timeout 5s, IPv4 only. HTTP Range/BYTERANGE media and external provider-specific headers are not supported.
11. Arabic team aliases initially cover Barcelona, Real Madrid, Atletico, Sevilla, Arsenal and Inter. Other provider names display as supplied and require dictionary expansion; no invented translations.
12. Health tests include deterministic throughput/stability cases and controlled HTTP sources, not a real degraded network/PS4 playback soak. Health codec metadata may be absent in single-rendition manifests; absence is not codec proof.
13. Device verification is client-reported observed test progress, not hardware attestation. Re-probing creates a new unverified profile. Profiles/session telemetry retained locally; seven-day telemetry cleanup.
14. Historical manual rules add evidence only; they never overcome missing both teams/time. Ranking thresholds and quality budgets require tuning on authorized provider data and real PS4 measurements.

v1 is not declared complete. M0/M1 are desktop-validated; M2–M8 have implementation and automated evidence with the external/integration gates above. M10 hardening is a LAN baseline, not a production certification.
