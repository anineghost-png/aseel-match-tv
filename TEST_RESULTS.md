# Verification checkpoint — 2026-10-24

## Executed
- `npm run check`: TypeScript compilation passed; **31 unit/integration tests passed, 0 failed**.
- `npm run test:browser`: **6 passed, 0 failed, 1 explicitly skipped**.
- `npm audit`: **0 known vulnerabilities**, including development dependencies.
- ES5 syntax and asset budget checks passed. Home JS approximately 16KB uncompressed, CSS 4.5KB; lazy HLS bundle excluded from initial load. DOM below 500 nodes for the test schedule, no horizontal overflow at 1920x1080 or 1280x720. These are desktop budgets, not PS4 hardware measurements.
- Safe local H264/AAC media generated with FFmpeg. HTTP gateway fetch/rewrite and segment delivery passed; actual codec playback NOT verified.
- M3U → XMLTV → confidence mapping → two source probes → opaque playback gateway → manual rejection: end-to-end API integration passed.
- 20 overlay open/close cycles and focus restoration passed. Simulated refresh preserves focus. JS globals disabled (Promise/Map/Set/fetch/Gamepad) still renders and opens overlay.
- Held gamepad X produces one selection per press/release in desktop emulation. Corrected test clock installation ordering found during resume; this is not physical DUALSHOCK evidence.
- Authenticated diagnostics omit source/provider credentials; encoded admin paths, cross-origin writes, arbitrary proxy URL and .env retrieval denied.
- Reachable Git history scanned (83 blobs before checkpoint), no credential-pattern or sensitive-file findings. Staged checkpoint is scanned again before commit. This scanner covers common credential signatures and filenames, not a guarantee against every possible secret format.

## Explicitly not passed
- H264/AAC video advancement in installed Chromium: skipped because both required codec support probes return false. Separate codec-error test passes and confirms no successful device verification is stored.
- PS4 native HLS/MSE, real controller behavior/fullscreen, 30-minute real-time refresh and two-hour soak: pending real device.
- Authorized external IPTV and real football API: no credentials supplied, not exercised.
- Actual Threadfin application/version: not exercised; exported M3U/XMLTV contract tested locally.
- GitHub history imported and remote base SHA 0be31703c9453caae7a61450c09286b323c08e09 verified locally; CI FFmpeg fix retained. RC results below supersede checkpoint counts.

## Milestone status
| Milestone | Evidence/status |
|---|---|
| M0 | Tooling, database, config and tests implemented; desktop gate passed |
| M1 | RTL UI, compatibility probe, focus/controller page implemented; desktop gate passed |
| M2–M5 | Implemented slices tested; real provider/EPG/network acceptance pending |
| M6 | Player/gateway/test assets implemented; actual H264/AAC playback blocked by runtime |
| M7 | Retry/fallback/cooldown tested at state/API level; real media outage recovery pending |
| M8 | Optional upstream contract tested; actual Threadfin unverified |
| M9 | BLOCKED — physical PS4 required |
| M10 | LAN hardening checkpoint; not complete production release |

## RC1 final verification
Results recorded after the single final test sequence. PS4 acceptance remains PENDING.

- Final RC1 sequence: `npm run check` **32 passed / 0 failed**, TypeScript passed; `npm run media` generated local legal H264/AAC test video successfully; `npm run test:browser` **7 passed / 0 failed / 1 skipped**; `npm audit` **0 vulnerabilities**.
- Browser binary was initially absent in this refreshed environment. Installed the pinned Playwright Chromium and resumed the browser/audit portion only; no repeated application build/test cycle was required.
- Skipped: actual H264/AAC decode in this Chromium. Codec failure never records successful verification. Physical PS4 remains unverified.
- Tightened enforced ceilings: all first-party TV JavaScript <40KB, CSS <12KB; ES5 parse and 1080p/720p layout/DOM checks passed.
- RC1 adds bounded profile storage/no-store tests and actionable initial network-failure browser coverage.
- M10 LAN RC scope closed for software testing; publication requires a green Actions run attached to the RC commit. M9 hardware signoff remains separate.
