# MANI XMD Command Center Visual QA

Date: 2026-08-20

The local preview was inspected at `#home` and `#bot` using the rebuilt page. The Overview route renders the fixed application sidebar, Overview/Pairing/Bot controls/Commands/Documentation/Updates/Support/System health/About navigation, live connection overview cards, backend health labels, 3D zoom/reset controls, and the WebGL fallback card. The Bot route renders the existing command demo plus the new Runtime controls card with Start / pair, Reconnect, Restart, and Stop session actions. The top navigation now says Documentation rather than Docs, and the footer/brand surface uses `𝙼𝙰𝙽𝙸 𝚇𝙼𝙳` without the prior skull decorative footer text.

The browser showed the expected disconnected state because the live status feed reported no active WhatsApp session; no online state was fabricated. The 3D fallback card is expected in the sandbox browser where WebGL is unavailable or disabled, while pairing controls remain present. The preview HTML reflected the rebuilt source after cache-busting the local URL.
