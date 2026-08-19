# MANI XMD A–Z Audit and Deployment Report

**Project:** `Manishshah127776/MANIX-MD`  
**Brand:** **𝙼𝙰𝙽𝙸 𝚇𝙼𝙳**  
**Production URL:** [https://manix-md.onrender.com/](https://manix-md.onrender.com/)  
**Latest deployed runtime commit:** `b211eb65`  
**Pairing-code feature commit:** `78cdbe2d`  
**Report author:** **Manus AI**  
**Verification date:** 19 August 2026 UTC

## Executive summary

The MANI XMD source audit, branding migration, command-dispatch repair, media repair, security hardening, and Render deployment work has been completed and pushed to the selected GitHub repository. The production service is live: `/healthz` returns HTTP 200 with `ok`, the dashboard is reachable, the required artwork returns HTTP 200, and the live HTML contains the exact MANI XMD branding, WhatsApp channel, and contact number.

The source-level command inventory now reconciles exactly: **723 case labels, 723 unique labels, zero duplicates, no labels missing from the generated inventory, and no extra labels**. The original dispatcher was preserved; duplicate switch labels were renamed rather than deleting commands.

The remaining production blocker is upstream WhatsApp registration. Render is healthy, but the Baileys socket is currently rejected by WhatsApp with **disconnect code 405 before a QR or pairing code is emitted**, so `/status` reports `whatsappConnected: false`, `qrAvailable: false`, and `pairingCodeAvailable: false`. This failure is consistent with a current Baileys/WhatsApp registration issue reported across multiple Baileys versions and environments [1]. The code now supports both QR and optional phone-number pairing codes, cleans invalid sessions, re-queues a fresh connection, and uses the currently reported compatibility tuple and browser identity as configurable defaults. The service is deployed and ready to complete either pairing method when WhatsApp accepts the registration handshake, but it must not be described as WhatsApp-connected until linking succeeds.

## Release and deployment history

| Commit | Purpose | Deployment state |
|---|---|---|
| `040e587a` | Completed A–Z audit, branding normalization, configuration collision fixes, security hardening, diagnostics, and documentation cleanup | Pushed to `main`; Render deployed |
| `f4224dc5` | Re-queue a fresh QR after invalid or ephemeral WhatsApp code-405 sessions | Pushed to `main`; Render deployed |
| `65dcd2fd` | Enforce QR-only pairing across WhatsApp and Telegram; remove Telegram custom pairing-code handlers | Pushed to `main`; Render deployed |
| `d0821052` | Use the current reported Baileys handshake tuple and Chrome browser identity for 405 recovery; document environment controls | Pushed to `main`; Render deployed |
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
| Pairing model | Custom pairing-code behavior was removed from the active WhatsApp and Telegram paths. `/pair` now directs users to the QR dashboard. |
| QR recovery | Code 405 cleanup now re-queues the session for fresh QR generation rather than permanently stopping. |
| Baileys compatibility | Default handshake settings are `BAILEYS_VERSION=2,3000,1033893291` and `BAILEYS_BROWSER=MANI XMD,Chrome,145.0.0`, both overridable through environment variables. |
| Reconnect lifecycle | Per-socket keep-alive intervals are cleared on reconnect, duplicate listener attachment is guarded, and `setupEventListeners` is exported correctly. |
| Protocol pinning | Baileys remains pinned to `7.0.0-rc13` for deterministic dependency behavior. |
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
| `https://manix-md.onrender.com/status` | HTTP 200; server online; WhatsApp currently disconnected with code 405; no QR or pairing code currently available |
| Dashboard HTML | Contains exact MANI XMD branding, channel URL, contact number, QR controls, pairing-code form, and `/api/pair-code` integration |
| `menu-art.jpg` | HTTP 200 |
| `bot-avatar.jpg` | HTTP 200 |
| `music-art.jpg` | HTTP 200 |
| `vcard-card.png` | HTTP 200 |

## QR and pairing-code instructions

Open [https://manix-md.onrender.com/](https://manix-md.onrender.com/) from a browser. For QR pairing, scan the displayed QR from **WhatsApp → Settings → Linked devices → Link a device**. For pairing-code linking, enter the WhatsApp number with its country code, select **Request pairing code**, then open **WhatsApp → Settings → Linked devices → Link with phone number** and enter the displayed code. Pairing codes are rate-limited, expire after 120 seconds, and are not written to disk. After successful linking, the bot is designed to send one MANI XMD connected confirmation message. Telegram `/pair` opens the same dashboard.

At the time of this report, the dashboard and API are reachable but WhatsApp rejects the registration handshake with code 405 before emitting either a QR or pairing code. Refreshing the dashboard after a successful upstream handshake is required; this is not a Render HTTP failure. A malformed number is rejected with HTTP 400, while a valid request that cannot reach WhatsApp returns HTTP 503.

## Security and configuration notes

Secrets must remain private Render environment variables. In particular, `BOT_TOKEN`, provider API keys, and deployment credentials must not be placed in GitHub source, README files, screenshots, or public issue comments. The repository contains an `.env.example` template only. Owner shell and JavaScript evaluation remain disabled unless explicitly enabled through environment variables.

The auth directory currently reports `local filesystem`. For restart-safe pairing, configure `WHATSAPP_AUTH_DIR` to a mounted persistent path such as `/var/data/manixmdtimewisher/pairing`. Render documents that persistent disks preserve local filesystem changes across deploys and restarts, while free services have inactivity and wake-up limitations [4] [5].

## Remaining limitations and recommended next actions

The free Render service can sleep after inactivity and may take time to wake [4]. A true 24/7 WhatsApp socket requires an always-on paid service or another persistent host, plus a persistent disk for the WhatsApp auth directory [5]. The in-process self-ping helps while the instance is active but cannot override the platform’s free-tier policy.

The current code-405 condition is upstream of the Express dashboard and is documented as affecting fresh Baileys registration across versions and networks [1]. The deployed code includes the current compatibility tuple, Chrome browser identity, clean-session recovery, and QR re-queueing. If WhatsApp continues rejecting registration, the next practical action is to wait for the upstream handshake issue to clear or move the socket to a stable always-on environment; repeatedly deleting and recreating the session cannot solve a server-side rejection by itself.

## References

[1]: https://github.com/WhiskeySockets/Baileys/issues/2370 "Baileys issue #2370: Connection Failure error 405"

[2]: https://whiskeysockets-baileys-94.mintlify.app/concepts/connection "Baileys Connection Lifecycle"

[3]: https://baileys.wiki/authentication/qr-code "Baileys QR Code Authentication"

[4]: https://render.com/docs/free "Render: Deploy for Free"

[5]: https://render.com/docs/disks "Render: Persistent Disks"
