# MASTER PROMPT — ASEEL MATCH TV / PS4 WEB EDITION

You are the implementation agent for **ASEEL MATCH TV**, a personal Arabic-first football match hub designed primarily for the **PlayStation 4 built-in WebKit browser** and controlled with a **DUALSHOCK 4**.

Your job is to build the project end-to-end, test it, document it, and leave it in a production-ready state. Do not stop at advice or mockups. Work iteratively, run the code, fix failures, and keep a changelog.

## 0. Non-negotiable product goal

The user wants to:
1. Open the PS4 browser.
2. Open one bookmarked URL.
3. See an Arabic, RTL, 10-foot UI dedicated to football.
4. Barcelona is the primary team.
5. La Liga is the primary competition.
6. Also cover Champions League and the five major European leagues.
7. Show today's matches, live status, score, kickoff in Asia/Baghdad time, competition, and the best available authorized viewing source.
8. The user should never need to manually browse thousands of IPTV channels, M3U files, server names, or EPG rows.
9. Pressing X on a match should open a Match Center and, where an authorized stream is configured and verified, start the best compatible source.
10. The system must be conservative: if it is unsure, it must say so rather than confidently choosing the wrong match/channel.

## 1. Legal/source boundary — mandatory

The system may ingest and manage only:
- IPTV playlists, Xtream-compatible accounts, HLS/DASH URLs, XMLTV/EPG, or other media sources that the user is authorized to use.
- Official/open football-data APIs.
- Public/free-to-air streams where redistribution/use is allowed.

The system MUST NOT:
- Crawl/search the web for unauthorized pay-TV streams.
- Discover, scrape, aggregate, or distribute pirated beIN or other protected channels.
- Bypass DRM, access controls, paywalls, token systems, device binding, or encryption.
- Extract secrets from third-party receivers/apps.

Do not weaken this rule during implementation.

## 2. PS4-first compatibility philosophy

Treat PS4 as an old/limited browser until proven otherwise.

Client requirements:
- Arabic RTL.
- Target 1920x1080 16:9, but responsive down to 1280x720.
- Vanilla HTML/CSS/JS or a compile target that outputs very conservative JS.
- Prefer ES5/ES2015-compatible client output.
- Avoid heavy frameworks in the PS4 runtime.
- Avoid WebGL, large animation libraries, blur-heavy effects, huge images, and excessive DOM.
- Use visible DOM focus states for controller navigation.
- Do not assume MediaSource, HLS.js, Gamepad API, WebSocket, Service Worker, IndexedDB, modern CSS, or codec support until capability probes confirm them.
- The first-run `/compat` page must detect and report:
  - JavaScript basic features
  - Promise / Map / Set
  - fetch and XHR
  - WebSocket
  - MediaSource existence
  - SourceBuffer
  - HTMLVideoElement.canPlayType for:
    - application/vnd.apple.mpegurl
    - application/x-mpegURL
    - video/mp4; codecs="avc1.42E01E, mp4a.40.2"
    - video/mp4; codecs="avc1.4D401F, mp4a.40.2"
    - video/mp4; codecs="avc1.640028, mp4a.40.2"
  - Gamepad API
  - localStorage
  - screen dimensions/devicePixelRatio
  - fullscreen API availability (do not depend on it; PS4 browser has its own fullscreen command)
- Save the probe result server-side as a device profile so the backend can select playback strategy for this PS4.

Playback strategy order:
A. Native `<video>` HLS if actually verified with a test asset on the target device.
B. hls.js only if MediaSource + runtime baseline are verified.
C. Backend stream gateway / remux for authorized media where technically necessary.
D. If no compatible path exists, show a clean actionable error. Never pretend playback succeeded.

## 3. Architecture

Use a monorepo with these logical modules:

### apps/tv
PS4-facing UI.
- No admin secrets.
- Arabic RTL.
- D-pad/focus navigation first.
- Controller actions:
  - X: select/play
  - O: back/close overlay
  - D-pad: move focus
  - L1/R1: optional previous/next section only if browser behavior does not conflict
  - OPTIONS: do not rely on it; browser owns it
  - Square: do not rely on it; PS4 browser uses it for fullscreen
- Mouse/pointer must remain usable as fallback.

### apps/admin
Developer/admin UI used from a PC browser.
It must show:
- providers
- playlist/EPG refresh
- channel map
- match↔EPG mapping confidence
- stream health history
- source ranking reasons
- playback errors
- device capability profile
- API quota usage
- manual override controls
Do not expose this UI publicly without auth.

### services/api
Backend API/orchestrator.
Responsibilities:
- config/secrets
- sports data provider adapters
- channel catalog
- EPG parser
- match-channel mapper
- stream health engine
- source ranker
- playback session orchestration
- quota manager
- scheduled jobs
- telemetry/logs
- local cache

### services/worker
Background jobs:
- refresh fixtures
- refresh standings
- refresh M3U/Xtream catalog
- refresh XMLTV/EPG
- map upcoming matches
- warm-up/probe candidate streams around kickoff
- maintain historical source health
- cleanup old telemetry

### packages/core
Pure shared models/logic:
- normalization
- Arabic/English team aliases
- fuzzy match functions
- confidence calculation
- ranking/scoring
- dates/timezone
- DTO/schema definitions

### packages/player
Client-side player abstraction:
- NativeHlsPlayer
- HlsJsPlayer
- BackendGatewayPlayer
- event normalization
- error classification
- failover hooks

### packages/providers
Adapters:
- football-data.org
- API-Football
- TheSportsDB (optional metadata/artwork)
- M3U
- XMLTV
- optional Xtream-compatible user-authorized provider
- optional Threadfin upstream adapter

## 4. Recommended server stack

Use a boring, dependable stack.
Preferred:
- Node.js 20+ LTS
- TypeScript on backend/admin
- Fastify or Express
- SQLite for single-user deployment
- Zod or equivalent schema validation
- pino or equivalent structured logging
- cron/scheduler library
- vitest/jest for unit tests
- Playwright for desktop integration tests
- separate PS4 physical-device test checklist

Client build must output conservative browser-compatible JavaScript. Do not ship backend TypeScript directly to PS4.

No cloud database is required for v1.

## 5. Data model

At minimum implement:

Competition
- id
- providerIds
- nameAr
- nameEn
- priority
- active

Team
- id
- providerIds
- canonicalName
- nameAr
- aliases[]
- logoUrl
- favoritePriority

Fixture
- id
- provider
- providerFixtureId
- competitionId
- homeTeamId
- awayTeamId
- kickoffUtc
- status
- elapsed
- scoreHome
- scoreAway
- lastUpdatedAt

Channel
- id
- providerId
- tvgId
- name
- normalizedName
- group
- logo
- enabled

StreamSource
- id
- channelId
- providerId
- url/opaque reference
- protocol
- enabled
- priorityOverride
- codecMetadata if known

EpgProgram
- id
- channel/tvgId
- title
- startUtc
- endUtc
- description

FixtureChannelMatch
- fixtureId
- channelId
- confidence
- reasons[]
- status = AUTO_CONFIRMED | MANUAL_CONFIRMED | NEEDS_REVIEW | REJECTED
- updatedAt

HealthSample
- streamSourceId
- timestamp
- manifestOk
- httpStatus
- firstByteMs
- playlistAgeSec
- segmentOkRatio
- avgSegmentMbps
- estimatedRequiredMbps
- resolutionHeight
- bitrate
- codec
- errors[]

SourceScore
- streamSourceId
- fixtureId
- score0to100
- confidence
- reasons[]
- timestamp

PlaybackSession
- id
- fixtureId
- chosenSourceId
- fallbackSourceIds[]
- startedAt
- startupMs
- stallCount
- totalStallMs
- fatalErrors
- failovers
- endedAt

DeviceProfile
- id
- userAgent
- PS4 flag
- capability JSON
- lastSeenAt

ProviderQuota
- provider
- date
- requestsUsed
- limit
- lastRequestAt

## 6. Sports data strategy

Primary use cases:
- daily fixtures
- competition schedule
- standings
- live score for selected/favorite matches
- match events/lineups only when quota permits

Use provider abstraction. No UI code talks directly to external APIs.

Suggested strategy:
1. football-data.org Free:
   - baseline schedule/fixtures/tables for supported competitions
   - cache aggressively
2. API-Football:
   - richer data / live mode
   - free tier is currently limited, so quota-manager is mandatory
   - prioritize Barcelona and currently viewed live match
3. TheSportsDB:
   - optional team/league artwork and metadata
   - cache artwork locally/server-side where license/terms allow

Time zone shown to user: Asia/Baghdad.

Competition priorities:
1. La Liga
2. UEFA Champions League
3. Premier League
4. Serie A
5. Bundesliga
6. Ligue 1
Then optional competitions.

Favorite team:
- FC Barcelona — highest priority.

Messi may appear as an optional watchlist/person feature later, but do not bloat v1.

## 7. Quota manager

Never burn free API quotas accidentally.

Implement:
- persistent per-provider daily usage counters
- cache-first reads
- coalesce duplicate concurrent requests
- exponential backoff
- stop calls before quota exhaustion
- configurable reserve percentage

API-Football free-mode suggested policy:
- upcoming fixtures: get from baseline provider/cache, not polling API-Football
- live Barcelona match: one consolidated update every 90–120 seconds in free mode
- currently viewed non-Barcelona live match: one consolidated update every 120 seconds if quota allows
- when paid/high-quota plan is configured, allow 15–30 second mode

Expose "data freshness" in admin telemetry.

## 8. IPTV/media ingestion

Authorized sources only.

Support:
A. M3U URL
B. local M3U file
C. XMLTV/EPG URL/file
D. optional Xtream-compatible credentials supplied by the user
E. optional Threadfin output

Secrets:
- never store credentials in public client files
- redact them from logs
- environment/config secret storage on server
- admin UI should mask secrets

Playlist normalization:
- parse tvg-id
- tvg-name
- group-title
- logo
- channel number if present
- stream URL/reference
- deduplicate
- retain provider/source lineage

Do not auto-import public pirated playlists.

## 9. EPG engine

XMLTV is a core truth source for "what is on this channel".

Build:
- streaming parser for large XMLTV
- UTC normalization
- channel/tvg-id crosswalk
- title normalization
- Arabic + English team alias support
- EPG freshness/staleness detection
- scheduled refresh
- keep only required rolling window, e.g. past 6h / next 48h

If provider EPG is missing, optional public EPG tooling may be used only where allowed, but do not scrape protected websites or bypass terms.

## 10. Match ↔ channel mapping — NO-GUESS design

This is critical.

Never choose a channel solely because its name contains "Sports 1".

For every fixture, calculate confidence from independent evidence:

Evidence examples:
- exact tvg-id + known EPG mapping
- EPG program overlaps kickoff
- both team names/aliases appear in EPG title
- competition name/alias appears
- program start time is plausible
- manually confirmed historical mapping
- channel group/category is sports
- negative evidence if title indicates another match

Recommended confidence:
- +45 both teams found
- +20 kickoff/program time overlap
- +15 competition found
- +10 known/manual historical mapping
- +5 sports group
- +5 trusted tvg-id mapping
- penalties for contradictory teams/times

Behavior:
- >= 85: AUTO_CONFIRMED
- 70–84: needs additional evidence or manual review
- <70: never auto-open
Thresholds must be configurable and validated on real data.

Admin UI must show WHY a mapping got its confidence score.

Manual confirmation should create a durable alias/mapping rule that improves future matching.

## 11. Stream Health Engine

Do not call a source "best" because it has "FHD" in its name.

For each candidate authorized source:
1. DNS/connect/HTTP success
2. redirect chain sanity
3. manifest fetch
4. measure first-byte latency
5. parse HLS variants if available
6. pick a representative compatible rendition for probing
7. fetch a small controlled number of media segments
8. calculate:
   - segment success ratio
   - download throughput
   - throughput headroom versus advertised bitrate
   - playlist freshness/live-edge movement
   - HTTP errors
   - discontinuities
   - timeout rate
   - codec/container hints
9. keep historical samples

Do not hammer providers:
- normal background: sparse checks
- 10–15 minutes before priority match: warm-up candidate sources
- during an active session: monitor only current + fallback candidates
- exponential backoff on failures

Suggested source scoring:
Gate:
- unavailable/auth failure => score 0 for current selection

Then weighted:
- 30% recent stability/history
- 25% segment throughput headroom
- 15% startup/TTFB
- 15% recent segment success ratio
- 10% compatible resolution/bitrate
- 5% playlist freshness

Penalties:
- stale live playlist
- repeated 5xx/timeout
- codec incompatible with PS4 device profile
- excessive redirects
- historical flapping

Do not over-prefer 1080p if it has poor headroom. A stable 720p is better than unstable 1080p.

Maintain:
- PRIMARY
- FALLBACK_1
- FALLBACK_2

## 12. Failover logic

Goal: hide outages, but avoid source flapping.

Player event normalization:
- waiting
- stalled
- playing
- canplay
- error
- progress
- timeupdate

Failover triggers (tune after real tests):
- fatal network/media error
- no new video progress for N seconds while not paused
- repeated manifest/segment failures
- buffer empty + recovery attempts exhausted

Before failover:
1. one local retry/recover attempt if safe
2. if still failing, switch to next verified source
3. return to live edge
4. show a small Arabic toast:
   "تم التحويل تلقائيًا إلى مصدر احتياطي"
No technical server names on the main TV UI.

Add hysteresis:
- do not switch back immediately to a previously failed source
- circuit-break it for a configurable cooldown

## 13. Threadfin integration

Threadfin is OPTIONAL, not a hard dependency.

If enabled:
- treat it as channel/M3U/XMLTV management upstream
- import its normalized output
- benefit from scheduled updates and backup channel mappings
- do not duplicate work unnecessarily

ASEEL's Health Engine still owns match-specific ranking and PS4 compatibility decisions.

Document supported Threadfin version and integration procedure.

## 14. Player layer

Create one stable API:
player.load(playbackPlan)
player.play()
player.stop()
player.getMetrics()
player.onEvent(...)

Implement:
- NativeHlsPlayer
- HlsJsPlayer
- GatewayPlayer

Hls.js:
- pin a tested version
- do feature detection
- prefer light bundle unless required features need full
- include polyfills only if the PS4 capability probe proves they are needed
- configure conservative buffer sizes
- auto quality
- emergency downswitch
- retries
- collect metrics
- do not assume it works on PS4 just because it works on Chrome

Backend gateway:
- only for authorized streams
- solve CORS/header compatibility and/or remux when needed
- do not bypass DRM/access controls
- prefer stream-copy/remux instead of CPU-heavy transcoding
- transcoding should be an explicit optional feature, not default

## 15. PS4 UI / Arabic design

Product name:
**ASEEL MATCH TV**

Tone:
premium, dark, cinematic, football-first.

Main screen:
Top bar:
- ASEEL MATCH TV logo/text
- current time
- network/system status as small unobtrusive badge

Hero:
- Barcelona's next/live match if available
- team names
- score if live
- kickoff
- competition
- source readiness indicator
- primary CTA: "شاهد الآن"

Rows:
1. مباشر الآن
2. برشلونة
3. مباريات اليوم
4. الدوري الإسباني
5. دوري أبطال أوروبا
6. الدوريات الخمس

Do not overload home screen with weather, movies, general TV, Netflix, etc. This project is football-only.

Match Center overlay:
- teams
- score/status
- kickoff
- competition
- key events if available
- optional lineup
- "شاهد الآن"
- source quality display in user language:
  - ممتاز
  - جيد
  - احتياطي
Avoid exposing raw stream URLs or server jargon.

Hidden diagnostics (admin/debug only):
- source score
- latency
- resolution
- health reasons
- mapping confidence

10-foot UI rules:
- minimum readable text
- strong focus ring
- large hit targets
- no hover-only interactions
- no tiny menus
- no long vertical settings on TV

## 16. Controller/focus engine

Do not rely only on Gamepad API.

Primary navigation should use ordinary focusable DOM elements so PS4 pointer/link navigation still works.

Implement a spatial focus manager:
- every card/button has stable id
- explicit neighbors when needed
- retain focus after data refresh
- do not reset focus every 30 seconds
- modal traps focus correctly
- O/back closes modal before navigating browser history where possible
- no focus lost on DOM replacement

Create a controller test page.

## 17. Auto-refresh without UI jumping

Fixtures/score updates should patch existing cards in place.
Do not rebuild the entire DOM while the user is navigating.

Refresh policies:
- schedule/fixtures: low frequency
- live score: provider/quota dependent
- EPG: provider-specific schedule
- source health: event-driven around relevant matches

Show "آخر تحديث" only in Match Center or diagnostics, not cluttering home.

## 18. Reliability mode

When internet/API data fails:
- cached fixtures remain visible with "آخر تحديث..."
- IPTV playback may continue if source is directly reachable
- do not blank the UI
- do not replace real cached data with fake/sample data in production
- Demo mode must be clearly marked and disabled in production

At server start:
- validate config
- check database migrations
- check provider credentials format
- test playlist/EPG reachability
- do not expose secrets

## 19. Security

Personal app but still secure:
- CSRF-safe admin actions
- admin password/token
- rate limit sensitive endpoints
- validate all URLs and schemas
- SSRF protection for arbitrary URL ingestion
- do not let TV client request arbitrary backend proxy URLs
- allow only registered source IDs
- redact credentials/tokens in logs/errors
- no secrets bundled into TV JavaScript
- dependency audit
- locked dependency versions

## 20. Observability

Implement structured logs and an admin dashboard.

Metrics:
- fixture provider latency/error
- API quota usage
- EPG freshness
- playlist freshness
- mapping confidence distribution
- stream health pass rate
- playback startup time
- stalls per hour
- failover count
- active source score
- PS4 player mode chosen

Add an exportable diagnostics bundle with secrets redacted.

## 21. Testing

Unit:
- name normalization Arabic/English
- team aliases
- timezone conversion
- XMLTV parsing
- M3U parsing
- match↔EPG scoring
- source scoring
- failover state machine
- quota manager

Fixtures:
Create realistic test cases for:
- Barcelona vs Real Madrid
- Barcelona vs Atletico
- Arabic EPG title
- English EPG title
- abbreviated team names
- same-time multiple football matches
- wrong sports channel with conflicting EPG
- stale EPG
- duplicated sources
- one dead source + one stable source

Integration:
- playlist refresh
- EPG refresh
- fixture ingestion
- mapping generation
- health probes against safe test streams
- playback plan generation

Browser:
- desktop compatibility test
- low-feature browser build test
- no-JS-modern-feature accidental regression

Physical PS4 acceptance:
1. open bookmark
2. fullscreen via PS4 browser
3. navigate only with controller
4. open/close Match Center 20 times
5. leave home open for 30 minutes while data refreshes
6. start authorized test stream
7. induce primary stream failure in test environment
8. verify fallback
9. verify no focus loss
10. verify Arabic rendering and no clipped text
11. verify no page crash after 2 hours

## 22. Performance budgets

TV initial page:
- minimize JS/CSS
- lazy-load non-critical images
- use small logo assets
- avoid videos on home background
- avoid continuous animations
- target smooth navigation on PS4

Set explicit budgets after measuring PS4:
- max initial JS
- max CSS
- max DOM node count
- max image dimensions
- memory guardrails

Do not optimize blindly; measure.

## 23. Deployment modes

Support two modes:

### LAN mode (recommended first)
Backend runs on a PC/server in the same network.
PS4 opens:
http://<LAN-IP>:<PORT>

Pros:
- easiest debugging
- credentials remain local
- stream gateway can handle CORS/remux

### Hosted mode
Public HTTPS server.
Must add:
- auth
- secure secret storage
- HTTPS
- restrictions on stream gateway
- no credential leakage

Build LAN first, hosted second.

## 24. Configuration UX

Admin onboarding wizard:
1. choose sports data providers
2. add API keys
3. import authorized IPTV provider/M3U
4. add EPG/XMLTV
5. verify channel catalog
6. run automatic fixture↔EPG mapping
7. review low-confidence mappings
8. run PS4 compatibility probe
9. run authorized test stream
10. mark setup complete

The TV UI must not show setup complexity.

## 25. Acceptance criteria for v1

v1 is NOT done until:
- project starts from a clean clone with documented commands
- Arabic RTL home loads
- Barcelona gets priority
- real fixture data loads from at least one configured provider
- authorized M3U parses
- XMLTV parses
- match↔channel confidence engine works
- low-confidence mapping does not auto-play
- health engine ranks at least two safe test sources
- player strategy is capability-driven
- controller/focus navigation works in desktop emulation
- `/compat` page exists
- admin diagnostics exists
- secrets are server-side
- tests pass
- docs explain PS4 physical testing
- no unauthorized stream discovery exists anywhere

## 26. Development workflow

Before coding:
1. Read every specification file in this handoff.
2. Inspect any existing ASEEL MATCH TV prototype.
3. Create a git branch.
4. Write `IMPLEMENTATION_PLAN.md`.
5. Build vertical slices, not one giant rewrite.

Suggested milestones:
M0 — repo/tooling/tests
M1 — PS4 compatibility probe + static Arabic UI
M2 — sports provider abstraction + fixtures
M3 — M3U/XMLTV ingestion
M4 — mapping engine + admin review
M5 — health engine + ranking
M6 — player abstraction + safe test stream
M7 — failover
M8 — Threadfin optional adapter
M9 — physical PS4 test/fixes
M10 — polish/production hardening

After each milestone:
- run tests
- record changes
- do not proceed with broken tests

## 27. Rules for agent behavior

- Do not ask the user technical questions you can resolve by inspecting the repo, docs, config, or running tests.
- When an external credential/API key is required, provide a clear placeholder and continue building everything else.
- Never fabricate successful PS4 compatibility; only mark physical-device items passed after real PS4 test evidence is supplied.
- Never claim "zero buffering" or "zero errors". Engineer automatic recovery and report measurable reliability instead.
- Prefer predictable, debuggable code over clever complexity.
- Keep the TV interface simple even if backend logic is sophisticated.
- Arabic UI text must be polished and natural.
- Preserve a `DECISIONS.md`, `CHANGELOG.md`, and `KNOWN_LIMITATIONS.md`.

Start by auditing the existing files, writing IMPLEMENTATION_PLAN.md, then implement M0 and M1 immediately.
