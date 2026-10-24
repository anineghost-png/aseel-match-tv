# Optional Threadfin upstream
Threadfin is optional. No Threadfin instance/version has been tested here: integration is through its exported M3U/XMLTV contracts, not version-specific APIs. Record your exact Threadfin version in the PS4 test evidence.

1. Configure only your authorized channels in Threadfin.
2. Put its exact host/IP in MEDIA_LAN_HOSTS (private LAN) or MEDIA_ALLOWED_HOSTS (public); restart ASEEL. Never use wildcard hosts.
3. Send authenticated POST /api/admin/providers with `{ "id":"threadfin", "type":"threadfin", "authorized":true, "m3uUrl":"<actual exported M3U URL>", "xmltvUrl":"<actual XMLTV URL>" }`. Keep real URLs/credentials out of git, chat, and TV files.
4. The worker refreshes hourly with exponential backoff and regenerates mappings. Review low-confidence mappings in /admin.
5. ASEEL owns source health, playback profiles and fallback selection. No Threadfin installation or external broadcast discovery is performed.

Sources imported from files are snapshots; paste/upload a replacement to refresh. Provider URL configurations are persisted only inside ignored data/ SQLite (not encrypted at rest); protect the server filesystem and backups.
