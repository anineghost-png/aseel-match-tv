# ARCHITECTURE NOTES

Client (PS4)
    |
    | HTTP(S) JSON + media plan
    v
ASEEL API / Orchestrator
    |---- SportsProvider layer
    |       |-- football-data.org
    |       |-- API-Football
    |       `-- TheSportsDB (optional)
    |
    |---- MediaCatalog
    |       |-- authorized M3U
    |       |-- authorized Xtream-compatible source (optional)
    |       |-- Threadfin adapter (optional)
    |       `-- XMLTV/EPG
    |
    |---- MatchMapper
    |       `-- fixture + EPG + aliases -> confidence
    |
    |---- HealthEngine
    |       `-- candidate streams -> metrics/history/score
    |
    |---- PlaybackOrchestrator
    |       `-- primary + fallbacks + player strategy
    |
    |---- SQLite
    `---- Worker/Scheduler

PS4 player modes:
1. Native HLS if verified
2. hls.js if MSE verified
3. backend authorized gateway/remux
4. clean unsupported error

Threadfin can sit between provider and ASEEL MediaCatalog, but is optional.
