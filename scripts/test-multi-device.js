const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const pair = fs.readFileSync(path.join(root, 'pair.js'), 'utf8')
const index = fs.readFileSync(path.join(root, 'index.js'), 'utf8')
const dashboard = fs.readFileSync(path.join(root, 'public', 'index.html'), 'utf8')
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))

const checks = [
  ['malvin-baileys dependency is present', Boolean(packageJson.dependencies?.['malvin-baileys'])],
  ['Multi-file auth state is enabled', pair.includes('useMultiFileAuthState')],
  ['Auth state is supplied to the socket', pair.includes('auth: state')],
  ['Credential updates are persisted', pair.includes('bad.ev.on("creds.update", saveCreds)') || pair.includes("bad.ev.on('creds.update', saveCreds)")],
  ['Full Multi-Device history sync is enabled', pair.includes('syncFullHistory: true')],
  ['QR linking is available', pair.includes('QRCode.toDataURL') && pair.includes("qr")],
  ['Phone-code linking is available', pair.includes('requestPairingCode')],
  ['Multi-Device status is exposed', index.includes('multiDevice: MULTI_DEVICE_ENABLED')],
  ['Both linking methods are exposed', index.includes("['qr', 'phone-code']")],
  ['Dashboard identifies Multi-Device mode', /Multi-Device/i.test(dashboard)],
  ['Connected notice identifies Multi-Device mode', pair.includes('ᴍᴜʟᴛɪ-ᴅᴇᴠɪᴄᴇ: ᴇɴᴀʙʟᴇᴅ')]
]

const failed = checks.filter(([, passed]) => !passed)
for (const [label, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'} ${label}`)
if (failed.length) process.exitCode = 1
else console.log(`Multi-Device regression checks passed: ${checks.length}`)
