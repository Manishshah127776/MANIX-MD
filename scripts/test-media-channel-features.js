const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'drenox.js'), 'utf8')
const pairSource = fs.readFileSync(path.join(root, 'pair.js'), 'utf8')

const requiredLabels = ['case \'cinfo\'', 'case \'channelforward\'', 'case "instagram"']
for (const label of requiredLabels) {
  if (!source.includes(label)) throw new Error(`Missing dispatcher label: ${label}`)
}

if (!source.includes('fetchInstagramWithYtdlp')) throw new Error('Instagram yt-dlp helper is not wired')
if (!source.includes('fetchInstagramWithCobalt')) throw new Error('Instagram Cobalt fallback helper is not wired')
if (!pairSource.includes('forwardedNewsletterMessages')) throw new Error('Channel-forward deduplication is not wired')
if (!pairSource.includes("getSetting('bot', 'channelForwarder'")) throw new Error('Persistent channel-forwarder settings are not wired')
if (!source.includes('YT_COOKIES_PATH')) throw new Error('YouTube cookie recovery configuration is missing')

console.log(JSON.stringify({
  cinfo: true,
  channelForwarder: true,
  instagramYtdlp: true,
  instagramAuthorizedCobaltFallback: true,
  newsletterForwardDeduplication: true,
  youtubeCookieRecovery: true
}, null, 2))

const { mediaHelpers } = require(path.join(root, 'drenox.js'))
for (const helper of ['fetchInstagramWithYtdlp', 'fetchInstagramWithCobalt', 'fetchInstagramMedia']) {
  if (typeof mediaHelpers?.[helper] !== 'function') throw new Error(`Missing exported media helper: ${helper}`)
}
console.log('media helper exports ok')
