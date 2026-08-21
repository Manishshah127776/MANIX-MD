# malvin-baileys migration findings

Source: https://www.npmjs.com/package/malvin-baileys

The official npm page reports malvin-baileys version 2.2.5, Node.js >=20, an ESM package with CommonJS usage documented as tested, and upstream attribution to WhiskeySockets Baileys. The package page describes changes including newsletter media fixes, a minimal ESM makeInMemoryStore adaptation, safer FFmpeg spawn handling, interactive message support, and additional message options.

Isolated compatibility inspection of malvin-baileys@2.2.5 found 297 exports and verified these required symbols: default, makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, Browsers, delay, proto, getContentType, areJidsSameUser, generateWAMessage, extractMessageContent, jidNormalizedUser, downloadMediaMessage, getAggregateVotesInPollMessage, generateWAMessageFromContent, prepareWAMessageMedia, and getDevice.

The package does not export areJidsSame. The project now uses malvin-baileys.areJidsSameUser with the existing normalized-JID fallback in drenox.js.

The package's lib/Utils/validate-connection.js uses proto.ClientPayload.UserAgent.Platform.WEB. The existing postinstall compatibility patch was redirected to malvin-baileys and changes that expression to MACOS, preserving the project's previous 405 workaround.

The project dependency was changed from @whiskeysockets/baileys 7.0.0-rc14 to malvin-baileys 2.2.5, and the package engine requirement was raised to Node >=20 to match the package requirement.
