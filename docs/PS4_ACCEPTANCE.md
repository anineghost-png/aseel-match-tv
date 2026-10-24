# Physical PS4 acceptance — NOT RUN

No physical PS4 success is claimed. Fill each item with date, console firmware/browser UA, display resolution, device profile ID, result and error notes. A desktop/browser capability profile is not physical acceptance.

1. Node backend on same trusted LAN. HOST=0.0.0.0, private-network firewall only, no router port forwarding. Open http://PC-LAN-IP:3000 and bookmark it.
2. /compat: save capabilities; run generated native HLS test, then HLS.js only if available. Observe video/audio and verify actual advancement. Retain device profile ID.
3. Confirm Arabic readability/no clipping at 1920×1080 and 1280×720.
4. Square browser fullscreen and OPTIONS remain browser-owned. Pointer/left stick remains usable.
5. Navigate with D-pad or browser link navigation; X activates. Record whether browser exposes Gamepad API or keys. O closes overlay if delivered; browser-reserved events may be impossible to intercept.
6. Open/close Match Center 20 times; focus returns to opener.
7. Leave home 30 minutes across real refreshes; focus remains and score/date freshness are correct.
8. Play an authorized stream with confirmed mapping and fresh health. Record startup seconds, audio sync, rendition and stalls.
9. In a controlled test source, stop the primary; confirm one retry then verified fallback, Arabic toast and no immediate switchback.
10. Two-hour playback/navigation soak. Record memory/crashes, dropped input, stalls and recovery.
11. API offline: cached real fixtures remain, freshness warning appears, no demo data is substituted.

## Evidence table
| Item | Result | Evidence | Date |
|---|---|---|---|
| All above | PENDING | No physical device available | — |

Do not mark v1 released until real fixture ingestion, authorized stream playback and these physical checks are complete.
