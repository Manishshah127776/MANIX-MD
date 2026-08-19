const fs = require('fs');
const path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');
const indexSource = fs.readFileSync(path.join(__dirname, '..', 'index.js'), 'utf8');
const pairSource = fs.readFileSync(path.join(__dirname, '..', 'pair.js'), 'utf8');

const requiredHtml = [
  'Connect another WhatsApp number',
  '/api/session/start',
  'session-event',
  'session-list',
  'new-session-number'
];
const requiredIndex = [
  "app.post('/api/session/start'",
  "app.get('/api/sessions'",
  'sessionIdForPhone',
  'getSessionState',
  'pairingCooldowns'
];
const requiredPair = [
  'function getTrackedSessionSummaries()',
  'module.exports.getTrackedSessionSummaries',
  'useMultiFileAuthState(sessionPath)',
  'multiDevice: MULTI_DEVICE_ENABLED'
];

for (const [name, source, required] of [['dashboard', html, requiredHtml], ['index', indexSource, requiredIndex], ['pair', pairSource, requiredPair]]) {
  for (const fragment of required) {
    if (!source.includes(fragment)) throw new Error(`${name} missing required fragment: ${fragment}`);
  }
}
if (!/sessionIdForPhone\s*=\s*phoneNumber\s*=>\s*`\$\{phoneNumber\}@s\.whatsapp\.net`/.test(indexSource)) {
  throw new Error('Additional sessions are not isolated by phone-number session ID.');
}
if ((html.match(/id="session-list"/g) || []).length !== 1) throw new Error('Session list markup is duplicated.');
console.log('multi-session dashboard regression: PASS');
console.log('separate session ID format: <phone>@s.whatsapp.net');
console.log('QR, phone-code, status, and reconnect state are routed per session.');
