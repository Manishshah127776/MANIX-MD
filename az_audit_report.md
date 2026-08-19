# MANI XMD A–Z Audit and Deployment Report

**Project:** `Manishshah127776/MANIX-MD`  
**Brand:** **𝙼𝙰𝙽𝙸 𝚇𝙼𝙳**  
**Production URL:** [https://manix-md.onrender.com/](https://manix-md.onrender.com/)  
**Latest deployed runtime commit:** `4d3db53c`
**Pairing-code feature commit:** `78cdbe2d`  
**405 compatibility commit:** `4479f643`
**Report author:** **Manus AI**  
**Verification date:** 19 August 2026 UTC

## Executive summary

The MANI XMD source audit, branding migration, command-dispatch repair, media repair, security hardening, and Render deployment work has been completed and pushed to the selected GitHub repository. The production service is live: `/healthz` returns HTTP 200 with `ok`, the dashboard is reachable, the required artwork returns HTTP 200, and the live HTML contains the exact MANI XMD branding, WhatsApp channel, and contact number.

The source-level command inventory now reconciles exactly: **730 case labels, 730 unique labels, zero duplicates, no labels missing from the generated inventory, and no extra labels**. The original 723-command dispatcher was preserved; the added labels cover dedicated compatibility, diagnostics, channel-information, and channel-forwarding handlers. Duplicate switch labels were renamed rather than deleting commands.

The earlier production blocker was upstream WhatsApp registration: Baileys was rejected with **disconnect code 405 before a QR or pairing code was emitted**. The deployed fix upgrades Baileys to rc14, uses the currently reported protocol tuple, and applies a guarded MACOS platform compatibility patch during installation. After rollout, `/status` changed to `WhatsApp is waiting for a fresh QR scan` with `qrAvailable: true`. The service is ready for linking, but it must not be described as WhatsApp-connected until the user scans the QR or completes pairing-code linking.

## Release and deployment history

| Commit | Purpose | Deployment state |
|---|---|---|
| `040e587a` | Completed A–Z audit, branding normalization, configuration collision fixes, security hardening, diagnostics, and documentation cleanup | Pushed to `main`; Render deployed |
| `f4224dc5` | Re-queue a fresh QR after invalid or ephemeral WhatsApp code-405 sessions | Pushed to `main`; Render deployed |
| `65dcd2fd` | Enforce QR-only pairing across WhatsApp and Telegram; remove Telegram custom pairing-code handlers | Pushed to `main`; Render deployed |
| `d0821052` | Use the current reported Baileys handshake tuple and Chrome browser identity for 405 recovery; document environment controls | Pushed to `main`; Render deployed |
| `a811743e` | Gate pairing-code requests on registration readiness and protect stale reconnect events | Pushed to `main`; Render deployed |
| `4f65dfcf` | Update the protocol tuple to `2,3000,1034074495` | Pushed to `main`; Render deployed |
| `4479f643` | Upgrade Baileys to rc14 and apply the guarded MACOS platform compatibility patch | Pushed to `main`; Render deployed |
| `5115845e` | Harden YouTube bot-check fallback, add optional cookie authentication, and retry the connected confirmation message | Pushed to `main`; Render deployed |
| `78cdbe2d` | Add optional phone-number pairing-code API, dashboard controls, Socket.IO events, Telegram instructions, and README documentation | Pushed to `main`; Render deployed |
| `b211eb65` | Return HTTP 400 for malformed pairing-code phone numbers instead of HTTP 503 | Pushed to `main`; Render deployed |
| `83205282` | Add Unicode command normalization, 20 compatibility aliases, `.fixowner`/`.enc`, unknown-command recovery, startup command audit, and the reconciled 725-label inventory | Pushed to `main`; Render deployed |
| `53f91a26` | Repair TikTok downloads with current yt-dlp and official-embed fallback, add automatic stable yt-dlp refresh, and restore `.bugmenu` routing | Pushed to `main`; Render deployed |
| `e7d7f78c` | Harden YouTube and Instagram fallbacks, add `.cinfo` and owner-only channel forwarding, persist forwarding settings, add newsletter deduplication, and update the 730-label inventory | Pushed to `main`; Render deployed |
| `4d3db53c` | Route `.play`, `.song`, `.ytmp3`, `.ytaudio`, `.ytvideo`, `.ytmp4`, and alternate YouTube download labels through yt-dlp with cookies and current player clients; add deterministic route validation | Pushed to `main`; Render deployed |

Render accepted the latest deploy hook with HTTP 202. The service endpoint confirms that the deployed application is online.

## Command and dispatcher audit

The dispatcher was audited without removing the original command set. A deterministic parser checked grouped and quoted JavaScript `case` labels against `command_inventory.json`.

| Check | Result |
|---|---:|
| Source labels | **730** |
| Unique source labels | **730** |
| Duplicate source labels | **0** |
| Inventory labels | **730** |
| Missing inventory labels | **0** |
| Extra source labels | **0** |
| Syntax checks for `drenox.js`, `pair.js`, `index.js`, `bot.js`, `setting/config.js`, and `autoload.js` | **Passed** |

The generated audit script is retained at `scripts/audit-case-labels.js` for future regression checks. The focused media/channel test also passed for cinfo, channel forwarding, Instagram fallback wiring, newsletter deduplication, and YouTube cookie recovery.

## Major fixes applied

| Area | Remediation |
|---|---|
| Branding | Replaced legacy Saad King branding and shorter `𝙼𝙰𝙽𝙸 𝚇𝙳` variants with exact **𝙼𝙰𝙽𝙸 𝚇𝙼𝙳** branding across runtime, menus, dashboard, configuration, package metadata, and documentation. |
| Contact and channel | Standardized `9779807044421` and `https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f`. |
| Menu routing | `.menu` routes to the category menu; `.allmenu`, `.info`, and `.menu2` route to the full list. Menu artwork now uses a Buffer payload and menu audio failures are non-fatal. |
| Duplicate responses | Added per-message duplicate protection and disabled the loading animation for menu commands. |
| Duplicate switch labels | Renamed duplicate case labels with alternate suffixes while preserving the original handlers and command inventory. |
| YouTube audio | `.play` and `.song` use local `yt-dlp` through `youtube-dl-exec` with local FFmpeg conversion instead of dead third-party routes. |
| YouTube media | `.ytmp3`, `.ytaudio`, `.ytvideo`, and `.ytmp4` were repaired around the same local download path. |
| TikTok | `.tiktok <link>` routes to the downloader; the former stalker collision was renamed `.ttstalk`. |
| Channel reactions | `.reactch` uses native Baileys newsletter metadata/reaction methods instead of the blocked third-party security route. |
| Stickers | `sendImageAsSticker` and `sendVideoAsSticker` return the correct values, use Buffer payloads, create required directories, and clean temporary files safely. |
| Media helpers | `convertAudioBuffer` uses `execFile` with FFmpeg; `sendMedia` compatibility support was added to the socket helper layer. |
| VCards and artwork | VCard/card artwork, bot avatar, menu artwork, and music artwork were deployed under `public/assets/`. |
| Pairing model | The deployed dashboard supports both QR pairing and optional phone-number pairing codes; Telegram `/pair` directs users to the shared dashboard. |
| QR recovery | Code 405 cleanup now re-queues the session for fresh QR generation rather than permanently stopping. |
| Baileys compatibility | Baileys is upgraded to `7.0.0-rc14`; default handshake settings are `BAILEYS_VERSION=2,3000,1034074495` and `BAILEYS_BROWSER=MANI XMD,Chrome,145.0.0`. Both remain overridable through environment variables, and the guarded postinstall patch applies the MACOS registration-platform workaround. |
| Reconnect lifecycle | Per-socket keep-alive intervals are cleared on reconnect, duplicate listener attachment is guarded, and `setupEventListeners` is exported correctly. |
| Protocol pinning | Baileys is pinned to `7.0.0-rc14` for deterministic dependency behavior. |
| Path safety | Runtime state, default files, and legacy fallbacks use absolute `__dirname`-based paths. |
| Auth loading | `autoload.js` imports `fs`, scans the configured auth root, and does not delete the active `pair.js` module cache. |
| Competing servers | `server.js` is a compatibility redirect to `index.js`, preventing competing WhatsApp sockets. |
| Global configuration | Removed the stale `global.owner` overwrite, removed duplicate `global.prefa`, corrected `DEVELOPER`, and corrected `OWNER_NAME`. |
| Credentials | Provider keys were moved to environment variables and hardcoded credentials were scrubbed. |
| Owner consoles | JavaScript and shell owner consoles are disabled by default and require explicit environment flags. |
| Math evaluation | `.math` uses bounded `mathjs` behavior instead of unrestricted `eval`. |
| Diagnostics | Empty catches were replaced with contextual, non-secret diagnostics. |
| Dependencies | Unused vulnerable YouTube dependencies were removed. |
| Telegram runtime | Telegram polling safely no-ops when `BOT_TOKEN` is absent, while WhatsApp can continue independently. |

## Live production verification

| Endpoint or asset | Observed result |
|---|---|
| `https://manix-md.onrender.com/healthz` | HTTP 200; body `ok` |
| `https://manix-md.onrender.com/status` | HTTP 200; server online; WhatsApp waiting for a fresh QR scan; `qrAvailable: true` |
| Dashboard HTML | Contains exact MANI XMD branding, channel URL, contact number, QR controls, pairing-code form, and `/api/pair-code` integration |
| `menu-art.jpg` | HTTP 200 |
| `bot-avatar.jpg` | HTTP 200 |
| `music-art.jpg` | HTTP 200 |
| `vcard-card.png` | HTTP 200 |

## QR and pairing-code instructions

Open [https://manix-md.onrender.com/](https://manix-md.onrender.com/) from a browser. For QR pairing, scan the displayed QR from **WhatsApp → Settings → Linked devices → Link a device**. For pairing-code linking, enter the WhatsApp number with its country code, select **Request pairing code**, then open **WhatsApp → Settings → Linked devices → Link with phone number** and enter the displayed code. Pairing codes are rate-limited, expire after 120 seconds, and are not written to disk. After successful linking, the bot is designed to send one MANI XMD connected confirmation message. Telegram `/pair` opens the same dashboard.

At the time of this report, the dashboard and API are reachable and WhatsApp is publishing a fresh QR. Refresh the dashboard if the QR expires. A malformed number is rejected with HTTP 400, while a valid request that cannot reach WhatsApp returns HTTP 503.

## Security and configuration notes

Secrets must remain private Render environment variables. In particular, `BOT_TOKEN`, provider API keys, and deployment credentials must not be placed in GitHub source, README files, screenshots, or public issue comments. The repository contains an `.env.example` template only. Owner shell and JavaScript evaluation remain disabled unless explicitly enabled through environment variables.

The auth directory currently reports `local filesystem`. For restart-safe pairing, configure `WHATSAPP_AUTH_DIR` to a mounted persistent path such as `/var/data/manixmdtimewisher/pairing`. Render documents that persistent disks preserve local filesystem changes across deploys and restarts, while free services have inactivity and wake-up limitations [4] [5].

## Remaining limitations and recommended next actions

The free Render service can sleep after inactivity and may take time to wake [4]. A true 24/7 WhatsApp socket requires an always-on paid service or another persistent host, plus a persistent disk for the WhatsApp auth directory [5]. The in-process self-ping helps while the instance is active but cannot override the platform’s free-tier policy.

The code-405 condition was upstream of the Express dashboard and was addressed with the current protocol tuple plus the Baileys MACOS registration-platform workaround documented in the referenced issue and pull request [1] [6]. The deployed code includes rc14, clean-session recovery, registration-readiness gating, and QR re-queueing. The live service now publishes a QR; the remaining action is for the user to complete linking and then verify the connected confirmation message.

## References

[1]: https://github.com/WhiskeySockets/Baileys/issues/2370 "Baileys issue #2370: Connection Failure error 405"

[2]: https://whiskeysockets-baileys-94.mintlify.app/concepts/connection "Baileys Connection Lifecycle"

[3]: https://baileys.wiki/authentication/qr-code "Baileys QR Code Authentication"

[4]: https://render.com/docs/free "Render: Deploy for Free"

[5]: https://render.com/docs/disks "Render: Persistent Disks"

[6]: https://github.com/WhiskeySockets/Baileys/issues/2376 "Baileys issue #2376: stale protocol version causing 405"

[7]: https://github.com/WhiskeySockets/Baileys/pull/2365 "Baileys pull request #2365: MACOS platform compatibility workaround"

## Post-report reliability patch

After the initial audit, the music path received an additional resilience update. `.play`, `.song`, `.ytmp3`, and `.ytaudio` retain local `yt-dlp` as the primary extractor, optionally use a Netscape cookies file through `YT_COOKIES_PATH`, detect YouTube bot-check failures, and attempt configured Piped audio instances before returning a concise recovery hint. Public fallback services remain best-effort; an authorized cookies file is the reliable Render-side solution when YouTube challenges the hosting IP.

The WhatsApp connected confirmation now logs its targets and retries up to three times after the socket opens. It prefers the authenticated account JID and falls back to `OWNER_NUMBER` or `MANIX_CONTACT_NUMBER`, preventing transient post-auth send failures from silently losing the notice. The command inventory now contains 726 unique labels with zero duplicates: the original 723 labels plus dedicated `.fixowner`, `.enc`, and `.bugmenu` handlers.

The post-audit reliability patch is deployed in `5115845e`. Validate `.play`/`.song` with a public video after WhatsApp linking; if YouTube still challenges Render’s IP, configure an authorized Netscape cookies file through `YT_COOKIES_PATH`. The connected notice now retries three times after authentication and should be confirmed after the next QR or pairing-code link.

## Current command-resolution patch

The dispatcher now normalizes Unicode small-cap and Cyrillic-stylized command spellings before routing them, so menu forms such as `.ᴀʟʟᴍᴇɴᴜ`, `.spotiғy`, and `.ғlux` resolve to their ASCII handlers. A frozen compatibility table covers 26 legacy, stylized, and channel-tool names, including `.ai`, `.chatgpt`, `.antidelete`, `.closegroup`, `.opengroup`, `.s`, `.tr`, `.vv2`, `.whoami`, `.setppbot`, `.setprefix`, `.welcomecard`, `.protect`, `.kickadmins`, `.maid`, `.nwaifu`, `.rwaifu`, `.script`, `.llama`, `.greatcheck`, `.channelinfo`, `.chinfo`, `.channelforwarder`, `.forwardchannel`, and `.cf`.

Two dedicated owner/utility handlers were added without removing any original command: `.fixowner` refreshes the owner allowlist using the authenticated sender, and `.enc <text>` returns a Base64 encoding. Valid-prefix commands that do not resolve now receive a formatted command-not-found response pointing users to `.menu`; command execution failures receive a single user-facing recovery message, with the duplicate-reply guard preserved.

Startup now emits a `[COMMAND AUDIT]` block covering the loaded dispatcher count, alias count, duplicate labels, missing dependencies, failed modules, and broken-command status. The deterministic audit scripts report **730 source labels, 730 unique labels, zero duplicates, and no inventory mismatch**. Menu comparison reports no unresolved command names; `0*` and `runway<prompt>` are retained as display-only menu artifacts.

## Media and bugmenu repair release

The TikTok path was repaired after Render reported `Unexpected response from webpage request`. The bot now passes a Chrome-compatible user-agent and authorized cookies when configured, uses the current stable yt-dlp binary, downloads through yt-dlp itself so extractor-specific CDN headers are preserved, and falls back to TikTok’s official embed state when the primary extractor cannot complete. The current bundled binary reports `2026.07.04`, and the Render postinstall now runs `yt-dlp -U` through `scripts/update-ytdlp.js`; failures are non-fatal so a temporary updater outage cannot prevent deployment.

The missing `.bugmenu` dispatcher case was added as a reliable text-only diagnostic menu advertising only real handlers: `.ping`, `.speed`, `.runtime`, `.debug`, `.admincheck`, `.glitch`, `.glitchtext`, and `.menu`. This avoids image-payload failures and prevents the command from falling through to the unknown-command response.

Local verification passed with a public TikTok video: yt-dlp downloaded a valid 4,172,714-byte MP4, with title and uploader metadata returned. The final dispatcher inventory is now **730 labels, 730 unique labels, and zero duplicates**, reflecting the original command set plus the compatibility, diagnostics, channel-information, and channel-forwarding additions.

## YouTube, Instagram, cinfo, and channel-forwarder repair release

The final YouTube command-routing patch is deployed in `4d3db53c`. Every requested YouTube play/download route now calls `youtube-dl-exec` directly: `.play`, `.song`, `.ytmp3`, `.ytaudio`, `.ytvideo`, `.ytmp4`, `.ytmp4_alt2`, and `.ytvideo_alt2`. The alternate video route no longer calls the NexOracle `downloader/ytmp4` endpoint. All routes use the current YouTube player clients, EJS remote components, and `YT_COOKIES_PATH` when configured. A deterministic source test confirms all four grouped route families are yt-dlp-backed, and the dispatcher audit remains at 730 unique labels with zero duplicates.

The YouTube recovery path was hardened again. The primary yt-dlp calls now use the current EJS remote components and explicit `android_vr`, `web_safari`, and `tv` player clients before trying the expanded, JSON-validated Piped instance list. Piped responses that return an HTML error page with HTTP 200 are rejected instead of being treated as stream metadata. Downloaded audio is checked for non-empty bytes, and the final user-facing message distinguishes an upstream YouTube server block from a local command failure.

This validation environment still observed YouTube’s anonymous server challenge and no reachable Piped instance returned playable audio for the public test video. That is an upstream provider restriction, not a dispatcher failure. The reliable production solution is an authorized Netscape-format cookie file configured through `YT_COOKIES_PATH`; the code now supports it consistently, while the Render postinstall continues to refresh the bundled yt-dlp binary through `scripts/update-ytdlp.js`.

Instagram was changed from the retired NexOracle-only HTTP route to current yt-dlp extraction with an explicitly configured authorized Cobalt v11 fallback. Raw HTTP 400/login/rate-limit responses are no longer exposed to users; they are converted into a concise recovery message explaining `INSTAGRAM_COOKIES_PATH` and authorized `COBALT_API_URL`. The local public-reel probe confirmed Instagram’s current anonymous rate limit, so protected or rate-limited accounts still require valid cookies or an authorized provider endpoint.

The new `.cinfo <WhatsApp channel link>` command resolves native newsletter metadata and reports the channel name, JID, follower count, description, creation time, and invite link. The owner-only `.channelforward <channel link> [destination]` command persists a source channel and destination JID in `setting.json`, supports `.channelforward off`, and forwards new newsletter messages in `pair.js` with a bounded per-session deduplication set. Aliases `.channelinfo`, `.chinfo`, `.channelforwarder`, `.forwardchannel`, and `.cf` are registered. The commands are also listed in the utility menu and repository help response.

The current release candidate has **730 dispatcher labels, 730 unique labels, zero duplicates, and no inventory mismatch**. The focused feature test passed for cinfo, channel forwarding, Instagram provider wiring, newsletter deduplication, and YouTube cookie recovery; JavaScript syntax checks for `drenox.js` and `pair.js` passed.

### Provider configuration requirements

| Feature | Required configuration for protected or rate-limited providers |
|---|---|
| YouTube `.play` / `.song` | `YT_COOKIES_PATH` pointing to an authorized Netscape cookies file; Piped remains best-effort |
| Instagram `.instagram` / `.ig` / `.igdl` | `INSTAGRAM_COOKIES_PATH` for login/rate-limited posts, or an authorized `COBALT_API_URL` and optional `COBALT_API_KEY` |
| Channel forwarding | Owner runs `.channelforward <source channel link> [destination JID]`; destination defaults to the current chat |
| Channel information | Any user can run `.cinfo <channel link>` after WhatsApp is connected |


## Screenshot-confirmed cinfo fallback repair

The screenshot showed `.cinfo` reaching the command handler but failing inside Baileys newsletter metadata parsing with `Unexpected token ... is not valid JSON`. The handler now catches native metadata-parser failures and falls back to the public WhatsApp channel invite page. The fallback extracts the channel title, follower count, public invite identifier, and description without exposing the raw parser exception to users.

Local verification against `https://whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f` passed: it returned **MANIX MD 💐**, **2 followers**, public identifier `0029Vb8XvFqD8SDvDPkdqG1f`, and source `public WhatsApp channel page`. The native metadata path remains preferred when Baileys returns a valid newsletter object, preserving JID and creation-time details when available.

The YouTube and Instagram messages visible in the screenshot are provider access restrictions rather than dispatcher failures. YouTube is rejecting anonymous Render traffic and Instagram is rate-limiting anonymous server downloads. The bot now uses yt-dlp first and returns actionable cookie/authorized-provider guidance; no code-only change can legitimately bypass those upstream account or IP restrictions.

**Screenshot-fix verification:** `drenox.js` syntax passed; cinfo public-page fallback passed; yt-dlp route test passed; dispatcher inventory remained **730 labels, 730 unique, zero duplicates**.
