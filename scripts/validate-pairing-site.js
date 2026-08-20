const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const htmlPath = path.join(root, 'public', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
const required = [
  'data-page="home"', 'data-page="pair"', 'data-page="bot"', 'data-page="commands"',
  'data-page="docs"', 'data-page="updates"', 'data-page="support"', 'data-page="dashboard"',
  'id="qr-code"', 'id="request-pairing-code"', 'id="start-session"', 'id="session-list"',
  '/api/pair-code', '/api/session/start', '/status', 'session-event', '𝙼𝙰𝙽𝙸 𝚇𝙼𝙳',
  'whatsapp.com/channel/0029Vb8XvFqD8SDvDPkdqG1f', 'wa.me/9779807044421'
];
for (const fragment of required) {
  if (!html.includes(fragment)) throw new Error(`missing website fragment: ${fragment}`);
}
for (const asset of ['bot-avatar.jpg', 'professional-pairing-hero.jpg', 'professional-operations-dashboard.jpg', 'professional-global-network.jpg']) {
  if (!fs.existsSync(path.join(root, 'public', 'assets', asset))) throw new Error(`missing asset: ${asset}`);
}
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(match => match[1]).filter(Boolean);
if (!scripts.length) throw new Error('no inline website script found');
const scriptPath = path.join(root, 'scripts', '.pairing-site-inline.js');
fs.writeFileSync(scriptPath, scripts[scripts.length - 1]);
const check = spawnSync(process.execPath, ['--check', scriptPath], { encoding: 'utf8' });
fs.unlinkSync(scriptPath);
if (check.status !== 0) throw new Error(check.stderr || 'inline website script syntax check failed');
const pageCount = (html.match(/data-page=/g) || []).length;
console.log(JSON.stringify({ success: true, pageCount, scriptCount: scripts.length, requiredFragments: required.length, assetsChecked: 4 }, null, 2));
