const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '@whiskeysockets', 'baileys', 'lib', 'Utils', 'validate-connection.js');

if (!fs.existsSync(target)) {
  console.warn(`[baileys-405] Skipping patch; target is not installed: ${target}`);
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const stale = ': proto.ClientPayload.UserAgent.Platform.WEB,';
const fixed = ': proto.ClientPayload.UserAgent.Platform.MACOS,';

if (source.includes(fixed)) {
  console.log('[baileys-405] MACOS platform compatibility is already present.');
  process.exit(0);
}

if (!source.includes(stale)) {
  throw new Error('[baileys-405] Expected Baileys platform expression was not found; refusing an unsafe blind patch.');
}

const updated = source.replace(stale, fixed);
fs.writeFileSync(target, updated);
console.log('[baileys-405] Applied MACOS platform compatibility patch for fresh WhatsApp registration.');
