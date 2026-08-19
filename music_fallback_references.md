# Music fallback references

## yt-dlp bot-check behavior

The user’s live error is the standard YouTube extractor response: `Sign in to confirm you're not a bot`, with yt-dlp guidance to use cookies or browser authentication. Current yt-dlp issue and PO-token references:

- https://github.com/yt-dlp/yt-dlp/issues/14543
- https://github.com/yt-dlp/yt-dlp/wiki/Po-Token-Guide
- https://github.com/yt-dlp/yt-dlp/wiki/FAQ#how-do-i-pass-cookies-to-yt-dlp

## Piped fallback API

The official Piped API documentation describes the unauthenticated `GET /streams/:videoId` endpoint. Its JSON response includes `audioStreams`, where each stream has a direct `url`, `mimeType`, `codec`, `quality`, and `bitrate`, plus metadata such as `title`, `uploader`, and `thumbnailUrl`:

- https://docs.piped.video/docs/api-documentation/

The official Piped documentation lists public API instances, including `https://pipedapi.kavin.rocks`, `https://pipedapi.adminforge.de`, `https://api.piped.yt`, and `https://pipedapi.reallyaweso.me`. Public instances can become unavailable or rate-limited, so the implementation should try a short configurable list and preserve yt-dlp as the primary path:

- https://raw.githubusercontent.com/TeamPiped/documentation/main/content/docs/public-instances/index.md

## Cobalt API assessment

The official Cobalt API documentation supports `POST /` with `audioFormat: mp3`, `downloadMode: audio`, and returns tunnel or redirect URLs. However, the official repository explicitly states that there is currently no publicly available pre-hosted API and that hosted instances use bot protection and are not intended for use by other projects without explicit permission. Therefore, this project does not hardcode an unauthorized Cobalt instance; a self-hosted or user-authorized endpoint could be configured later if needed:

- https://github.com/imputnet/cobalt/blob/main/docs/api.md
- https://github.com/imputnet/cobalt/blob/main/api/README.md

## TikTok extractor issue checked 19 August 2026

Source: https://github.com/yt-dlp/yt-dlp/issues/17403

The current yt-dlp TikTok extractor issue #17403 was closed after a site break affecting current/nightly yt-dlp builds. The issue records two practical workarounds: use a realistic Chrome user-agent, optionally with an authorized cookies file, and resolve the video through TikTok’s official embed page to obtain the signed `tiktokcdn.com` media URL before downloading. The issue links merged PR #17452. This confirms that simply upgrading yt-dlp is necessary but may not be sufficient for TikTok on hosted server IPs. The linked merged PR #17452 fixes the TikTok extractor by removing impersonation from webpage requests, improving blocker-header generation, and randomizing the HTTP header fingerprint. The project’s bundled stable binary reports 2026.07.04, which includes that merged fix.

## YouTube and Instagram fallback verification — 2026-08-19

The current bundled yt-dlp binary reports `2026.07.04`, but all tested YouTube player clients (`android_vr`, `android`, `ios`, `web_safari`, `tv`, `web_creator`, and `web_embedded`) returned YouTube’s `Sign in to confirm you’re not a bot` response for a public test video without cookies. The configured Piped hosts were also checked: `pipedapi.kavin.rocks` returned HTTP 526, `pipedapi.adminforge.de` returned HTTP 403, `api.piped.yt` failed DNS resolution, `pipedapi.reallyaweso.me` returned HTTP 502, and several documented hosts were unreachable or returned non-API HTML. This confirms that a server-side YouTube fallback cannot be promised without either a valid Netscape cookie file or a healthy alternative instance.

The current Cobalt service at `https://api.cobalt.tools/` reports version `11.7.1` and lists Instagram among supported services, while its retired `/api/json` endpoint explicitly reports that the v7 API was shut down. The upstream documentation is `https://github.com/imputnet/cobalt/blob/main/docs/api.md`; implementation must use the documented current v11 request schema rather than the retired v7 path.

References: https://raw.githubusercontent.com/TeamPiped/documentation/refs/heads/main/content/docs/public-instances/index.md ; https://github.com/imputnet/cobalt/blob/main/docs/api.md ; https://github.com/yt-dlp/yt-dlp/issues/17403

## No-cookie YouTube audio fallback — 2026-08-19

The documented YTMP3.GE API was reviewed at https://ytmp3.ge/api/docs. It exposes `POST https://ytmp3.ge/api/convert` with form fields `youtube_url` and `quality`, requires no authentication, and returns JSON containing `downloadUrl` on success. A bounded probe against `https://www.youtube.com/watch?v=dQw4w9WgXcQ` returned HTTP 200, `success: true`, the video title, and a download URL. This is being treated as a best-effort fallback only after yt-dlp fails; yt-dlp remains the primary downloader. The endpoint’s documentation and response must be revalidated if it becomes unavailable or changes behavior.
