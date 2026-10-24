# ACCEPTANCE / TEST PLAN

## Correctness tests
- EPG has both team names, correct time, correct competition -> high confidence.
- EPG has only one team -> not enough for autoplay unless additional strong evidence exists.
- Wrong simultaneous match on same sports network -> reject.
- Stale EPG -> reject autoplay.
- Manual confirmation persists.

## Health tests
Create safe test streams:
A: stable 1080p
B: stable 720p
C: 1080p with intentional stalls
D: dead
Expected:
- stable 1080p wins if bandwidth headroom sufficient.
- stable 720p beats unstable 1080p.
- dead source never selected.
- failover moves from C/D to healthy fallback.

## PS4 tests
- Arabic text visible and uncut at 1080p.
- Bookmark opens correctly.
- Square browser fullscreen still works.
- Left-stick pointer remains usable.
- D-pad/focus route works if browser sends navigation keys.
- X can activate focused controls.
- O behavior does not unexpectedly close browser in critical flows.
- two-hour soak test.
- live refresh does not steal focus.
