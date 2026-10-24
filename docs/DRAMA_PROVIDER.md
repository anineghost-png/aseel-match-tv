# Drama Live provider bridge

ASEEL MATCH TV can accept a source handoff from a Drama Live installation that the operator is authorized to use.

## Supported handoffs

- Direct M3U/M3U8 URL.
- Xtream server + username + password share text, in English or Arabic labels.
- Legacy Drama Live Xtream relay URLs are normalized to the provider's direct standard `get.php` playlist so credentials are not sent through the legacy relay by ASEEL MATCH TV.
- FG Code URLs are detected, but they are not treated as M3U. FG is a separate content format and remains in resolution mode until the actual authorized source is supplied by Drama Live.

## Admin flow

1. Run the persistent ASEEL MATCH TV backend.
2. Open `/admin` on a trusted device and authenticate with `ADMIN_TOKEN`.
3. In **ربط Drama Live**, paste the text produced by Drama Live's share action.
4. Confirm that you are authorized to use the source.
5. Use **فحص بدون حفظ** first. The preview returns only the source kind and host.
6. Add the returned host to `MEDIA_ALLOWED_HOSTS` if it is not already allowed, restart the backend, then use **ربط وتحديث القنوات**.
7. Generate/review fixture mappings and test playback on `/compat` and the TV UI.

## Security

- Do not commit Drama Live share text, playlists, usernames, passwords, tokens, or provider URLs.
- The TV UI never receives the upstream provider URL or credentials.
- Admin diagnostics redact provider URLs and source URLs.
- All remote source URLs pass through `SafeNet` allow-list and SSRF validation.
- Data stored by the persistent backend belongs in `DATA_DIR`; protect that directory as sensitive application state.

## FG Code note

Drama Live treats FG Code separately from M3U and Xtream. ASEEL MATCH TV deliberately does not guess that an FG URL is an M3U playlist. If the installed application is using FG, use Drama Live's own share action to obtain its source handoff. The bridge will identify the handoff and report whether it is ready for direct import.
