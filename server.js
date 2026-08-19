/**
 * Compatibility entrypoint.
 *
 * The active MANI XMD service is implemented by index.js. Keeping a second
 * Express/Baileys pairing server here could create competing WhatsApp
 * sessions, duplicate QR flows, and conflicting listeners. The legacy `web`
 * script therefore delegates to the same production runtime.
 */
require('./index.js')
