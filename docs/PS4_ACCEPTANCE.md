# Physical PS4 acceptance — PARTIAL RUN

Physical PS4 testing started on 2026-10-24. This file records only behavior actually observed on the console. Firmware/browser UA, display resolution and device profile ID were not captured during this first pass and remain to be added. A desktop/browser capability profile is not treated as physical acceptance.

Preparation used the RC1 LAN server on a Galaxy A9 running Termux with Node.js 26 and FFmpeg 9. The phone and PS4 were on the same trusted LAN. `npm ci` and `npm run ps4` completed successfully, the server printed a LAN candidate URL, and the same URL was reachable from another phone before PS4 testing.

1. Node backend on same trusted LAN. HOST=0.0.0.0, private-network access only, no router port forwarding. **PASS (physical PS4 reached the app).**
2. `/compat`: capability page opened on the physical PS4. Generated local legal H264/AAC test media played with **video and audio successfully observed by the user**. Exact native-HLS vs HLS.js path was not captured in this first pass. **PASS for local A/V playback; path evidence pending.**
3. Confirm Arabic readability/no clipping at 1920×1080 and 1280×720. **PENDING explicit resolution evidence.**
4. Square browser fullscreen and OPTIONS remain browser-owned. Pointer/left stick remains usable. **PENDING explicit fullscreen/browser-owned-button evidence.**
5. Navigation/control from the physical DUALSHOCK 4 was successfully used to operate the interface. Exact Gamepad API vs browser key delivery was not captured. **PASS for usable controller navigation; event-path evidence pending.**
6. Open/close Match Center 20 times; focus returns to opener. **PENDING.**
7. Leave home 30 minutes across real refreshes; focus remains and score/date freshness are correct. **PENDING.**
8. Play an authorized stream with confirmed mapping and fresh health. Record startup seconds, audio sync, rendition and stalls. **PENDING authorized provider data.**
9. In a controlled test source, stop the primary; confirm one retry then verified fallback, Arabic toast and no immediate switchback. **PENDING.**
10. Two-hour playback/navigation soak. Record memory/crashes, dropped input, stalls and recovery. **PENDING.**
11. API offline: cached real fixtures remain, freshness warning appears, no demo data is substituted. **PENDING real-data acceptance.**

## Evidence table
| Item | Result | Evidence | Date |
|---|---|---|---|
| PS4 reaches ASEEL MATCH TV over LAN | PASS | User-observed physical PS4 load from RC1 LAN server | 2026-10-24 |
| `/compat` opens on physical PS4 | PASS | User-observed | 2026-10-24 |
| Local legal H264/AAC video + audio | PASS | User confirmed moving video and audible audio on physical PS4 | 2026-10-24 |
| DUALSHOCK 4 usable for interface control | PASS | User confirmed physical controller operation | 2026-10-24 |
| Full M9 acceptance | PARTIAL | Remaining checklist items above still pending | 2026-10-24 |

Do not mark v1 fully released until the remaining M9 checks, real fixture ingestion and authorized-stream acceptance are complete.
