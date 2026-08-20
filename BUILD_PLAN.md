# MANI XMD Dashboard Build Plan

## Existing surfaces preserved

The existing single-file SPA remains the integration boundary. It already contains real backend calls for `/healthz`, `/status`, `/api/pair-code`, `/api/sessions`, and `/api/start-session`, Socket.IO events for `qr`, `pairing-code`, `connected`, `disconnected`, `session-update`, and `session-list`, and the existing QR, phone-code, multi-session, commands, documentation, updates, support, settings, and legal views. These hooks must remain intact.

## Route plan

The application shell will expose Overview (`home`), Pairing (`pair`), Bot (`bot`), Commands (`commands`), Documentation (`docs`), Updates (`updates`), Support (`support`), and Settings (drawer). A dedicated System Health view will use the existing live status state and route to `health`; About will reuse the existing brand/support information on `about`. Existing routes remain valid as aliases and are not removed.

## Component plan

The shell will gain a compact desktop sidebar and accessible mobile drawer. The Overview page will become the command center with connection overview, session controls, the interactive 3D device, backend health, recent activity, and quick actions. Pairing will retain the real QR and phone-code flows while adding a visible four-step state tracker, expiry/copy/retry/cancel affordances, and clearer loading/error/success states. Bot and Commands will receive concise product language, runtime controls, searchable filters, permission metadata, examples, and clipboard feedback. System Health and About will be lightweight live/status and trust pages.

## Design and reliability rules

Use deep navy/charcoal tokens, restrained blue-violet accents, WhatsApp green only for live success and primary pairing actions, accessible labels, focus styles, reduced-motion support, a WebGL-disabled fallback, and no fabricated pairing data. Three.js remains vendored locally and is loaded lazily by the current client script. No secrets or tokens are added to frontend code.

## Validation plan

Run the existing pairing-site validator, all Node syntax checks, command inventory/audit checks, a local static preview, route/API smoke checks, and a live Render health/status verification after push and deploy.
