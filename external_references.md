# External References for Final Audit

1. Baileys issue #2370, “Connection Failure error 405”: https://github.com/WhiskeySockets/Baileys/issues/2370. The issue documents fresh QR and pairing-code registration failures with status 405 across Baileys 6.x and 7.0.0 RC versions, with community reports that a specific WhatsApp protocol tuple and current browser identity temporarily worked for some deployments.

2. Baileys connection lifecycle documentation: https://whiskeysockets-baileys-94.mintlify.app/concepts/connection. It documents `connection.update`, disconnect handling, QR events, reconnect behavior, and the distinction between logged-out and reconnectable states.

3. Baileys QR authentication documentation: https://baileys.wiki/authentication/qr-code. It states that QR authentication is emitted through `connection.update`, should be rendered by the frontend, and that a post-scan disconnect/restart is expected during linking.

4. Render free deployment documentation: https://render.com/docs/free. It explains that free web services spin down after inactivity and wake on a subsequent HTTP request or WebSocket connection.

5. Render persistent disks documentation: https://render.com/docs/disks. It states that persistent disks preserve local filesystem changes across deploys and restarts and are available for paid Render services.

## 2026-08-19 no-cookie YouTube audio verification

- `https://ytmp3.ge/api/convert` returned a successful `downloadUrl`, but the returned media host served `text/html; charset=utf-8` beginning with `<!DOCTYPE html>` instead of an MP3. A non-empty-byte check was therefore insufficient.
- `https://api.invidious.io/instances.json` returned no usable HTTPS API instances during the bounded probe for video `284Ov7ysmfA`.
- Direct `yt-dlp` extraction for `dQw4w9WgXcQ` succeeded with the `96` combined format and local FFmpeg conversion, producing a valid MP3; the same route was rejected for the screenshot video `284Ov7ysmfA` across tested clients.
- Official Cobalt API documentation: https://github.com/imputnet/cobalt/blob/main/docs/api.md. It documents `POST /` with `downloadMode: audio`, `audioFormat: mp3`, and `audioBitrate`, but warns that hosted instances use bot protection and are not intended for other projects without permission. No hosted Cobalt instance was added as a default production dependency.
- The production patch validates magic bytes/content type, rejects HTML masquerading as audio, tries a compatible yt-dlp route before third-party fallbacks, and never sends an invalid buffer to WhatsApp.

## 2026-08-19 exact-link `.play` investigation

- The exact screenshot URL `https://youtube.com/watch?v=284Ov7ysmfA` still returns YouTube HTTP 429 / `Sign in to confirm you’re not a bot` across the tested no-cookie yt-dlp client combinations.
- The configured Piped instances were unavailable for this URL: several returned 502/403, one had DNS failure, and multiple returned non-JSON HTTP 200 bodies. No playable Piped stream was found.
- Official Cobalt API documentation: https://github.com/imputnet/cobalt/blob/main/docs/api.md. A valid request uses `Accept: application/json`, `Content-Type: application/json`, `downloadMode: audio`, `audioFormat: mp3`, and `audioBitrate`; the response may be a tunnel or redirect URL. The same documentation explicitly says hosted instances such as `api.cobalt.tools` are not intended for other projects without explicit permission, so no public hosted instance is being silently hard-coded.
- Cobalt repository and self-hosting source: https://github.com/imputnet/cobalt. A self-hosted instance would be the technically reliable route, but it requires separate persistent deployment and resource configuration; the current Render bot does not include that service.
- A bounded POST probe to `https://api.cobalt.tools/` using the documented audio request returned HTTP 400 with `error.api.auth.jwt.missing`. The hosted service therefore cannot be integrated anonymously, and no authentication token was available or added.
- The opt-in community instance list at https://codeberg.org/kwiat/instances states that instances must be added only after the hoster explicitly consents to participate. It is therefore unsafe and inappropriate to hard-code arbitrary public Cobalt instances as an anonymous production dependency.
- Cobalt’s own instance settings page, https://cobalt.tools/settings/instances, supports custom processing servers and access keys, reinforcing that a user-owned/self-hosted instance or an explicitly authorized API key is the appropriate integration path.
- The loader.to migration documentation at https://video-download-api.com/loader-to-button-api documents the legacy-compatible `/ajax/download.php` flow and progress polling, but directs new integrations toward `p.savenow.to` and says REST production downloads use an API key. The exact legacy probe worked once for the requested video, but the provider’s production API-key requirement and changing endpoint policy make it unsuitable as an unconfigured permanent dependency.
## OminiSave `.song` provider verification (2026-08-19)

The user-provided endpoint `https://www.ominisave.com/api/ytmp3` was tested with `https://youtube.com/watch?v=284Ov7ysmfA`. It returned HTTP 200 JSON with nested `result.url`, `result.downloadURL`, and `result.title` fields. The returned download URL responded with `content-type: audio/mpeg`, an ID3/MP3 file, and ffprobe reported `format_name=mp3`, duration `183.327347` seconds, and size `2,982,356` bytes. This supports using OminiSave as an optional no-cookie `.song` provider, with strict JSON-key, content-type, and playable-audio validation. Source endpoint: https://www.ominisave.com/api/ytmp3

