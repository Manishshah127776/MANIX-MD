# MANI XMD A–Z Audit and Deployment Report

**Project:** `Manishshah127776/MANIX-MD`  
**Brand:** **𝙼𝙰𝙽𝙸 𝚇𝙼𝙳**  
**Production URL:** [https://manix-md.onrender.com/](https://manix-md.onrender.com/)  
**Latest deployed runtime commit:** `4479f643`
**Pairing-code feature commit:** `78cdbe2d`  
**405 compatibility commit:** `4479f643`
**Report author:** **Manus AI**  
**Verification date:** 19 August 2026 UTC

## Executive summary

The MANI XMD source audit, branding migration, command-dispatch repair, media repair, security hardening, and Render deployment work has been completed and pushed to the selected GitHub repository. The production service is live: `/healthz` returns HTTP 200 with `ok`, the dashboard is reachable, the required artwork returns HTTP 200, and the live HTML contains the exact MANI XMD branding, WhatsApp channel, and contact number.

The source-level command inventory now reconciles exactly: **723 case labels, 723 unique labels, zero duplicates, no labels missing from the generated inventory, and no extra labels**. The original dispatcher was preserved; duplicate switch labels were renamed rather than deleting commands.

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
| `78cdbe2d` | Add optional phone-number pairing-code API, dashboard controls, Socket.IO events, Telegram instructions, and README documentation | Pushed to `main`; Render deployed |
| `b211eb65` | Return HTTP 400 for malformed pairing-code phone numbers instead of HTTP 503 | Pushed to `main`; Render deployed |

Render accepted the latest deploy hook with HTTP 202. The service endpoint confirms that the deployed application is online.

## Command and dispatcher audit

The dispatcher was audited without removing the original command set. A deterministic parser checked grouped and quoted JavaScript `case` labels against `command_inventory.json`.

| Check | Result |
|---|---:|
| Source labels | **723** |
| Unique source labels | **723** |
| Duplicate source labels | **0** |
| Inventory labels | **723** |
| Missing inventory labels | **0** |
| Extra source labels | **0** |
| Syntax checks for `drenox.js`, `pair.js`, `index.js`, `bot.js`, `setting/config.js`, and `autoload.js` | **Passed** |

The generated audit script is retained at `scripts/audit-case-labels.js` for future regression checks.

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

The WhatsApp connected confirmation now logs its targets and retries up to three times after the socket opens. It prefers the authenticated account JID and falls back to `OWNER_NUMBER` or `MANIX_CONTACT_NUMBER`, preventing transient post-auth send failures from silently losing the notice. The command inventory remains 723 unique labels with zero duplicates after this patch.

The current release candidate still requires a new Render deployment for these post-audit changes. After deployment, validate `.play`/`.song` with a public video and confirm the single connected notice after QR or pairing-code linking.
